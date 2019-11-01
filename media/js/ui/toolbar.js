
// Author: xunli at asu.edu
define(['jquery',  './openfileDlg'], function($, FileDlg) {

var Toolbar = (function($, FileDlg){
  var instance;

  function init() {
    // singleton

    // private methods/vars
    var layerTree, mapManager;

    // set position of popup toolbar menu in the bottom area
    $('.tool-menu').css({ left: 0, bottom: 40}).hide();

    // link each item on bottom bar to a popup menu
    // OnToolMenuClick() is link between tool item and menu
    var toolMenu = {
      '#btnMultiLayer':'#layer-tree',
      '#btnNewMap':'#map-menu',
      '#btnShowEdit':'#edit-menu',
      '#btnExplore':'#explore-menu',
      '#btnSpace':'#space-menu',
      //'#btnSpreg':'#spreg-menu',
      '#btnClustering':'#clustering-menu',
    };

    var OnToolMenuClick = function(btn, menu) {
      $(btn).click(function(){
        if ($(menu).is(".visible") || $(menu).css('display') == 'block') {
          $(menu).hide();
          $('#tool-menu-arrow, #dialog-arrow, .ui-dialog').hide();
          return;
        }
        $('div.tool-menu, .ui-dialog, #dialog-arrow').hide();
	      if (menu == "#layer-tree")  {
          $(menu).show('slide', {direction:'down'});
        } else  {
          $(menu).show();
        }
        // adjust the pos of arrow
        var pos = $(btn).offset();
        $('#tool-menu-arrow').css({'left':pos.left});
        $('#tool-menu-arrow').show();
      });
    };

    for (var btn in toolMenu) {
      var menu = toolMenu[btn];
      OnToolMenuClick(btn, menu);
    }

    // each button on popup menu is linking to a dialog,
    // SetMenuButton() is used to link between button and dialog
    var buttonDialog = {
      '#btnSimMap' : '#dlg-simple-map',
      '#btnCatMap' : '#dlg-quantile-map',
      '#btnHist' : '#dlg-histogram',
      '#btnBoxPlot' : '#dlg-boxplot',
      '#btnScatter' : '#dlg-scatter-plot',
      '#btnScatterMatrix' : '#dlg-scatter-matrix',
      '#btnMoranScatter' : '#dlg-moran-scatter-plot',
      '#btnCreateW' : '#dialog-weights',
      '#btnRoad' : '#dialog-road',
      '#btnSpaceTime' : '#dialog-spacetime',
      '#btnLISA' : '#dlg-lisa-map',
      '#btnKCluster' : '#dlg-kcluster-map',
      '#btnLocalG' : '#dlg-localg-map',
      '#btnParcoords' : '#dlg-parcoords',
      '#btnLocalGeary' : '#dlg-localgeary-map',
      '#btnLocalJoinCount' : '#dlg-localjc-map',
      '#btnREDCAP' : '#dlg-redcap',
      '#btnMaxp' : '#dlg-maxp',
      //'#btnPCA' : '#dlg-pca',
      //'#btnKMeans' : '#dlg-kmeans',
      //'#btnCarto' : '#dialog-cartodb',
    };

    var OnMenuButtonClick = function(btnID, dlgID) {
      $(btnID).mouseout(function(){
	       $(this).css({"-webkit-filter":"graysale(100%) opacity(0.8)",});
	      }).mouseover(function(){
	       $(this).css({"-webkit-filter":"grayscale(0%)"});
	      });
      $(btnID).click(function(){
  	     // fade all buttons first
  	     //$('.image-wrap').css({"-webkit-filter":"grayscale(100%) opacity(0.8)",});
        // hide all other dialogs first
        $('.ui-dialog-content').dialog('close');
	      // then open targeting dialog
        $(dlgID).dialog('open');
	      // highligh current button also
	      //$(this).css({"-webkit-filter":"grayscale(0%)"});
      });
    };

    $('#btnVoronoiMap').click(function() {
      require(['ui/mapManager', 'd3', 'geoda/io/voronoi_map', 'ui/basemap'], function(MapManager, d3, VoronoiMap, Basemap){
	       var map = MapManager.getInstance().GetMap(),
            basemap = Basemap.getInstance(),
	           points = map.centroids;
      	var voronoi = d3.geom.voronoi()
      	  .clipExtent([[map.mapLeft, map.mapBottom],[map.mapRight, map.mapTop]]);
      	var polygons = voronoi(points),
      	    map_name = map.name + "(voroni)";
      	var vm = new VoronoiMap(map_name, points, polygons, map.bounds, basemap.GetL(), basemap.GetLmap(), map.prj);

      	MapManager.getInstance().AddExistingMap(vm);
      	layerTree.AddMap(vm.name);
      });
    });

    $('#btnBubbleMap').click(function() {

    });

    for (var btnID in buttonDialog) {
      var dlgID = buttonDialog[btnID];
      OnMenuButtonClick(btnID, dlgID);
    }

    $('#btnCartoDB').click(function(){
      $('#dialog-cartodb').dialog('open');
    });
    $('#btnCarto').click(function(){
      $('#dialog-cartodb').dialog('open');
    });

    $('#btnSpreg').click(function(){
	    $('.ui-dialog-content').dialog('close');
      $('#dialog-regression').dialog('open');
    });

    $('#btnDensity').click(function(){
      require(['ui/mapManager', 'geoda/viz/heatmap_canvas'], function(MapManager, HeatMapCanvas) {
      	var mapcanvas = MapManager.getInstance().GetMapCanvas();
      	mapcanvas.update({'heatmap':true});
      });
    });

    var toolbar_buttons = [
      '#btnClustering',
      '#btnShowEdit',
      '#btnNewMap',
      '#btnExplore',
      '#btnSpace',
      '#btnSpreg',
    ];

    var ToggleButtons = function(enable) {
      for( var i=0; i<toolbar_buttons.length; i++) {
        var btn = toolbar_buttons[i];
        if (enable) {
	         $('#bottombar, #multilayer_arrow').show();
           $(btn).show('slide');

        } else {
           $(btn).hide();
	         $('#bottombar, #multilayer_arrow').hide();
        }
      }
    };

    ToggleButtons(false);

    // setup first button on bottom toolbar
    $('#btnOpenData').click(function(){
      FileDlg.getInstance().Show();
      $(this).css("opacity", "0.2");
    });

    return {
      // public methods/vars
      UpdateFields : function() {
      },

      RegistLayerTree : function(obj) {
	       layerTree = obj;
      },

      RegistMapManager : function(obj) {
	       mapManager = obj;
      },

      Show : function(map) {
      	//$('#btnCreateW, #btnHistW').hide();
      	ToggleButtons(true);
      	layerTree.AddMap(map.name);

      },

      Hide : function() {
        ToggleButtons(false);
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

})($, FileDlg);

return Toolbar;
});
