
// Author: xunli at asu.edu
define(['jquery', './msgbox','./utils','./mapManager','./cartoProxy','colorbrewer'], function($, MsgBox, Utils, MapManager, CartoProxy) {

var LisaDlg = (function($){
  var instance;

  function init() {
    // singleton

    // private methods/vars
    var sel_lisa_var = $('#sel-lisa-var'),
        prg_bar = $('#progress_bar_lisa');

    function ProcessLisaMap(result) {
      var mapCanvas = MapManager.getInstance().GetMapCanvas(),
          map = mapCanvas.map,
          table_name = mapCanvas.map.name,
          field_name = "lisa",
          colors = colorbrewer['Lisa'][5],
          colorTheme = {};

      for ( var i=0, n = result.id_array.length; i<n; i++ ) {
        colorTheme[colors[i]] = result.id_array[i];
        result.bins[i] = result.bins[i] + "(" + result.id_array[i].length + ")";
      }

	  var pval = $('#lisa-pval-sels').val();
	  var title = result.col_name + " (p=" + pval +")";
      var txts = Utils.create_legend($('#legend'), result.bins, colors, title);
      mapCanvas.updateColor(colorTheme, field_name, [0,1,2,3,4], colors, txts);

      // update Tree item
      var type = " (" + result.col_name + ", LISA)",
          curTreeItem = $($('#sortable-layers li')[0]);
          newLayerName = $('#btnMultiLayer span').text() + type;

      $(curTreeItem.children()[1]).text(newLayerName);

      // add a field with LISA values
      require(['ui/uiManager'], function(UIManager){
        map.fields['lisa_c'] = 'integer';
        map.fields['lisa_p'] = 'double';
        UIManager.getInstance().UpdateFieldNames(map.fields);
        mapCanvas.update();
        //MsgBox.getInstance().Show("Information", "The LISA results have been saved to the CartoDB table.");
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
        $('#tabs-dlg-weights').appendTo('#lisa-weights-plugin');
      },
      beforeClose: function(event,ui){
        $('#dialog-arrow').hide();
      },
      buttons: {
        "Open": function() {
          var sel_var = $('#sel-lisa-var').val(),
              map = MapManager.getInstance().GetMap(),
              that = $(this);
			  
		  if (sel_var == undefined  || sel_var == "" )  {
      	    Utils.ShowMsgBox("Info", "Please select variables for LISA map.")
			return;
		  }
		  
		  var pval = $('#lisa-pval-sels').val();

          prg_bar.show();
          require(['ui/weightsDlg'], function(WeightsDlg) {
    	      var w_conf = WeightsDlg.getInstance().GetWeightsConfigure();
                  w_conf['layer_uuid'] = map.uuid,
                  w_conf['var_x'] = sel_var,
				  w_conf['pval'] = pval;
              $.get('../lisa_map/', w_conf).done(function(data) {
                    ProcessLisaMap(data);
                    prg_bar.hide();
                    that.dialog("close");
              }).fail(function(data){
		      $.get('../lisa_map/', w_conf).done(function(data) {
			    ProcessLisaMap(data);
			    prg_bar.hide();
			    that.dialog("close");
	              });
              }); 
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
