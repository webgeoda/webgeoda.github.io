

require.config({
  //By default load any module IDs from
  baseUrl: "../../media/js",
  //except, if the module ID starts with "app",
  //load it from the ../media/js/app directory. paths
  //config is relative to the baseUrl, and
  //never includes a ".js" extension since
  //the paths config could be for a directory.
  paths : {
    geoda: 'geoda',
    lodash: 'lib/lodash.min',
    rtree : 'lib/rtree',
    jquery : 'lib/jquery.min',
    //jqueryui : 'lib/jquery-ui',
    jqueryui : 'lib/jquery-ui-1.10.4.custom.min',
    //jquerymobile : 'lib/jquery.mobile-1.4.5.min',
    bootstrap : 'lib/bootstrap.min',
    kdtree : 'lib/kdtree',
    mapshaper: 'lib/mapshaper',
    //proj4: 'lib/proj4',
    proj4: 'lib/proj4',
    d3: 'lib/d3.v3.min',
    d3parcoords: 'lib/d3.parcoords',
    datatables: 'lib/jquery.dataTables.min',
    //cartodb: 'lib/cartodb',
    //leaflet: 'lib/leaflet',
    marked: 'lib/marked.min',
    'jquery.switchButton' : 'lib/jquery.switchButton',
    'jquery.colorpicker' : 'lib/jquery.colorpicker.min',
    'jquery.ui.touch-punch' : 'lib/jquery.ui.touch-punch.min',
    'jquery.slidereveal' : 'lib/jquery.slidereveal.min',
    'jquery.chosen' : 'lib/jquery.chosen.min',
    'jquery.textarea-markdown-editor' : 'lib/jquery.textarea-markdown-editor',
    gridstack : 'lib/gridstack.min',

    'list' : 'lib/list.min',
    'colorbrewer'  : 'lib/colorbrewer',
    md5 : 'lib/md5.min',
    ss : 'lib/simple_statistics',
    html2canvas : 'lib/html2canvas',
    'html2canvas.svg' : 'lib/html2canvas.svg',
    //zip : 'lib/zip/zip',
  },
  shim : {
    kdtree : {exports: 'kdtree'},
    mapshaper : {exports: 'mapshaper'},
    proj4 : {exports: 'proj4'},
    rtree : {exports : 'RTree'},
    d3 : {exports : 'd3'},
    datatables : {exports : 'datatables'},
    //cartodb: {},
    //leaflet: {exports: 'leaflet'},
    "jqueryui" : {deps: ['jquery']},
    "jquery.switchButton" : {deps: ['jquery']},
    "jquery.colorpicker" : {deps: ['jquery']},
    "jquery.ui.touch-punch" : {deps: ['jqueryui']},
    gridstack : {deps: ['lodash', 'jqueryui']},
    "list" : {},
    'colorbrewer': {},
    ss : {exports : 'ss'},
    "html2canvas.svg" : {deps: ['html2canvas']},
    //zip : {},
  },
  map: {
    '*': {
        'jquery-ui/mouse': 'jqueryui',
        'jquery-ui/draggable': 'jqueryui',
        'jquery-ui/data': 'jqueryui',
        'jquery-ui/form': 'jqueryui',
        'jquery-ui/focusable': 'jqueryui',
        'jquery-ui/disable-selection': 'jqueryui',
        'jquery-ui/ie': 'jqueryui',
        'jquery-ui/keycode': 'jqueryui',
        'jquery-ui/labels': 'jqueryui',
        'jquery-ui/plugin': 'jqueryui',
        'jquery-ui/jquery-1-7': 'jqueryui',
        'jquery-ui/safe-active-element': 'jqueryui',
        'jquery-ui/safe-blur': 'jqueryui',
        'jquery-ui/scroll-parent': 'jqueryui',
        'jquery-ui/tabbable': 'jqueryui',
        'jquery-ui/unique-id': 'jqueryui',
        'jquery-ui/version': 'jqueryui',
        'jquery-ui/widget': 'jqueryui',
        'jquery-ui/widgets/mouse': 'jqueryui',
        'jquery-ui/widgets/draggable': 'jqueryui',
        'jquery-ui/widgets/droppable': 'jqueryui',
        'jquery-ui/widgets/resizable': 'jqueryui',
        // And so on for all different cases...
    }
  },
});


require(["ui/main"]);
