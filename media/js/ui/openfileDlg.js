

// Author: xunli at asu.edu
define(['jquery','./utils','./msgbox', './message', './cartoProxy',
  './mapManager', './uiManager','proj4', 'datatables'],
function($, Utils, MsgBox, M, CartoProxy, MapManager, UIManager, proj4, datatables) {

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
          window.Module.new_geojsonmap(map_uid, uint8_t_ptr, uint8_t_arr.length);
  
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
  
    CreateQueenWeights(map_uid) {
      let w_uid = Module.queen_weights(map_uid, 1, 0, 0.0);
      return w_uid;
    }
  }

// plugin
$.fn.extend({
    donetyping: function(callback,timeout){
        timeout = timeout || 1e3; // 1 second default timeout
        var timeoutReference,
            doneTyping = function(el){
                if (!timeoutReference) return;
                timeoutReference = null;
                callback.call(el);
            };
        return this.each(function(i,el){
            var $el = $(el);
            // Chrome Fix (Use keyup over keypress to detect backspace)
            // thank you @palerdot
            $el.is(':input') && $el.on('keyup keypress paste',function(e){
                // This catches the backspace button in chrome, but also prevents
                // the event from triggering too premptively. Without this line,
                // using tab/shift+tab will make the focused element fire the callback.
                if (e.type=='keyup' && e.keyCode!=8) return;

                // Check if timeout has been set. If it has, "reset" the clock and
                // start over again.
                if (timeoutReference) clearTimeout(timeoutReference);
                timeoutReference = setTimeout(function(){
                    // if we made it here, our timeout has elapsed. Fire the
                    // callback
                    doneTyping(el);
                }, timeout);
            }).on('blur',function(){
                // If we can, fire the event since we're leaving the field
                doneTyping(el);
            });
        });
    }
});

var gda_proxy = new GeodaProxy();

var OpenFileDlg = (function() {

  var instance;

  function init() {
    // singleton

    // private
    var dlg = $("#dialog-open-file"),
        dlgPrgBar = $('#progress_bar_openfile'),
        dlgTabs = $('#tabs-dlg-open-file').tabs(),
        idEl = $('#txt-carto-id'),
        keyEl = $('#txt-carto-key');

    dlgTabs.tabs({ active: 0 });

    keyEl.donetyping(function() {
      GetCartoTables();
    });


    // Get table names from CartoDB account
    function GetCartoTables() {
      var uid = idEl.val(),
          key = keyEl.val();
      if (uid === "" || key === "") return;
      dlgPrgBar.show();
      CartoProxy.SetUID(uid);
      CartoProxy.SetKey(key);
      CartoProxy.GetAllTables(uid, key, function(tables) {
        dlgPrgBar.hide();
        require(['ui/cartodbDlg', 'ui/spacetimeDlg', 'ui/networkDlg'], function(CartoDlg, SpacetimeDlg, NetworkDlg){
          CartoDlg.getInstance().UpdateTableSel(tables);
          CartoProxy.GetGeomTypes(tables, function(tbl_geo){
            //console.log(tbl_geo);
            SpacetimeDlg.getInstance().UpdateTableSel(tbl_geo);
            NetworkDlg.getInstance().UpdateTableSel(tbl_geo);
          });
        });
      });
    }

    var ShowPrgDiv = function(msg, visible) {
      if (visible == true) {
        $('#prgInfo span').text(msg);
        $('#prgInfo').show();
      } else {
        $('#prgInfo').hide();
      }
    };

    // hookup refresh button in cartodb tab
    $('#btn-file-cartodb-get-all-tables').click(function(){
      GetCartoTables();
    });

    function AddCartoDBTableAsMap(table_name, callback) {
      dlgPrgBar.show();
      CartoProxy.DownloadTable(table_name, function(data){
        require(['ui/mapManager'], function(MapManager){
          dlgPrgBar.hide();
          MapManager.getInstance().AddMap(data, function(map){
            // add map name to space-time dialog
            GetCartoTables();
            //$('#sel-spacetime-table-point')
            CartoProxy.GetFields(table_name, function(fields){
              map.fields = fields;
              UIManager.getInstance().SetupMap(map);
              if (callback) callback();
            });
          });
        });
      });
    }

    function InitDialogs(data, callback) {
      var ui = UIManager.getInstance();
      if (ui.IsDialogSetup()) {
        require(['ui/openfileDlg', 'ui/cartodbDlg', 'ui/choroplethDlg',
          'ui/histogramDlg', 'ui/lisaDlg', 'ui/moranDlg',
          'ui/networkDlg', 'ui/scatterDlg', 'ui/spacetimeDlg',
          'ui/spregDlg', 'ui/weightsDlg', 'ui/scattermatrixDlg',
          'ui/parcoordsDlg', 'ui/boxplotDlg', 'ui/kclusterDlg',
          'ui/localGDlg', 'ui/pcaDlg', 'ui/kmeansDlg'],
        function(FileDlg, CartoDlg, ChoroplethDlg,
            HistogramDlg, LisaDlg, MoranDlg,
            NetworkDlg, ScatterDlg, SpacetimeDlg,
            SpregDlg, WeightsDlg, ScatterMatrixDlg,
            ParcoordsDlg, BoxplotDlg, KClusterDlg,
            LocalGDlg, PCADlg, KMeansDlg)
        {
          var fileDlg = FileDlg.getInstance();
          var cartoDlg = CartoDlg.getInstance();
          var choroDlg = ChoroplethDlg.getInstance();
          var histoDlg = HistogramDlg.getInstance();
          var lisaDlg = LisaDlg.getInstance();
          var moranDlg = MoranDlg.getInstance();
          var netwDlg = NetworkDlg.getInstance();
          var scatDlg = ScatterDlg.getInstance();
          var spacetimeDlg = SpacetimeDlg.getInstance();
          var spregDlg = SpregDlg.getInstance();
          var wDlg = WeightsDlg.getInstance();
          var scatMatrixDlg = ScatterMatrixDlg.getInstance();
          var parcoordsDlg = ParcoordsDlg.getInstance();
          var boxplotDlg = BoxplotDlg.getInstance();
          var kclusterDlg = KClusterDlg.getInstance();
          var localgDlg = LocalGDlg.getInstance();
          var pcaDlg = PCADlg.getInstance();
          var kmeansDlg = KMeansDlg.getInstance();

          ui.RegistDialogs([fileDlg, cartoDlg, choroDlg,
            histoDlg, lisaDlg, moranDlg,
            netwDlg, scatDlg, spacetimeDlg,
            spregDlg, wDlg, scatMatrixDlg,
            parcoordsDlg, boxplotDlg, kclusterDlg,
            localgDlg, pcaDlg, kmeansDlg]);

          // Init dialog with Fields from server
          if (callback) {
            callback(data);
          }
        });
      }
    }

    var bAccepts = false;

    // hookup file dialog OK button
    var OnOKClick = function() {
      bAccepts = true;
      var sel_id = dlgTabs.tabs('option','active'),
          that = $(this);
      if (sel_id === 1) {
        that.attr("disabled", "disabled");
        var table_name = $('#sel-file-carto-tables').find(':selected').text();
        if (table_name === "")  {
          MsgBox.getInstance().Show(M.m100001, M.m100002);
          return;
        }
        AddCartoDBTableAsMap(table_name, function(){
          that.dialog("close");
        });
        InitDialogs();
      } 
    };

    // the main OpenFile Dialog
    dlg.dialog({
      height: 580,
      width: 700,
      autoOpen: false,
      modal: false,
      dialogClass: "dialogWithDropShadow",
      close : function() {
        if (bAccepts)
          $( '#btnOpenData').css("opacity", "0.2");
        else
          $( '#btnOpenData').css("opacity", "1.0");
      },
      buttons: [
        {text: "OK",click: OnOKClick,},
        {text: "Close",click: function() {
            $( this ).dialog( "close" );
            $( '#btnOpenData').css("opacity", "1.0");
          }
        }
      ]
    });
    dlg.dialog('open');

    // Drag and Drop elements
    var dropZone = document.getElementById('drop_zone');
    var progress = document.querySelector('.percent');

    if (typeof window.FileReader === 'undefined') {
      console.log( 'File API not available.');
    }

    function UpdateProgress(evt) {
      // evt is an ProgressEvent.
      if (evt.lengthComputable) {
        var percentLoaded = Math.round((evt.loaded / evt.total) * 100);
        // Increase the progress bar length.
        if (percentLoaded < 100) {
          progress.style.width = percentLoaded + '%';
          progress.textContent = percentLoaded + '%';
        }
      }
    }


    function HandleDropZipFile(f, callback) {
      // find .shp file or .json file and show map

      var bShp=0;
      zip.createReader(new zip.BlobReader(f), function(zipReader) {
        zipReader.getEntries(function(entries) {

          var i = 0,
              n = entries.length,
              bShp = false,
              bShx = false,
              bDbf = false,
              bPrj = false,
              shpFile, dbfFile, prjFile,
              fileName = '',
              proj;

          entries.forEach(function(entry) {
            var suffix = Utils.getSuffix(entry.filename);
            var writer;
            if (suffix === 'json' || suffix === 'geojson' || suffix === 'prj') {
              writer = new zip.TextWriter();
            } else {
              writer = new zip.BlobWriter();
            }

            entry.getData(writer, function(o) {
              i += 1;
              if (entry.filename[0] === '_')
                return;

              if (suffix === 'geojson' || suffix === 'json') {
                o = JSON.parse(o);
                data = {
                  'file_type' : 'json',
                  'file_name' : entry.filename,
                  'file_content' : o,
                };
                if (callback)
                  callback(data);
                return;
              } else if (suffix === "shp") {
                bShp = true;
                shpFile = o;
                fileName = entry.filename;
              } else if (suffix === "shx") {
                bShx = true;
              } else if (suffix === "dbf") {
                bDbf = true;
                dbfFile = o;
              } else if (suffix === "prj") {
                bPrj = true;
                prjFile = o;
                proj = proj4(o, proj4.defs('WGS84'));
                if (proj == undefined) {
                  MsgBox.getInstance().Show("Error", "Please drag&drop three files (*.shp, *.dbf, *.shx and *.prj)  at the same time. (Tips: use ctrl (windows) or command (mac) to select multiple files.)");
                  return false;
                }
              }

              if (i==n) {
                if (bShp && bShx && bDbf && bPrj) {
                  data = {
                    'file_type' : 'shp',
                    'file_name' : entry.filename,
                    'file_content' :  {'shp': shpFile, 'dbf' : dbfFile, 'prj':proj},
                  };
                  if (callback)
                    callback(data);
                  return;
                } else {
                  MsgBox.getInstance().Show("Error", "Please drag&drop three files (*.shp, *.dbf, *.shx and *.prj)  at the same time. (Tips: use ctrl (windows) or command (mac) to select multiple files.)");
                  return false;
                }
              }
            }); // entry.getData()
          }); // end entries.forEach()
        }); // end zipReader.getEntries()
      }); // end zip.createReader()
    }

    dropZone.ondragover = function(evt) {
      $("#"+evt.target.id).css("color", "black");
      return false;
    };

    dropZone.ondragend = function(evt) {
      $("#"+evt.target.id).css("color", "#bbb");
      return false;
    };

    dropZone.ondrop = function(evt) {
      evt.preventDefault();
      $("#"+evt.target.id).css("color", "#bbb");
      // Reset progress indicator on new file selection.
      $('#progress_bar').show();
      $('#progress_bar').css("opacity",1);

      progress.style.opacity = 1;
      progress.style.width = '0%';
      progress.textContent = '0%';

      var files = evt.dataTransfer.files; // FileList object.

      for (var i=0, n=files.length; i<n; i++) {
        var f = files[i],
            suffix = Utils.getSuffix(f.name);

        if (suffix === "zip") { // extract zip file
          HandleDropZipFile(f, function(data) {
            progress.style.width = '50%';
            progress.textContent = '50%';
            require(['ui/mapManager'], function(MapManager) {
              dlgPrgBar.hide();
              MapManager.getInstance().AddMap(data, function(map){
                // add map name/fields to all dialog
                UIManager.getInstance();
                InitDialogs(map, function(map) {
			            UIManager.getInstance().SetupMap(map);
			            $('#dialog-open-file').dialog('close');
			          });
              });
              
              // Ensure that the progress bar displays 100% at the end.
              progress.style.width = '100%';
              progress.textContent = '100%';

              setTimeout(function(){
                //document.getElementById('progress_bar').className='';
                progress.style.opacity = 0;
              }, 2000);
            }); // end require[]
          }); // end HandleDropZipFile()
          return;
        }  // end if (suffix==zip)
        else if (suffix === 'geojson') {
          let reader = new FileReader();
          reader.map_uid = f.name;
          function callback(evt) {
            var data = {
              'file_type' : 'json',
              'file_name' : evt.target.map_uid,
              'file_content' : JSON.parse(evt.target.result)
            };
            progress.style.width = '50%';
            progress.textContent = '50%';
            dlgPrgBar.hide();
            MapManager.getInstance().AddMap(data, function(map){
              // add map name/fields to all dialog
              UIManager.getInstance();
              InitDialogs(map, function(map) {
                UIManager.getInstance().SetupMap(map);
                $('#dialog-open-file').dialog('close');
              });
            });
            // Ensure that the progress bar displays 100% at the end.
            progress.style.width = '100%';
            progress.textContent = '100%';

            setTimeout(function(){
              //document.getElementById('progress_bar').className='';
              progress.style.opacity = 0;
            }, 2000);
          }
          reader.onload = callback;
          reader.readAsText(f);

          
          // run wasm in web worker
          let breader = new FileReader();
	        breader.map_uid = f.name;

          function b_callback(evt) {
            let map_uid = evt.target.map_uid;
            gda_proxy.ReadGeojsonMap(map_uid, evt.target);
            console.log(gda_proxy.GetNumObs(map_uid));
            console.log(gda_proxy.GetMapType(map_uid));
            let w_uid = gda_proxy.CreateQueenWeights(map_uid);
            let data = gda_proxy.GetNumericCol(map_uid, "hr60");
            let lisa = Module.local_moran(map_uid, w_uid, data);
            console.log(lisa.significances().get(0));
          }
          breader.onload = b_callback;
          breader.readAsArrayBuffer(f);
          
          return;
        }
      } // end for()

      MsgBox.getInstance().Show("Error", "Please drag&drop a Zip file of *.json or (*.shp  + *.dbf + *.shx + *.prj).");

    }; // end dropZone.ondrop()

    //////////////////////////////////////////////////////////////
    //  DropBox
    //////////////////////////////////////////////////////////////
    var dropboxOptions = {
      success: function(files) {
        if ( files.length == 0 ) {
          return;
        }
        var ready = false;
        var fileLink = files[0].link;
        var suffix = Utils.getSuffix(fileLink);
        var params = {
          'csrfmiddlewaretoken':  csrftoken,
          'carto_uid' : CartoProxy.GetUID(),
          'carto_key' : CartoProxy.GetKey(),
        };
        if (suffix === 'zip') {
          $('#progress_bar_openfile').show();
          params['zip'] = fileLink;

          // download the zip file from Dropbox to browser for rendering directly
          var xhr = new XMLHttpRequest();
          xhr.responseType="blob";
          xhr.open("GET", fileLink, true);
          xhr.onload = function(e) {
            if(this.status == 200) {
              var blob = this.response;
              ShowPrgDiv('uploading...', true);
              HandleDropZipFile(blob, function(data) {
                // data = {'file_type' : "shp", 'file_name', '', 'file_content': {'shp':shpFile}}
                require(['ui/mapManager'], function(MapManager){
                  dlgPrgBar.hide();
                  MapManager.getInstance().AddMap(data, function(map){
                    $('#dialog-open-file').dialog('close');
                    InitDialogs();
                  }); // end AddMap()
                }); // end require[]

              }); // end HandleDropZipFile()
            }
          }
          xhr.send();
          ready = true;
        }
      },
      cancel: function() {
        //$('#progressCont').hide();
      },
      linkType: "direct", // or "preview"
      multiselect: false, // or true
      extensions: ['.zip'],
    };
    var button = Dropbox.createChooseButton(dropboxOptions);
    $("#dropbox_div").append(button);


    return {
      // public
      Show : function() {
        dlg.dialog('open');
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

})();

return OpenFileDlg;

});
