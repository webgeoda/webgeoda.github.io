
// Author: xunli at asu.edu
define(['jquery', './msgbox','./utils','./mapManager','./cartoProxy','colorbrewer'], function($, MsgBox, Utils, MapManager, CartoProxy) {

var MaxpDlg = (function($){
  var instance;

  function init() {
    // singleton

    // private methods/vars
    var sel_el_name = "maxp-sels";
    var sel_container= $("#maxp-sels");
    var prg_bar = $('#progress_bar_maxp');

    $("#chk-maxp-mbound").click( function(){
      if( $(this).is(':checked') ) {
        $("#input-maxp-mbound").attr("disabled", false);
        $("#input-maxp-mbound-pct").attr("disabled", false);
        $("#input-maxp-k").attr("disabled", true);
        $('#sel-maxp-bound-var').attr("disabled", false);
      } else {
        $("#input-maxp-mbound").attr("disabled", true);
        $("#input-maxp-mbound").val('');
        $("#input-maxp-mbound-pct").attr("disabled", true);
        $("#input-maxp-mbound-pct").val('');
        $('#sel-maxp-bound-var').val('');
        $("#input-maxp-k").attr("disabled", false);
        $('#sel-maxp-bound-var').attr("disabled", true);
        $('#sel-maxp-bound-var').val('');
      }
   });
   
    $('#slider-maxp-bound').slider({
      min: 0, max: 0,
      slide: function( event, ui ) { 
        let cur = ui.value;
        $('#input-maxp-mbound').val(cur); 
        let max = $('#slider-maxp-bound').slider('option', 'max');
        let pct = cur / max * 100;
        pct = pct.toFixed(2) + "%";
        $('#input-maxp-mbound-pct').val(pct);
      }
    });

    $('#sel-maxp-bound-var').change(function(e){
      // update slider
      let col_name = e.target.options[e.target.selectedIndex].text;
      if (col_name.length ==0) return;
      let mapCanvas = MapManager.getInstance().GetMapCanvas(),
          map = mapCanvas.map;
      let values = map.data[col_name];
      // 10% as default to txt_floor
      let sum = 0;
      for (let i=0; i<values.length; i++) {
          sum += values[i];
      }
      let suggest = sum * 0.1;
      $('#input-maxp-mbound').val(suggest);
      $('#input-maxp-mbound-pct').val("10%");
      $('#slider-maxp-bound').slider('option', 'min', 0);
      $('#slider-maxp-bound').slider('option', 'max', sum);
      $('#slider-maxp-bound').slider('option', 'value', suggest);
    });

    $('#sel-maxp-method').change(function(e){
      let sel_idx = e.target.selectedIndex;
      if (sel_idx == 0) {
        $('#tabu-div').hide();
        $('#sa-div').hide();
      } else if (sel_idx == 1) {
        $('#tabu-div').show();
        $('#sa-div').hide();
      } else if (sel_idx == 2) {
        $('#tabu-div').hide();
        $('#sa-div').show();
      }
    });

    function ProcessClusterMap(fields, result) {
      var mapCanvas = MapManager.getInstance().GetMapCanvas(),
          map = mapCanvas.map,
          uuid = map.uuid,
          table_name = mapCanvas.map.name,
          field_name = "cluster";
      var n = result.length,
          colors = colorbrewer['RdBu'][n],
          colorTheme = {};

      var bins = [];
      for ( var i=0, n = result.length; i<n; i++ ) {
        colorTheme[colors[i]] = result[i];
        bins.push('c' + (i+1));
      }

      var txts = Utils.create_legend($('#legend'), bins, colors);
      mapCanvas.updateColor(colorTheme, field_name, [0,1,2,3], colors, txts);

      // update Tree item
      var type = " (maxp:" + fields + ")",
          curTreeItem = $($('#sortable-layers li')[0]);
          newLayerName = $('#btnMultiLayer span').text() + type;

      $(curTreeItem.children()[1]).text(newLayerName);

      // add a field with KCluster values
      require(['ui/uiManager'], function(UIManager){
        map.fields["maxp"] = 'integer';
        UIManager.getInstance().UpdateFieldNames(map.fields);
      });
    }

    $("#dlg-maxp").dialog({
      dialogClass: "dialogWithDropShadow",
      width: 560,
      height: 480,
      autoOpen: false,
      modal: false,
      resizable:  false,
      draggable: false,
      open: function(event, ui) {
        $('#sel-w-files').appendTo('#maxp-weights-plugin');
        $("#input-maxp-mbound").attr("disabled", false);
        $("#input-maxp-mbound-pct").attr("disabled", false);
        $("#input-maxp-k").attr("disabled", true);
        $("#chk-maxp-mbound").val(true);
        $('#tabu-div').hide();
        $('#sa-div').hide();
      },
      beforeClose: function(event,ui){
        $('#dialog-arrow').hide();
      },
      buttons: {
        "Open": function() {
          var fields = [];
          $('input[name='+sel_el_name+']:checked').each(function(i, obj){
      	    fields.push(obj.value);
          });
          if (fields.length == 0) {
            Utils.ShowMsgBox("Info", "Please select at least one variable for maxp.");
            return;
          }
          var map = MapManager.getInstance().GetMap(),
              map_uuid = map.uuid,
              geoda = MapManager.getInstance().GetGeoDa(map_uuid),
              that = $(this);

          var k = parseInt($('#input-maxp-k').val());
          if (k <=0 || k > map.n) {
            Utils.ShowMsgBox("Info", "The number of clusters should be larger than 1 and less than the number of observations.");
            return;
          }

          var bound_var= "";
          var min_bound = -1;
          if ($('#chk-maxp-mbound').is(':checked')) {
            // get min bound
            bound_var = $('#sel-maxp-bound-var').val();
            min_bound = parseFloat($('#input-maxp-mbound').val());
          } else if (k == NaN) {
            Utils.ShowMsgBox("Info", 'Please input either "Minimum Bound" or "Minimum # per Region".');
            return;
          }

          var method = $('#sel-maxp-method').val();
          var tabu_length = parseInt($('#input-tabu-length').val());
          if (tabu_length < 0 || tabu_length == NaN) {
            Utils.ShowMsgBox("Info", 'Please input a positive integer number for tabu length.');
            return;
          }
          var cool_rate = parseFloat($('#input-cooling-rate').val());
          if (cool_rate < 0 || cool_rate == NaN || cool_rate > 1) {
            Utils.ShowMsgBox("Info", 'Please input a float number in range (0,1) for coolring rate.');
            return;
          }

          var n_iter = parseInt($('#input-maxp-iterations').val());
          if (n_iter < 0 ) {
            Utils.ShowMsgBox("Info", 'Please input a positive integer number for number of iterations.');
            return;
          }

          require(['ui/weightsDlg'], function(WeightsDlg) {
            var weights_dict = WeightsDlg.getInstance().GetWeights();
            var w_name = $("#sel-w-files").val();
            if (!(w_name in weights_dict)) {
              Utils.ShowMsgBox("Info", "Please create a spatial weights first.");
              return;
            }
            var w_obj = weights_dict[w_name];
            var w_uid = w_obj.get_uid(); 

            prg_bar.show();

            var clusters = geoda.maxp(map_uuid, w_uid, k, fields, bound_var, min_bound, method, tabu_length, cool_rate, n_iter);
            ProcessClusterMap(fields, clusters);

            prg_bar.hide();
            that.dialog("close");

          });
        },
        Cancel: function() {$( this ).dialog( "close" );},
      },
    });  // end dialog

    return {
      // public methods/vars
      UpdateFields : function(fields) {
        Utils.addMultiCheckbox(sel_el_name, fields, sel_container, ['integer', 'double']);
        Utils.updateSelector(fields, $('#sel-maxp-bound-var'), ['integer', 'double']);
      },
    };
  } // end init()

  return {
    getInstance : function() {
      if (!instance) {
        instance = init();
      }
      return instance;
    },
  };

})($, Utils);

return MaxpDlg;
});
