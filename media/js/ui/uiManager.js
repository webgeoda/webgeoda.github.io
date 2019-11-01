
//todo rename to uiManager

// Author: xunli at asu.edu
define(['jquery', './msgbox',],
function($, MsgBox) {

var UIManager = (function(window, csrftoken, $, MsgBox ){

  var instance;

  var init = function() {
    // singleton

    // private
    var toolbar;

    var fileDlg, cartoDlg, choroDlg, histDlg,
      lisaDlg, kclusterDlg, localgDlg, moranDlg,
      networkDlg, scatDlg, spacetimeDlg, spregDlg,
      weightsDlg, scatMatrixDlg, parcoordsDlg,
      boxplotDlg, pcaDlg, kmeansDlg, localgearyDlg,
      localjoincountDlg, redcapDlg, maxpDlg;

    var GetDialogs = function() {
      return [
        choroDlg,
        histDlg,
        lisaDlg,
        moranDlg,
        networkDlg,
        scatDlg,
        spacetimeDlg,
        spregDlg,
        weightsDlg,
        scatMatrixDlg,
        parcoordsDlg,
        boxplotDlg,
        kclusterDlg,
        localgDlg,
        pcaDlg,
        kmeansDlg,
        localgearyDlg,
        localjoincountDlg,
        redcapDlg,
        maxpDlg
      ];
    };

    var mapManager;

    var html_load_img = "<img src=../../media/img/loading_small.gif>",
        html_check_img = "<img src=../../media/img/checkmark.png>",
        html_uncheck_img = "<img src=../../media/img/uncheckmark.png>";

    // Read zip file
    var ProcessDropZipFile = function(f, callback) {
      var bShp=0;
      zip.createReader(new zip.BlobReader(f), function(zipReader) {
        zipReader.getEntries(function(entries) {
          entries.forEach(function(entry) {
            var suffix = Utils.getSuffix(entry.filename);
            var writer;
            if (suffix === 'json' || suffix === 'geojson' || suffix === 'prj') {
              writer = new zip.TextWriter();
            } else {
              writer = new zip.BlobWriter();
            }
            entry.getData(writer, function(o) {
              if (entry.filename[0] === '_')
                return;
              if (suffix === 'geojson' || suffix === 'json') {
                o = JSON.parse(o);
                ShowNewMap(o, 'geojson', entry.filename);
                $('#progress_bar_openfile').hide();
                if (callback) callback();
                return;
              } else if (suffix === "shp") {
                bShp += 1;
                shpFile = o;
              } else if (suffix === "shx") {
                bShp += 1;
              } else if (suffix === "dbf") {
                bShp += 1;
              } else if (suffix === "prj") {
                gHasProj = true;
                gPrj = proj4(o, proj4.defs('WGS84'));
              }
              if (bShp >= 3) {
                ShowNewMap(shpFile, 'shapefile', entry.filename);
                $('#progress_bar_openfile').hide();
                if (callback) callback();
              }
            });
          });
        });
      });
    };


    function SaveMapThumbnail(canvas, layer_uuid) {
      if (  layer_uuid != undefined ) {
        var dataURL = canvas.toDataURL();
        $.ajax({
          type: "POST",
          url: "/geoda/upload_canvas/",
          data: {
             imageData: dataURL,
             layer_uuid: layer_uuid,
             csrfmiddlewaretoken: csrftoken,
          }
        }).done(function(data) {
          console.log('saved');
          // If you want the file to be visible in the browser
          // - please modify the callback in javascript. All you
          // need is to return the url to the file, you just saved
          // and than put the image in your browser.
        });
      }
    }

    var OnMapShown = function(map) {
      $('#loading').hide();
      $('#dialog-open-file').dialog('close');
      gMap = map;
      if (gAddLayer==false) {
        if (gShowLeaflet == true) {
          lmap.on('zoomstart', function() {
            gViz.CleanMaps();
          });
          lmap.on('zoomend', function() {
            //gViz.UpdateMaps();
            // already taken care by moveend
          });
          lmap.on('movestart', function(e) {
            gLmapMoveStart = e.target._getTopLeftPoint();
            gViz.CleanMaps();
          });
          lmap.on('move', function(e) {
            gLmapMove = e.target._getTopLeftPoint();
            if (gLmapMoveStart == undefined) {
              // resize window
              gLmapMoveStart = e.target.getPixelOrigin();
              gViz.CleanMaps();
              return;
            }
            var offsetX = gLmapMove.x - gLmapMoveStart.x,
                offsetY = gLmapMove.y - gLmapMoveStart.y;
            if (Math.abs(offsetX) > 0 && Math.abs(offsetY) > 0) {
              gViz.PanMaps(-offsetX, -offsetY);
            }
          });
          lmap.on('moveend', function(e) {
            gLmapMoveEnd = e.target._getTopLeftPoint();
            var offsetX = gLmapMoveEnd.x - gLmapMoveStart.x,
                offsetY = gLmapMoveEnd.y - gLmapMoveStart.y;
            if (Math.abs(offsetX) > 0 || Math.abs(offsetY) > 0) {
              if (gOffsetX != offsetX || gOffsetY != offsetY) {
                gOffsetX = offsetX;
                gOffsetY = offsetY;
                gViz.UpdateMaps();
              }
            }
          });
        } else {
          $('#map').hide();
        }
        gProjectOpen = true;
      }

      // add name to layer-tree
      AddMapToLayerTree(map.name);
    };

    var mapLayers = $('#layer-tree');

    var logoutButton = $('#btn_logout');
    logoutButton.click(function() {
      $.post("../logout/", {'csrfmiddlewaretoken' : csrftoken})
      .done(function(data) {
        location.reload();
      });
    });


    $(window).resize(function() {
      $('#layer-tree, .tool-menu').hide();
      $('#dialog-open-file').dialog("option","position","center");
    });

    var local_map_names_sel = {
      '#sel-carto-table-upload':[1,2,3],
      '#sel-road-seg':[2],
      '#sel-road-snap-point-layer':[1],
      '#sel-road-snap-road-layer':[2],
      '#sel-road-w-layer':[2],
      '#sel-spacetime-table-poly':[3],
      '#sel-spacetime-table-point':[1],
    };

    return {
      // public

      RegistMapManager : function(obj) {
        mapManager = obj;
      },
      RegistToolbar : function(obj) {
        toolbar = obj;
      },
      // dialogs
      RegistDialogs : function(dlgs) {
        fileDlg = dlgs[0];
        cartoDlg = dlgs[1];
        choroDlg = dlgs[2];
        histDlg = dlgs[3];
        lisaDlg = dlgs[4];
        moranDlg = dlgs[5];
        networkDlg = dlgs[6];
        scatDlg = dlgs[7];
        spacetimeDlg = dlgs[8];
        spregDlg = dlgs[9];
        weightsDlg = dlgs[10];
        scatMatrixDlg = dlgs[11];
        parcoordsDlg = dlgs[12];
        boxplotDlg = dlgs[13];
        kclusterDlg = dlgs[14];
        localgDlg = dlgs[15];
        pcaDlg = dlgs[16];
        kmeansDlg = dlgs[17];
        localgearyDlg = dlgs[18];
        localjoincountDlg = dlgs[19];
        redcapDlg = dlgs[20];
        maxpDlg = dlgs[21];
      },

      IsDialogSetup : function() {
        return fileDlg === undefined || fileDlg === null;
      },

      UpdateFieldNames : function(fields) {
        var dialogs = GetDialogs();
        // update all controls (selectors)
        for (var i=0, n=dialogs.length; i<n; i++) {
          dialogs[i].UpdateFields(fields);
        }
      },

      SetupMap : function(map) {

        var meta_data = {
          'layer_uuid' : map.uuid ,
          'name' : map.name,
          'geotype' : map.shpType,
          'n' : map.n,
          'fields' : map.fields,
          'json_path' : '',
        };

        // update table button
        if (map.uuid) {
          require(['ui/utils'], function(Utils) {
            $('#btnShowTest').click(function() {
              var url = "../get_table?layer_uuid=" + map.uuid;
              var size = {
                'width' : 400,
                'height' : 700
              };
              //var frame_uuid = Utils.popFrame('Data Table', url, false, w, h);
              var frame_uuid = Utils.popFrame1(url, false, size);
            });
          });
        }

        this.UpdateFieldNames(map.fields);

        // save thumbnail
        var mapCanvas = mapManager.GetMapCanvasByUuid(map.uuid);
        SaveMapThumbnail(mapCanvas.canvas, map.uuid);

        toolbar.Show(map);
      },

    };
  };

  return  {
    getInstance : function() {
      if (!instance) {
        instance = init();
      }
      return instance;
    },
  };

})(this, this.csrftoken, $, MsgBox);

return UIManager;

});
