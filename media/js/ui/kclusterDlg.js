
// Author: xunli at asu.edu
define(['jquery', './msgbox','./utils','./mapManager','./cartoProxy','colorbrewer'], function($, MsgBox, Utils, MapManager, CartoProxy) {

var KClusterDlg = (function($){
  var instance;

  function init() {
    // singleton

    // private methods/vars
    var sel_el_name = "kcluster-vars";
    var sel_container= $("#kcluster-sels");
    var prg_bar = $('#progress_bar_kcluster');

    function ProcessKClusterMap(result) {
      var mapCanvas = MapManager.getInstance().GetMapCanvas(),
          map = mapCanvas.map,
          uuid = map.uuid,
          table_name = mapCanvas.map.name,
          field_name = "cluster",
          colors = colorbrewer['RdBu'][5],
          colorTheme = {};

      for ( var i=0, n = result.id_array.length; i<n; i++ ) {
        colorTheme[colors[i]] = result.id_array[i];
      }

      var txts = Utils.create_legend($('#legend'), result.bins, colors);
      mapCanvas.updateColor(colorTheme, field_name, [0,1,2,3], colors, txts);

      // update Tree item
      var type = " (" + result.col_name + ", KCluster)",
          curTreeItem = $($('#sortable-layers li')[0]);
          newLayerName = $('#btnMultiLayer span').text() + type;

      $(curTreeItem.children()[1]).text(newLayerName);

      // add a field with KCluster values
      require(['ui/uiManager'], function(UIManager){
        map.fields["kcluster"] = 'integer';
        UIManager.getInstance().UpdateFieldNames(map.fields);
        MsgBox.getInstance().Show("Information", "The KCluster results have been saved to the CartoDB table.");
      });
    }

    $("#dlg-kcluster-map").dialog({
      dialogClass: "dialogWithDropShadow",
      width: 560,
      height: 480,
      autoOpen: false,
      modal: false,
      resizable:  false,
      draggable: false,
      open: function(event, ui) {
        $('#tabs-dlg-weights').appendTo('#kcluster-weights-plugin');
      },
      beforeClose: function(event,ui){
        $('#dialog-arrow').hide();
      },
      buttons: {
        "Open": function() {
          prg_bar.show();
          var fields = [];
          $('input[name='+sel_el_name+']:checked').each(function(i, obj){
      	    fields.push(obj.value);
      	  });
          var map = MapManager.getInstance().GetMap(),
              that = $(this);

          require(['ui/weightsDlg'], function(WeightsDlg) {
            var w_conf = WeightsDlg.getInstance().GetWeightsConfigure();
            w_conf['layer_uuid'] = map.uuid;
            w_conf['csrfmiddlewaretoken'] = csrftoken;
            $.post('../create_weights/', w_conf).done(function(data) {
              console.log(data);
              var wuuid = data['wuuid'];
              var params = {
                'layer_uuid' : map.uuid,
                'vars[]' : fields,
                'wuuid' : wuuid,
              };
              $.get('../kcluster_map/', params)
                .done(function(result){
                  ProcessKClusterMap(result);
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
        Utils.addMultiCheckbox(sel_el_name, fields, sel_container, ['integer', 'double']);
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

return KClusterDlg;
});
