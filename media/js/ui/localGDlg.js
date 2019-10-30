
// Author: xunli at asu.edu
define(['jquery', './msgbox','./utils','./mapManager','./cartoProxy','colorbrewer'], function($, MsgBox, Utils, MapManager, CartoProxy) {

var LocalGDlg = (function($){
  var instance;

  function init() {
    // singleton

    // private methods/vars

    var sel_el_name = "localg-vars";
    var sel_container= $("#localg-sels");
    var prg_bar = $('#progress_bar_localg');

    function ProcessLocalG(result) {
      var fields = [];
        $('input[name='+sel_el_name+']:checked').each(function(i, obj){
          fields.push(obj.value);
      });

      var mapCanvas = MapManager.getInstance().GetMapCanvas(),
        map = mapCanvas.map,
        uuid = map.uuid,
        table_name = mapCanvas.map.name,
        field_name = "cluster",
        colorTheme = {};

      var  colors = ["#EEEEEE", "#b2182b","#ef8a62","#fddbc7","#67adc7", "#999999"];
      var n = result.id_array.length;
      var ids = [0,1,2,3,4,5];
      var bins = result.bins;


      if (fields.length > 1) {
        n = 3;
      colors = ['#EEEEEE', '#3c8388', '#999999'];
      ids = [0,1,2];
      bins = ["Not Significant", "Positive", "Neighborless"];
      }

      if ( result.id_array[n-1].length == 0) {
        n = n - 1;
        bins.pop();
        colors.pop();
        ids.pop();
      }

      for ( var i=0; i<n; i++ ) {
        colorTheme[colors[i]] = result.id_array[i];
        bins[i] = bins[i] + "(" + result.id_array[i].length + ")";
      }

      var pval = $('#localg-pval-sels').val();
      var title = result.col_name + " (p=" + pval +")";
      //if (fields.length > 1) title = "";
      var txts = Utils.create_legend($('#legend'), bins, colors, title);
      mapCanvas.updateColor(colorTheme, field_name, ids, colors, txts);

      // add p-values selector
      /*
      var arr = [ {val : 0.05, text: '0.05'},
      {val : 0.01, text: '0.01'},
      {val : 0.001, text: '0.001'}
      ];

      var sel = $('<select>').appendTo('#legend');
      $(arr).each(function() {
        sel.append($("<option>").attr('value',this.val).text(this.text));
      });
      sel.change(function(){
        console.log(sel.val());
      });
      */

      // update Tree item
      var type = " (" + result.col_name + ", Local G)",
        curTreeItem = $($('#sortable-layers li')[0]);
        newLayerName = $('#btnMultiLayer span').text() + type;

      $(curTreeItem.children()[1]).text(newLayerName);

      // add a field with KCluster values
      require(['ui/uiManager'], function(UIManager){
        map.fields['geary_c'] = 'integer';
        map.fields['geary_p'] = 'double';
        UIManager.getInstance().UpdateFieldNames(map.fields);
        mapCanvas.update();
        //MsgBox.getInstance().Show("Information", "The Local Geary results have been saved to the CartoDB table.");
      });
    }

    $("#dlg-localg-map").dialog({
      dialogClass: "dialogWithDropShadow",
      width: 560,
      height: 480,
      autoOpen: false,
      modal: false,
      resizable:  false,
      draggable: false,
      open: function(event, ui) {
        $('#tabs-dlg-weights').appendTo('#localg-weights-plugin');
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

          if (fields.length	== 0  )  {
            Utils.ShowMsgBox("Info", "Please select variables for Local Geary cluster map.")
          return;
          }

          var pval = $('#localg-pval-sels').val();
          var map = MapManager.getInstance().GetMap(),
            that = $(this);

          prg_bar.show();
          require(['ui/weightsDlg'], function(WeightsDlg) {
            var w_conf = WeightsDlg.getInstance().GetWeightsConfigure();
            w_conf['layer_uuid'] = map.uuid;
            w_conf['vars[]'] = fields;
            w_conf['pval'] = pval;

            $.get('../local_g_map/', w_conf).done(function(result) {
              ProcessLocalG(result);
              prg_bar.hide();
              that.dialog("close");
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

return LocalGDlg;
});
