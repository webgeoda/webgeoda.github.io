
// Author: xunli at asu.edu
define(['jquery', './utils','./cartoProxy', './mapManager', 'd3', 'ss', 'jquery.colorpicker','colorbrewer'], function($, Utils, CartoProxy, MapManager, d3, ss) {

var ChoroplethDlg = (function($){
  var instance;

  function init() {
    // singleton

  // private methods/vars
  var sel_var = $('#sel-var');

  var GetMapCanvas = function() {
    return MapManager.getInstance().GetMapCanvas();
  };

  $('#colorpicker-fill').colorpicker({
    parts:  [  'map', 'bar', 'swatches', 'footer'],
    close: function(evt, clr) {
      clr = '#' + clr.formatted;
      var mapcanvas = GetMapCanvas();
      if (clr != mapcanvas.FILL_CLR)
        mapcanvas.update({'fill_color':clr});
    },
  });
  $('#colorpicker-stroke').colorpicker({
    parts:  [  'map', 'bar', 'swatches', 'footer'],
    close: function(evt, clr) {
      clr = '#' + clr.formatted;
      var mapcanvas = GetMapCanvas();
      if (clr != mapcanvas.STROKE_CLR)
        mapcanvas.update({'stroke_color':clr});
    },
  });
  $('#stroke-width').change(function(){
    var str_wdt = parseFloat($(this).val());
    var mapcanvas = GetMapCanvas();
    if (str_wdt != mapcanvas.STROKE_WIDTH)
      mapcanvas.update({'stroke_width':str_wdt});
  });
  $('#opacity-slider').slider({
    min: 0, max: 1, step: 0.01, value: 0.9,
    slide: function( evt, ui) {
      var opacity = ui.value;
      $('#opacity').text(opacity);
      var mapcanvas = GetMapCanvas();
      mapcanvas.update({'transparency':opacity});
    }
  });
  $('#sel-map-conf').change(function(){
    var config_name = $(this).val(),
      config = gViz.GetMapConfig(),
      sel_conf = config[config_name];
    var mapcanvas = GetMapCanvas();
    mapcanvas.update(sel_conf);
    if ('stroke_color' in sel_conf) $('#colorpicker-stroke').val(sel_conf.stroke_color);
    if ('fill_color' in sel_conf) $('#colorpicker-fill').val(sel_conf.fill_color);
    if ('transparency' in sel_conf) {
      $('#opacity-slider').slider('value',sel_conf.transparency);
      $('#opacity').text(sel_conf.transparency);
    }
    if ('stroke_width' in sel_conf) $('#stroke-width').val(sel_conf.stroke_width);
  });

  var dlg = $( "#dlg-simple-map" );
  dlg.dialog({
    dialogClass: "dialogWithDropShadow",
    width: 550,
    height: 400,
    autoOpen: false,
    modal: false,
    resizable:  false,
    draggable: true,
    beforeClose: function(event,ui){
      $('#dialog-arrow').hide();
    },
    buttons: [{
      text: "Close",
      click: function() {
        //$('#map-conf-name').val($('#sel-map-conf').val());
        //$('#dlg-save-map-conf').dialog('open');
        $( this ).dialog( "close" );
      },
    }]
  });

  var confDlg = $( "#dlg-save-map-conf");

  confDlg.dialog({
    dialogClass: "dialogWithDropShadow",
    width: 500,
    height: 200,
    autoOpen: false,
    modal: true,
    buttons: [{
      text: "Save",
      click: function() {
        var conf_name = $('#map-conf-name').val();
        var params = {
          'layer_uuid' : gViz.GetUUID(),
          'fill_color' : '#' + $('#colorpicker-fill').val(),
          'stroke_color' : '#' + $('#colorpicker-stroke').val(),
          'stroke_width' : parseFloat($('#stroke-width').val()),
          'transparency' : parseFloat($('#opacity').text()),
          'conf_name' : conf_name,
        };
        $.get('../save_map_conf/', params).done(function(results){
          if ('success' in results && results.success == 1) {
            if ($("#sel-map-conf option[value='"+conf_name+"']").length == 0) {
              $('#sel-map-conf').append($('<option selected>').text(conf_name));
            }
            var conf = gViz.GetMapConfig();
            conf[conf_name] = params;
            Utils.ShowMsgBox('', "Map Configuration has been saved successfully.")
          } else {
            Utils.ShowMsgBox('Error', "Save Map Configuration error.")
          }
        });
        $( this ).dialog( "close" );
      },
    }]
  });

  // fill content of color-selector
  $.each(colorbrewer, function(k,v){
    $('#color-selector').append($("<option></option>").attr("value", k).text(k));
  });

  $('#sel-quan-method').change( function (event, ui) { 
      var sel_method = $('#sel-quan-method').val();
      if (sel_method == "hinge15_breaks" || sel_method == "hinge30_breaks" || sel_method == "stddev_breaks") {
        $('#quan-cate').val(6);
        $('#quan-cate').prop('disabled', 'disabled');
        $('#color-selector').prop('disabled', 'disabled');
      } else {
        $('#quan-cate').prop('disabled', false);
        $('#color-selector').prop('disabled', false);
      }
    }
  );

  $( "#dlg-quantile-map" ).dialog({
    dialogClass: "dialogWithDropShadow",
    width: 500,
    height: 400,
    autoOpen: false,
    modal: false,
    resizable:  false,
    draggable: false,
    beforeClose: function(event,ui){
      $('#dialog-arrow').hide();
    },
    buttons: {
      "Open": function() {
        var sel_method = $('#sel-quan-method').val(),
            sel_var = $('#sel-var').val(),
            sel_cat = $('#quan-cate').val();

        if (sel_var === '') {
          Utils.ShowMsgBox("Info", "Please select a variable for choropleth map.")
          return;
        }

        if (sel_cat === '') {
          Utils.ShowMsgBox("Info", "Please select a category number for choropleth map.")
          return;
        }

        var mapCanvas = MapManager.getInstance().GetMapCanvas(),
            current_map = MapManager.getInstance().GetMap(),
            map_uuid = current_map.uuid,
            clr_name = $('#color-selector option:selected').text(),
            k = parseInt(sel_cat),
            colors = colorbrewer[clr_name][k],
            colorTheme = {},
            geoda = MapManager.getInstance().GetGeoDa(map_uuid);

        for (var i=0; i<k; i++) {
          colorTheme[colors[i]] = [];
        }

        var that = $(this);
        var vals = current_map.GetNumericCol(sel_var); 

        var data = geoda.custom_breaks(map_uuid, sel_method, parseInt(sel_cat), sel_var, vals); 

        var clr_name = $('#color-selector option:selected').text(),
            colors = colorbrewer[clr_name][data.k],
            colorTheme = {};
            
        if (sel_method == "stddev_breaks" || sel_method == "hinge15_breaks" || sel_method == "hinge30_breaks") {
          colors = ["#4575b4", "#91bfdb", "#dceef3", "#FAE3D4", "#e9a07c","#d73027"];
        }
        if (sel_method == "hinge15_breaks" || sel_method == "hinge30_breaks") {
          var txt_bins = ["Lower outlier","<25%","25-50%","50-75%",">75%","Upper outlier"];
          for (var i=0, n = colors.length; i < n; i++) {
            txt_bins[i] += " " + data.bins[i];
          }
          data.bins = txt_bins; 
        }

        for ( var i=0, n = data.id_array.length; i<n; i++ ) {
          colorTheme[colors[i]] = data.id_array[i];
        }
        var legend_txts = Utils.create_legend($('#legend'), data.bins, colors, data.col_name);
        mapCanvas.updateColor(colorTheme, sel_var, data.bins, colors, legend_txts);

        var type = " (" + data.col_name + ",k=" + data.k + ")",
            curTreeItem = $($('#sortable-layers li')[0]);

        newLayerName = $('#btnMultiLayer span').text() + type;
        $(curTreeItem.children()[1]).text(newLayerName);

        that.dialog("close");

      },
      Cancel: function() {
        $( this ).dialog( "close" );
      },
      "Reset": function() {
        $('#legend').hide();
        var mapCanvas = MapManager.getInstance().GetMapCanvas();
        mapCanvas.updateColor(undefined, "", [], [],[]);
        $( this ).dialog( "close" );
      },
    },
  });


    return {
      // public methods/vars
      UpdateFields : function(fields) {
        Utils.updateSelector(fields, sel_var, ['integer', 'double']);
      },
    };
  };

  return {
    getInstance : function() {
      if (!instance) {
        instance = init();
      }
      return instance;
    },
  };

})($);

return ChoroplethDlg;
});
