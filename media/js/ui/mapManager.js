
// Author: xunli at asu.edu
define(['jquery', 'geoda/io/shapefile', 'geoda/io/shapefile_map','geoda/io/geojson','geoda/io/geojson_map','geoda/viz/map_canvas'],
function($, ShpReader, ShapeFileMap, GeoJson, GeoJsonMap, MapCanvas) {

  class GeodaProxy {
    // file_target is evt.target
    constructor() {
      this.geojson_maps = {};
    }
  
    ReadGeojsonMap(map_uid, file_target) {
      //evt.target.result is an ArrayBuffer. In js, 
          //you can't do anything with an ArrayBuffer 
          //so we have to ???cast??? it to an Uint8Array
          const uint8_t_arr = new Uint8Array(file_target.result);
  
          //Right now, we have the file as a unit8array in javascript memory. 
          //As far as I understand, wasm can't directly access javascript memory. 
          //Which is why we need to allocate special wasm memory and then
          //copy the file from javascript memory into wasm memory so our wasm functions 
          //can work on it.
  
          //First we need to allocate the wasm memory. 
          //_malloc returns the address of the new wasm memory as int32.
          //This call is probably similar to 
          //uint8_t * ptr = new uint8_t[sizeof(uint8_t_arr)/sizeof(uint8_t_arr[0])]
          const uint8_t_ptr = window.Module._malloc(uint8_t_arr.length);
  
          //Now that we have a block of memory we can copy the file data into that block
          //This is probably similar to 
          //std::memcpy(uint8_t_ptr, uint8_t_arr, sizeof(uint8_t_arr)/sizeof(uint8_t_arr[0]))
          window.Module.HEAPU8.set(uint8_t_arr, uint8_t_ptr);
  
          //The only thing that's now left to do is pass 
          //the address of the wasm memory we just allocated
          //to our function as well as the size of our memory.
          //window.Module.new_geojsonmap1(map_uid, uint8_t_ptr, uint8_t_arr.length);
          window.Module.ccall("new_geojsonmap1", null, ["string", "number", "number"], [map_uid, uint8_t_ptr, uint8_t_arr.length]);
  
          //At this point we're forced to wait until wasm is done with the memory. 
          //Your site will now freeze if the memory you're working on is big. 
          //Maybe we can somehow let our wasm function run on a seperate thread and pass a callback?
  
          //Retreiving our (modified) memory is also straight forward. 
          //First we get some javascript memory and then we copy the 
          //relevant chunk of the wasm memory into our javascript object.
      //const returnArr = new Uint8Array(uint8_t_arr.length);
  
          //If returnArr is std::vector<uint8_t>, then is probably similar to 
          //returnArr.assign(ptr, ptr + dataSize)
          //returnArr.set(window.Module.HEAPU8.subarray(uint8_t_ptr, uint8_t_ptr + uint8_t_arr.length));
  
          //Lastly, according to the docs, we should call ._free here.
          //Do we need to call the gc somehow?
          window.Module._free(uint8_t_ptr);
  
      // store the map and map type
      let map_type = Module.get_map_type(map_uid);
      this.geojson_maps[map_uid] = map_type;
  
      return map_uid;
    }
  
    GetNumObs(map_uid) {
      let n = Module.get_num_obs(map_uid);
      return n;
    }
  
    GetMapType(map_uid) {
      return this.geojson_maps[map_uid];
    }
  
    GetNumericCol(map_uid, col_name) {
      // return VectorDouble
      return Module.get_numeric_col(map_uid, col_name)
    }
  
    CreateRookWeights(map_uid, order, include_lower_order, precision) {
      let w_uid = Module.rook_weights(map_uid, order, include_lower_order, precision);
      return w_uid;
    }

    CreateQueenWeights(map_uid, order, include_lower_order, precision) {
      let w_uid = Module.queen_weights(map_uid, order, include_lower_order, precision);
      return w_uid;
    }

    GetMinDistThreshold(map_uid, is_arc, is_mile) {
      let val = Module.min_distance_threshold(map_uid, is_arc, is_mile);
      return val;
    }

    CreateKnnWeights(map_uid, k, power, is_inverse, is_arc, is_mile) {
      let w = Module.knn_weights(map_uid, k, power, is_inverse, is_arc, is_mile);
      return w;
    }

    CreateDistWeights(map_uid, dist_thres, power, is_inverse, is_arc, is_mile) {
      let w = Module.dist_weights(map_uid, dist_thres, power, is_inverse, is_arc, is_mile);
      return w;
    }

    CreateKernelWeights(map_uid, k, kernel, adaptive_bandwidth, use_kernel_diagonals, is_arc, is_mile) {
      let w = Module.kernel_weights(map_uid, k, kernel, adaptive_bandwidth, use_kernel_diagonals, is_arc, is_mile);
      return w;
    }

    CreateKernelBandwidthWeights(map_uid, dist_thres, kernel, use_kernel_diagonals, is_arc, is_mile) {
      let w = Module.kernel_bandwidth_weights(map_uid, dist_thres, kernel, use_kernel_diagonals, is_arc, is_mile);
      return w;
    }

    local_moran(map_uid, weight_uid, col_name) {
      return Module.local_moran(map_uid, weight_uid, col_name);
    }

    local_g(map_uid, weight_uid, col_name) {
      return Module.local_g(map_uid, weight_uid, col_name);
    }

    local_gstar(map_uid, weight_uid, col_name) {
      return Module.local_gstar(map_uid, weight_uid, col_name);
    }

    local_geary(map_uid, weight_uid, col_name) {
      return Module.local_geary(map_uid, weight_uid, col_name);
    }

    local_joincount(map_uid, weight_uid, col_name) {
      return Module.local_joincount(map_uid, weight_uid, col_name);
    }

    parseVecVecInt(vvi) {
      let result = []; 
      for (let i=0; i<vvi.size(); ++i) {
        let sub = [];
        let vi = vvi.get(i);
        for (let j=0; j<vi.size(); ++j) {
          sub.push( vi.get(j) );
        }
        result.push(sub);
      }
      return result;
    }

    parseVecDouble(vd) {
      let result = []
      for (let i=0; i<vd.size(); ++i) {
        result.push( vd.get(i));
      }
      return result;
    }

    toVecString(input) {
      let vs = new Module.VectorString();
      for (let i=0; i<input.length; ++i) {
        vs.push_back(input[i]);
      }
      return vs;
    }

    redcap(map_uid, weight_uid, k, sel_fields, bound_var, min_bound, method) {
      let col_names = this.toVecString(sel_fields);
      let clusters_vec = Module.redcap(map_uid, weight_uid, k, col_names, bound_var, min_bound, method);
      let clusters = this.parseVecVecInt(clusters_vec);
      return clusters;
    }

    maxp(map_uid, weight_uid, k, sel_fields, bound_var, min_bound, method, tabu_length, cool_rate, n_iter) {
      let col_names = this.toVecString(sel_fields);
      let clusters_vec = Module.maxp(map_uid, weight_uid, col_names, bound_var, min_bound, tabu_length, cool_rate, method, k, n_iter);
      let clusters = this.parseVecVecInt(clusters_vec);
      return clusters;
    }

    custom_breaks(map_uid, break_name, k, sel_field, values) {
      let breaks_vec = Module.custom_breaks(map_uid, k, sel_field, break_name);
      let breaks = this.parseVecDouble(breaks_vec);

      let bins = [];
      let id_array = [];
      for (let i=0; i<breaks.length; ++i) {
        id_array.push([]);
        bins.push(" < " + breaks[i]);
      }
      id_array.push([]);
      bins.push(">= " + breaks[breaks.length-1]);

      breaks.unshift(Number.NEGATIVE_INFINITY);
      breaks.push(Number.POSITIVE_INFINITY);

      for (let i=0; i<values.length; ++i) {
        let v = values[i];
        for (let j=0; j<breaks.length -1; ++j) {
          let min_val = breaks[j];
          let max_val = breaks[j+1];
          if ( v >= min_val && v < max_val) {
            id_array[j].push(i);
            break;
          }
        }
      }

      for (let i =0; i<bins.length; ++i) {
        bins[i] += " (" + id_array[i].length + ')';
      }

      return {
        'k' : k,
        'bins' : bins,
        'id_array' : id_array,
        'col_name' : sel_field
      }
    }
  }

var Manager = (function(window){

  var instance;

  function init() {
    // singleton

    // private
    var container = $("#map-container");

    var width = container.width();
    var height = container.height();

    var numMaps = 0;
    var mapCanvasList = [];
    var mapOrder= [];

    var geoda_dict = {};

    var layerColors = ['#006400','#FFCC33','#CC6699','#95CAE4','#993333','#279B61'];
    var uuid = null;

    var currentMapName;

    var hlcanvas = $('.hl-canvas');

    var resizeTimer;

    function OnResize( evt ) {
      if (numMaps) {
        $('canvas, .down-arrow').hide();
      }
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function(){
        console.log('resize');
        $('canvas').show();
        for (var i=0; i<numMaps; i++)  {
          mapCanvasList[i].update();
        }
      }, 250);
    }
    function OnKeyDown( evt ) {
      if ( evt.keyCode = 77 ) {
        //hlcanvas[0].style.pointerEvents= 'none';
      }
    }

    function OnKeyUp( evt ) {
      if ( evt.keyCode = 77 ) {
        //hlcanvas[0].style.pointerEvents= 'auto';
      }
    }

    function ShowCartoDBMap(carto_uid, carto_key, table_name, geo_type) {
      var css = "";
      if (geo_type == "Point") {
        css = '#layer {marker-fill: #FF6600; marker-opacity: 1; marker-width: 6; marker-line-color: white; marker-line-width: 1; marker-line-opacity: 0.9; marker-placement: point; marker-type: ellipse; marker-allow-overlap: true;}';
      } else if (geo_type == "Line") {
        css = '#layer {line-width: 2; line-opacity: 0.9; line-color: #006400; }';
      } else if (geo_type == "Polygon") {
        css = "#layer {polygon-fill: #006400; polygon-opacity: 0.9; line-color: #CCCCCC; }";
      }
      //show cartodb layer and downloading iconp
      SetupLeafletMap();
      lmap.setView(new L.LatLng(43, -98), 1);
      if (carto_layer) {
        lmap.removeLayer(carto_layer);
      }
      carto_layer = cartodb.createLayer(lmap,
        {
          user_name: carto_uid,
          type: 'cartodb',
          sublayers:[{
            sql:"SELECT * FROM " + table_name,
            cartocss: css
          }],
        },
        {
          https: true,
        }
      )
      .addTo(lmap)
      .on('done', function(layer_) {
        var sql = new cartodb.SQL({user: carto_uid});
        sql.getBounds("SELECT * FROM " + table_name).done(function(bounds){
          lmap.fitBounds(bounds);
        });
      });
    }

    function CleanMaps() {
      for (var i=0; i<numMaps; i++) {
        mapCanvasList[i].clean();
      }
    }

    function PanMaps(offsetX, offsetY) {
      for (var i=0; i<numMaps; i++) {
        mapCanvasList[i].move(offsetX, offsetY);
      }
    }

    function UpdateMaps(params) {
      for (var i=0; i<numMaps; i++) {
        mapCanvasList[i].update(params, true);
      }
    }

    var basemap;

    require(['ui/basemap'], function(BaseMap){
      basemap = BaseMap.getInstance();
      $('#map').css("opacity",0);
    });

    var Lmove_start, Lmove, Lmove_end, gOffsetX, gOffsetY;

    function SetupBasemapEvent() {
      var lmap = basemap.GetLmap();

      lmap.on('zoomstart', function() {
        CleanMaps();
      });
      lmap.on('zoomend', function() {
        // already taken care by moveend
      });
      lmap.on('movestart', function(e) {
        Lmove_start = e.target._getTopLeftPoint();
        CleanMaps();
      });
      lmap.on('move', function(e) {
        Lmove = e.target._getTopLeftPoint();
        if (Lmove_start == undefined) {
          // resize window
          Lmove_start = e.target.getPixelOrigin();
          CleanMaps();
          return;
        }
        var offsetX = Lmove.x - Lmove_start.x,
            offsetY = Lmove.y - Lmove_start.y;
        if (Math.abs(offsetX) > 0 && Math.abs(offsetY) > 0) {
          PanMaps(-offsetX, -offsetY);
        }
      });
      lmap.on('moveend', function(e) {
        Lmove_end = e.target._getTopLeftPoint();
        var offsetX = Lmove_end.x - Lmove_start.x,
            offsetY = Lmove_end.y - Lmove_start.y;
        if (Math.abs(offsetX) > 0 || Math.abs(offsetY) > 0) {
          if (gOffsetX != offsetX || gOffsetY != offsetY) {
            gOffsetX = offsetX;
            gOffsetY = offsetY;
            UpdateMaps();
          }
        }
      });
    }

    //create basemap
    function OnAddMap(map) {
      // show leaflet map
      $('#map').css("opacity",1);
      // create a HTML5 canvas object for this map
      var canvas = $('<canvas/>', {'id':numMaps}).attr('class','paint-canvas');
      container.append(canvas);
      var  params = {};
      // assign default fill color
      if (params['fill_color'] === undefined) {
        params['fill_color'] = layerColors[numMaps % 6];
      }
      // create canvas-map object
      var mapCanvas = new MapCanvas(map, canvas, hlcanvas, params);
      for (var i=0; i<mapCanvasList.length; i++) {
        mapCanvasList[i].updateExtent(map);
      }
      // managed by mapCanvasList
      mapCanvasList.push(mapCanvas);
      mapOrder.push(numMaps);

      // hookup map event to this "top" canvas
      SetupBasemapEvent();

      //numMaps += 1;
      return numMaps++;
    }

    function GetMapCanvasByName(name) {
      for (var i=0; i<mapCanvasList.length; i++) {
        if (mapCanvasList[i].map.name === name)
          return mapCanvasList[i];
      }
      return undefined;
    }

    function GetMapCanvasByUuid(uuid) {
      for (var i=0; i<mapCanvasList.length; i++) {
        if (mapCanvasList[i].map.uuid === uuid)
          return mapCanvasList[i];
      }
      return undefined;
    }

    function OnBrushing(e) {
      console.log("map OnBrushing", e.detail.uuid);
      var uuid = e.detail.uuid;
      var hl_ids = JSON.parse(localStorage.getItem('HL_IDS')),
          hl_ext = JSON.parse(localStorage.getItem('HL_MAP'));
      for ( var uuid in hl_ids ) {
        var map = GetMapCanvasByUuid(uuid);
        if (map) {
          var ids = hl_ids[uuid];
          if ( hl_ext && uuid in hl_ext ) {
            map.highlightExt(ids, hl_ext[uuid]);
          } else if ( hl_ids && uuid in hl_ids ) {
            var context = undefined;
            var nolinking = true;
            map.highlight(hl_ids[uuid], context, nolinking);
          }
        }
      }
    }

    window.addEventListener('keydown', OnKeyDown, true);
    window.addEventListener('keyup', OnKeyUp, true);
    window.addEventListener('resize', OnResize, true);
    window.addEventListener('brushing', OnBrushing, true); // false for bubble
    window.addEventListener('storage', OnBrushing, true);

    return {
      // public
      AddGeoDa : function(map_uid, bytes_data) {
        var gda_proxy = new GeodaProxy();
        gda_proxy.ReadGeojsonMap(map_uid, bytes_data);
        geoda_dict[map_uid]  = gda_proxy;
        //console.log(gda_proxy.GetNumObs(map_uid));
            //console.log(gda_proxy.GetMapType(map_uid));
            //let w_uid = gda_proxy.CreateQueenWeights(map_uid);
            //let data = gda_proxy.GetNumericCol(map_uid, "hr60");
            //let lisa = Module.local_moran(map_uid, w_uid, data);
            //console.log(lisa.significances().get(0));
      }, 

      GetGeoDa : function(map_uid) {
        return geoda_dict[map_uid];
      },

      AddMap : function(data, callback) {
        if (data.file_type === 'shp') {

          var shp = data.file_content.shp,
              prj = data.file_content.prj;
          var reader = new FileReader();
          reader.onload = function(e) {
            // just in case basemap is not ready
            require(['ui/basemap'], function(BaseMap){
              basemap = BaseMap.getInstance();

              var shpReader = new ShpReader(reader.result);
              var map = new ShapeFileMap(data.file_name, shpReader, basemap.GetL(), basemap.GetLmap(), prj);
              map.uuid = data.file_name;
              OnAddMap(map);
              if (callback) callback(map);
            });
          };
          reader.readAsArrayBuffer(shp);
         
        } else if (data.file_type === 'geojson' || data.file_type === 'json') {
          var shp = data.file_content;
            require(['ui/basemap'], function(BaseMap){
              basemap = BaseMap.getInstance();
              var json = new GeoJson(data.file_name, shp);
              var map = new GeoJsonMap(json, basemap.GetL(), basemap.GetLmap());
              map.uuid = data.file_name;
              OnAddMap(map);
              if (callback) callback(map);
            });
            
        } else {
          console.log("unsupported file format:", data);
        }
      },

      AddExistingMap : function(map, callback) {
        OnAddMap(map);
        if (callback) callback(map);
      },

      UpdateExtent : function(map) {
        for (var i=0; i<mapCanvasList.length; i++) {
          mapCanvasList[i].updateExtent(map);
        }
      },

      GetNumMaps : function() {
        return numMaps;
      },

      GetMapCanvas : function(idx) {
        if (idx === undefined) idx = numMaps-1;
        return mapCanvasList[mapOrder[idx]];
      },

      GetCanvasByMap : function(map) {
        for (var i=0; i<mapCanvasList.length; i++) {
          var mapcanvas = mapCanvasList[i];

          if (map.name === mapcanvas.map.name)
            return mapcanvas;
        }
        return undefined;
      },


      GetMap : function(idx) {
        return  this.GetMapCanvas(idx).map;
      },

      GetMapByName : function(name) {
        for (var i=0; i<mapCanvasList.length; i++) {
          var mapcanvas = mapCanvasList[i],
              map = mapcanvas.map;
          if (map.name === name)
            return map;
        }
        return undefined;
      },

      GetMapCanvasByUuid: function(uuid) {
        for (var i=0; i<mapCanvasList.length; i++) {
          var mapcanvas = mapCanvasList[i],
              map = mapcanvas.map;
          if (map.uuid === uuid)
            return mapcanvas;
        }
        return undefined;
      },

      GetOrigIdx : function(idx)  {
        return mapOrder[idx];
      },

      Reorder : function(newOrder) {
        // mapOrder [2,1,3,4]
        var n = numMaps;
        var newExtent = newOrder[n-1]  != mapOrder[n-1];
        mapOrder = newOrder;

        // update orders of canvas by given new order
        for (var i=0; i < n; i++) {
          $('canvas[id=' + newOrder[i] + ']').appendTo(container);
        }

        if (newExtent) {
          var topLayerIdx = newOrder[n-1];
          var mapcanvas = mapCanvasList[topLayerIdx];
          var map = mapcanvas.map;
          var extent = map.setExtent();

          map.setLmapExtent(extent);
        }
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

})(this);

return Manager;

});
