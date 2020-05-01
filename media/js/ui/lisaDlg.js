
// Author: xunli at asu.edu
define(['jquery', './msgbox','./utils','./mapManager','./cartoProxy','colorbrewer'], function($, MsgBox, Utils, MapManager, CartoProxy) {

var LisaDlg = (function($){
  var instance;

  function init() {
    // singleton

    // private methods/vars
    var sel_lisa_var = $('#sel-lisa-var'),
        prg_bar = $('#progress_bar_lisa');

    function ProcessLisaMap(col_name, lisa) {
      var mapCanvas = MapManager.getInstance().GetMapCanvas(),
          map = mapCanvas.map,
          field_name = "lisa";

	    var pval = $('#lisa-pval-sels').val();
      var colors = [];
      var color_vec = lisa.colors();
      for (let i=0; i< color_vec.size(); ++i) {
        colors.push(color_vec.get(i));
      }
      var labels = lisa.labels();
      var clusters = lisa.clusters();
      var colorTheme = {};

      for (let i=0; i<colors.length; ++i) {
        colorTheme[colors[i]] = [];
      }

      for (let i=0, n=clusters.size(); i < n; ++i) {
        colorTheme[ colors[clusters.get(i)] ].push(i);
      }

      var bins = [];
      for (let i=0; i<colors.length; ++i) {
        bins.push(labels.get(i) + "(" + colorTheme[colors[i]] .length + ")");
      }

	    var title = col_name + " (p=" + pval +")";
      var txts = Utils.create_legend($('#legend'), bins, colors, title);
      mapCanvas.updateColor(colorTheme, field_name, [0,1,2,3,4,5,6], colors, txts);

      // update Tree item
      var type = " (" + col_name + ", Local Moran)",
          curTreeItem = $($('#sortable-layers li')[0]);
          newLayerName = $('#btnMultiLayer span').text() + type;

      $(curTreeItem.children()[1]).text(newLayerName);

      // add a field with LISA values
      require(['ui/uiManager'], function(UIManager){
        map.fields['lisa_c'] = 'integer';
        map.fields['lisa_p'] = 'double';
        UIManager.getInstance().UpdateFieldNames(map.fields);
        mapCanvas.update();
      });
    }

    $("#dlg-lisa-map").dialog({
      dialogClass: "dialogWithDropShadow",
      width: 560,
      height: 480,
      autoOpen: false,
      modal: false,
      resizable:  false,
      draggable: false,
      open: function(event, ui) {
        $('#sel-w-files').appendTo('#lisa-weights-plugin');
      },
      beforeClose: function(event,ui){
        $('#dialog-arrow').hide();
      },
      buttons: {
        "Open": function() {
          var sel_var = $('#sel-lisa-var').val(),
              current_map = MapManager.getInstance().GetMap(),
              map_uuid = current_map.uuid,
              geoda = MapManager.getInstance().GetGeoDa(map_uuid);
              that = $(this);
			  
		      if (sel_var == undefined  || sel_var == "" )  {
      	    Utils.ShowMsgBox("Info", "Please select variables for LISA map.")
			      return;
          }
          require(['ui/weightsDlg'], function(WeightsDlg) {
            var weights_dict = WeightsDlg.getInstance().GetWeights();
            var w_name = $("#sel-w-files").val();
            if (!(w_name in weights_dict)) {
              Utils.ShowMsgBox("Info", "Please create a spatial weights first.")
              return;
            }
            var w_obj = weights_dict[w_name];
            var w_uid = w_obj.get_uid(); 
            var pval = $('#lisa-pval-sels').val();

            prg_bar.show();
            var start = performance.now();
            var lisa = geoda.local_moran(map_uuid, w_uid, sel_var);
            var duration = (performance.now() - start);
            console.log("local moran takes ", duration);
            ProcessLisaMap(sel_var, lisa);
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
        Utils.updateSelector(fields, sel_lisa_var, ['integer', 'double']);
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

return LisaDlg;
});
