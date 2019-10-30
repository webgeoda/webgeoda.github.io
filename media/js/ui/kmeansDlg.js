
// Author: xunli at asu.edu
define(['jquery', './msgbox','./utils','./mapManager','colorbrewer'],
function($, MsgBox, Utils, MapManager) {

var KMeansDlg = (function($){
  var instance;

  function init() {
    // singleton

    // private methods/vars

    var sel_el_name = "kmeans-vars";
    var sel_container= $("#kmeans-sels");
    var prg_bar = $('#progress_bar_kmeans');

    function ProcessPCA(result) {
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

    $("#dlg-kmeans").dialog({
      dialogClass: "dialogWithDropShadow",
      width: 560,
      height: 560,
      autoOpen: false,
      modal: false,
      resizable:  false,
      draggable: false,
      open: function(event, ui) {
        for (var i=2; i<=20; i++ ) {
          $('#kmeans-k').append($('<option>', {value: i}).text(i));
        }
      },
      beforeClose: function(event,ui){
        $('#dialog-arrow').hide();
      },
      buttons: {
        "Open": function() {
          Utils.ShowMsgBox("Info","Not ready yet.");
          return;

          var fields = [];
          $('input[name='+sel_el_name+']:checked').each(function(i, obj){
            fields.push(obj.value);
          });

          if (fields.length	<= 1  )  {
            Utils.ShowMsgBox("Info", "Please select at least 2 variables for KMeans.")
            return;
          }

          var map = MapManager.getInstance().GetMap(),
              that = $(this);

          var transform = $('#kmeans-transform-sel').val();

          var use_centroids = $('#kmeans-centroids').val();

          var methods = $('#kmeans-methods').val();

          var dist_func = $('#kmeans-dist-function').val();

          var max_iter = $('#kmeans-max-iter').val();

          var init_rerun = $('#kmeans-init-rerun').val();

          var k = $('#kmeans-k').val();

          prg_bar.show();

            var conf = {};
            conf['layer_uuid'] = map.uuid;
            conf['vars[]'] = fields;

            $.get('../kmeans/', w_conf).done(function(result) {
              ProcessKMeans(result);
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

return KMeansDlg;
});
