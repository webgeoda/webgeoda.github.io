
// Author: xunli at asu.edu
define(['lodash',
        'jquery',
        './layertree',
        './toolbar',
        './uiManager',
        './msgbox',
        './cartoProxy',
        './openfileDlg',
        './mapManager',
        'jqueryui',
        'jquery.ui.touch-punch',
        'jquery.slidereveal',
        'gridstack',
        //'jquery.chosen',
        //'jquerymobile',
        ],

function(_, $,
         LayerTree,
         Toolbar,
         UIManager,
         MsgBox,
         CartoProxy,
         FileDlg,
         MapManager) {

  // hide all divs
  $('#w-dist-loading, #img-id-chk, #img-id-spin, #img-id-nochk, .dlg-loading, #progress_bar_openfile, #progress_bar_cartodb,#progress_bar_road, #progress_bar_spacetime, #btnMultiLayer, #progress_bar_lisa, #progress_bar_localg, #progress_bar_kcluster, #tool-menu-arrow, #dialog-arrow, #userInfo, #mapInfo, #prgInfo').hide();

  // define functions for jquery
  $.download = function(url, data, method) {
    //url and data options required
    if (url && data) {
        //data can be string of parameters or array/object
        data = typeof data == 'string' ? data : jQuery.param(data);
        //split params into form inputs
        var inputs = '';
        jQuery.each(data.split('&'), function() {
            var pair = this.split('=');
            inputs += '<input type="hidden" name="' + pair[0] +
                '" value="' + pair[1] + '" />';
        });
        //send request
        jQuery('<form action="' + url +
            '" method="' + (method || 'post') +'">' + inputs + '</form>')
        .appendTo('body').submit().remove();
    }
  };

  $.GetTextsFromObjs = function(objs) {
    var texts = [];
    objs.each(function(i, obj){
      if (obj.className != "placeholder") {
        texts.push($(obj).text());
      }
    });
    return texts;
  };

  $.GetValsFromObjs = function(objs) {
    var vals = [];
    objs.each(function(i, obj){
      if (obj.className != "placeholder") {
        vals.push($(obj).val());
      }
    });
    return vals;
  };

  $.ajaxPrefilter(function( options, original_Options, jqXHR ) {
    options.async = true;
  });

  String.prototype.endsWith = function(suffix) {
      return this.indexOf(suffix, this.length - suffix.length) !== -1;
  };

  // event
  var event = document.createEvent('Event');
  event.initEvent('brushing', true, true);

  //CartoProxy.AddFieldWithValues('natregimes', 'lisa', 'integer', [1,2,3,4,5,6,7,8,9,10]);

  // UI Manager
  var ui = UIManager.getInstance();

  // Map Manager
  var mapManager = MapManager.getInstance();
  ui.RegistMapManager(mapManager);

  // layer tree
  var layerTree = LayerTree.getInstance();
  layerTree.RegistMapManager(mapManager);

  // toolbar
  var toolbar = Toolbar.getInstance();
  toolbar.RegistLayerTree(layerTree);
  toolbar.RegistMapManager(mapManager);

  ui.RegistToolbar(toolbar);

  // dialogs
  var fileDlg = FileDlg.getInstance();

  $('#divPop').hide();

  var options = {
      cellHeight: 80,
      verticalMargin: 10
  };
  //$('.grid-stack').gridstack(options);
});
