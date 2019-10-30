
// Author: xunli at asu.edu
define(['jquery', './msgbox','./utils','./mapManager','colorbrewer'],
function($, MsgBox, Utils, MapManager) {

var PCADlg = (function($){
  var instance;

  function init() {
    // singleton

    // private methods/vars
    $('#pca-result-dlg').dialog({
      height: 500,
      width: 800,
      autoOpen: false,
      modal: true,
      dialogClass: "dialogWithDropShadow",
      buttons: {
        Cancel: function() {$( this ).dialog( "close" );},
      }
    });

    var sel_el_name = "pca-vars";
    var sel_container= $("#pca-sels");
    var prg_bar = $('#progress_bar_pca');

    function ProcessPCA(result) {
      $('#txt-pca-summary').text(result.summary);
      $('#pca-result-dlg').dialog('open');
    }

    $( "#spreg-result-tabs" ).tabs();

    $("#dlg-pca").dialog({
      dialogClass: "dialogWithDropShadow",
      width: 560,
      height: 480,
      autoOpen: false,
      modal: false,
      resizable:  false,
      draggable: false,
      open: function(event, ui) {
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

          if (fields.length	<= 1  )  {
            Utils.ShowMsgBox("Info", "Please select at least 2 variables for PCA.")
            return;
          }

          var transform = $('#pca-transform-sel').val();
          var map = MapManager.getInstance().GetMap(),
              that = $(this);

          prg_bar.show();
            var conf =  {};
            conf['layer_uuid'] = map.uuid;
            conf['vars[]'] = fields;
            conf['transform'] = transform;

            $.get('../pca/', conf).done(function(result) {
              if (result.success == 0) {
                Utils.ShowMsgBox("Running PCA failed. Please try again or contact adminstrator.");
              } else {
                ProcessPCA(result);
              }
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

return PCADlg;
});
