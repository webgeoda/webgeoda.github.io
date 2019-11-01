
// Author: xunli at asu.edu
define(['jquery', './msgbox','./utils','./mapManager','./cartoProxy','colorbrewer'], function($, MsgBox, Utils, MapManager, CartoProxy) {

var RedcapDlg = (function($){
  var instance;

  function init() {
    // singleton

    // private methods/vars
    var sel_el_name = "redcap-sels";
    var sel_container= $("#redcap-sels");
    var prg_bar = $('#progress_bar_redcap');

    $("#chk-redcap-mbound").click( function(){
      if( $(this).is(':checked') ) {
        $("#input-redcap-mbound").attr("disabled", false);
        $("#input-redcap-mbound-pct").attr("disabled", false);
        $('#sel-redcap-bound-var').attr("disabled", false);
      } else {
        $("#input-redcap-mbound").attr("disabled", true);
        $("#input-redcap-mbound").val('');
        $("#input-redcap-mbound-pct").attr("disabled", true);
        $("#input-redcap-mbound-pct").val('');
        $('#sel-redcap-bound-var').attr("disabled", true);
      }
   });
   
    $('#slider-redcap-bound').slider({
      min: 0, max: 0,
      slide: function( event, ui ) { 
        let cur = ui.value;
        $('#input-redcap-mbound').val(cur); 
        let max = $('#slider-redcap-bound').slider('option', 'max');
        let pct = cur / max * 100;
        pct = pct.toFixed(2) + "%";
        $('#input-redcap-mbound-pct').val(pct);
      }
    });

    $('#sel-redcap-bound-var').change(function(e){
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
      $('#input-redcap-mbound').val(suggest);
      $('#input-redcap-mbound-pct').val("10%");
      $('#slider-redcap-bound').slider('option', 'min', 0);
      $('#slider-redcap-bound').slider('option', 'max', sum);
      $('#slider-redcap-bound').slider('option', 'value', suggest);
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
      var type = " (redcap:" + fields + ")",
          curTreeItem = $($('#sortable-layers li')[0]);
          newLayerName = $('#btnMultiLayer span').text() + type;

      $(curTreeItem.children()[1]).text(newLayerName);

      // add a field with KCluster values
      require(['ui/uiManager'], function(UIManager){
        map.fields["redcap"] = 'integer';
        UIManager.getInstance().UpdateFieldNames(map.fields);
      });
    }

    $("#dlg-redcap").dialog({
      dialogClass: "dialogWithDropShadow",
      width: 560,
      height: 480,
      autoOpen: false,
      modal: false,
      resizable:  false,
      draggable: false,
      open: function(event, ui) {
        $('#sel-w-files').appendTo('#redcap-weights-plugin');
        $("#input-redcap-mbound").attr("disabled", true);
        $("#input-redcap-mbound").val('');
        $("#input-redcap-mbound-pct").attr("disabled", true);
        $("#input-redcap-mbound-pct").val('');
        $('#sel-redcap-bound-var').attr("disabled", true);
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
            Utils.ShowMsgBox("Info", "Please select at least one variable for redcap.");
            return;
          }
          var map = MapManager.getInstance().GetMap(),
              map_uuid = map.uuid,
              geoda = MapManager.getInstance().GetGeoDa(map_uuid),
              that = $(this);

          var k = parseInt($('#input-redcap-k').val());
          if (k <=0 || k > map.n) {
            Utils.ShowMsgBox("Info", "The number of clusters should be larger than 1 and less than the number of observations.");
            return;
          }

          var bound_var= "";
          var min_bound = -1;
          if ($('#chk-redcap-mbound').is(':checked')) {
            // get min bound
            bound_var = $('#sel-redcap-bound-var').val();
            min_bound = parseFloat($('#input-redcap-mbound').val());
          }

          var method = $('#sel-redcap-method').val();

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
            var clusters = geoda.redcap(map_uuid, w_uid, k, fields, bound_var, min_bound, method);
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
        Utils.updateSelector(fields, $('#sel-redcap-bound-var'), ['integer', 'double']);
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

return RedcapDlg;
});
