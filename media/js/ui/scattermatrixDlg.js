
// Author: xunli at asu.edu
define(['jquery', './utils', './mapManager', './cartoProxy'], function($, Utils, MapManager, CartoProxy) {

  var ScatterMatrixPlot = function(fields, data) {
    // common area
    this.id = Utils.popWindow();
    this.map = MapManager.getInstance().GetMap();
    this.map_uuid = this.map.uuid;

    if (self == undefined) self = {};
    self[this.id] = this;

    $("#" + this.id).bind('resize', this.resize);

    this.resizeTimer;
    // end of common area

    this.data = {};
    this.fields = fields;
    for (let f in fields) {
      this.data[fields[f]] = data[fields[f]];
    }
  };

  ScatterMatrixPlot.prototype = {

    resize : function() {
      console.log("resize");
      var _this = self[this.id];
      var container_id = "#" + this.id + " > .pop-container";
      $(container_id).empty();
      clearTimeout(_this.resizeTimer);
      resizeTimer = setTimeout(function() {
        _this.show();
      }, 500);
    },

    show : function() {
      var _this = this;
      var data = this.data,
          fields = this.fields;

      var container_id = '#' + this.id + ' > .pop-container',
          container = $(container_id);

      var margin = {top: 5, right: 30, bottom: 35, left: 10},
          screenW = parseInt(container.css("width")),
          screenH = parseInt(container.css("height")),
          width = screenW - margin.left - margin.right,
          height = screenH - margin.top - margin.bottom;

      // Size parameters for each cell
      var n = fields.length,
          cell_w = screenW / n,
          cell_h = screenH / n,
          padding = 15;

      if (cell_w < cell_h) {
        size = cell_w - padding;
        margin.top = (screenH - size * n) / 2.0;
      } else {
        size = cell_h - padding;
        margin.left = (screenW - size * n) / 2.0;
      }

      var svg_id = "svg-" + this.id;
      var svg = d3.select(container.get(0)).append("svg")
        .attr("id", svg_id)
        .attr("class", "pop-svg")
        .attr("width", screenW)
        .attr("height", screenH)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      var canvas_id = 'canvas-' + this.id;
      var canvas = $('<canvas/>', {
        class : 'pop-canvas',
        id : canvas_id,
      }).appendTo(container)[0];
      canvas.width = screenW;
      canvas.height = screenH;

      var hlcanvas_id = 'hlcanvas-' + this.id;
      var hlcanvas = $('<canvas/>', {
        class : 'pop-canvas',
        id : hlcanvas_id,
      }).appendTo(container)[0];
      hlcanvas.width = screenW;
      hlcanvas.height = screenH;

      var buffer = document.createElement("canvas");
      buffer.width = screenW;
      buffer.height = screenH;

      var ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, screenW, screenH);
      ctx.globalAlpha = 0.5;
      ctx.imageSmoothingEnabled= false;

      var hlctx = hlcanvas.getContext('2d');
      hlctx.clearRect(0, 0, screenW, screenH);
      hlctx.globalAlpha = 0.8;
      hlctx.imageSmoothingEnabled= false;

      var bufferctx = buffer.getContext('2d');
      bufferctx.clearRect(0, 0, screenW, screenH);
      bufferctx.globalAlpha = 0.8;
      bufferctx.imageSmoothingEnabled= false;

      var screenObj = {};

      var end = 2*Math.PI;

      function highlightPoints(hlPoints)  {
        hlctx.clearRect(0, 0, screenW, screenH);
        hlctx.strokeStyle = 'red';
        for (var screenX in hlPoints) {
          for (var screenY in hlPoints[screenX]) {
            hlctx.beginPath();
            hlctx.arc(screenX, screenY, 1, 0, end);
            hlctx.stroke();
            hlctx.closePath();
          }
        }
        hlctx.strokeStyle = '';
      }

      function highlightPrep(ids, hlPoints) {
        if (hlPoints === undefined) hlPoints = {};

        for (var _screenID in screenObj) {
          _screenCoords = screenObj[_screenID];
          for (var i=0, m=ids.length; i<m; i++) {
            item = _screenCoords[ids[i]];
            screenX = item[0];
            screenY = item[1];
            if (hlPoints[screenX] === undefined)
              hlPoints[screenX] = {};
            hlPoints[screenX][screenY] = null;
          }
        }
        return hlPoints;
      }

      // Position scales.
      var x = {}, y = {};

      fields.forEach(function(field) {
        var value = function(d) { return d[field]; },
            min_v = d3.min(data[field]),
            max_v = d3.max(data[field]),
            ext = (max_v - min_v) / 100.0,
            domain = [min_v - ext, max_v + ext],
            range = [padding / 2, size - padding / 2];
        x[field] = d3.scale.linear().domain(domain).range(range);
        y[field] = d3.scale.linear().domain(domain).range(range.reverse());
      });

      // Axes.
      var axis = d3.svg.axis()
        .ticks(5)
        .tickSize(size * n);

      // Brush.
      var brush = d3.svg.brush()
        .on("brushstart", brushstart)
        .on("brush", brush)
        .on("brushend", brushend);

      // X-axis.
      svg.selectAll("g.x.axis_no")
        .data(fields)
      .enter().append("svg:g")
        .attr("class", "x axis_no")
        .attr("transform", function(d, i) { return "translate(" + i * size + ",0)"; })
        .each(function(d) { d3.select(this).call(axis.scale(x[d]).orient("bottom")); });

      // Y-axis.
      svg.selectAll("g.y.axis_no")
        .data(fields)
      .enter().append("svg:g")
        .attr("class", "y axis_no")
        .attr("transform", function(d, i) { return "translate(0," + i * size + ")"; })
        .each(function(d) { d3.select(this).call(axis.scale(y[d]).orient("right")); });

      // Cell and plot.
      var cell = svg.selectAll("g.cell")
        .data(cross(fields, fields))
      .enter().append("svg:g")
        .attr("class", "cell")
        .attr("transform", function(d) {
          return "translate(" + d.i * size + "," + d.j * size + ")";
        })
        .each(plot);

      // Titles for the diagonal.
      cell.filter(function(d) { return d.i == d.j; }).append("svg:text")
        .attr("x", padding)
        .attr("y", padding)
        .attr("dy", ".71em")
        .text(function(d) { return d.x; });

      // Clear the previously-active brush, if any.
      function brushstart(p) {
        if (brush.data !== p) {
          cell.call(brush.clear());
          brush.x(x[p.x]).y(y[p.y]).data = p;
        }
      }

      // Highlight the selected circles.
      function brush(p) {
        // highlight current selection without computing
        var pos_parent = $("#" + svg_id).position(),
            pos = $(this).find('.extent').position(),
            startX = pos.left - pos_parent.left,
            startY = pos.top - pos_parent.top,
            w = parseFloat($(this).find('.extent').attr("width")),
            h = parseFloat($(this).find('.extent').attr("height")),
            endX = startX + w,
            endY = startY + h;

        ctx.clearRect(0, 0, screenW, screenH);
        ctx.globalAlpha = 0.2;
        ctx.drawImage(buffer, 0, 0);

        // highlight in current cells
        var item,
            offsetX = margin.left + (size) * p.i,
            offsetY = margin.top + (size) * p.j,
            screenX,
            screenY,
            hlIds = [];
            hlPoints = {};

        var screenID = p.x + p.y;
        var screenCoords = screenObj[screenID];

        for (var i=0, m=screenCoords.length; i<m; i++) {
          item = screenCoords[i];
          screenX = item[0];
          screenY = item[1];
          if (startX <= screenX && screenX <= endX &&
              startY <= screenY && screenY <= endY) {
              if (hlPoints[screenX] === undefined)
                hlPoints[screenX] = {};
              hlPoints[screenX][screenY] = null;
              hlIds.push(i);
          }
        }

        // other cells
        for (var _screenID in screenObj) {
          if (screenID === _screenID) continue;
          _screenCoords = screenObj[_screenID];
          for (var i=0, m=hlIds.length; i<m; i++) {
            item = _screenCoords[hlIds[i]];
            screenX = item[0];
            screenY = item[1];
            if (hlPoints[screenX] === undefined)
              hlPoints[screenX] = {};
            hlPoints[screenX][screenY] = null;
          }
        }

        highlightPoints(hlPoints);

        var hl_ids = JSON.parse(localStorage.getItem('HL_IDS'));
        if (hl_ids === null) hl_ids = {};
        hl_ids[_this.map_uuid] = hlIds;
        localStorage.setItem("HL_IDS", JSON.stringify(hl_ids));
          // update HL_MAP also since it's not by ext anymore
          if (localStorage["HL_MAP"] ) {
            hm = JSON.parse(localStorage["HL_MAP"]);
            delete hm[_this.map_uuid];
            localStorage["HL_MAP"] = JSON.stringify(hm);
          }

          // Now actually trigger it
          var evt = new CustomEvent("brushing", {
            detail: {
              uuid : _this.map_uuid, // window id is used
              winid: _this.id, // par window id is used
            }
          });
          window.dispatchEvent(evt);
      }

      // If the brush is empty, select all circles.
      function brushend() {
        if (brush.empty())  {
          hlctx.clearRect(0, 0, screenW, screenH);
          ctx.clearRect(0, 0, screenW, screenH);
          ctx.globalAlpha = 0.5;
          ctx.drawImage(buffer, 0, 0);
        }
      }

      function cross(a, b) {
        var c = [], n = a.length, m = b.length, i, j;
        for (i = -1; ++i < n;) for (j = -1; ++j < m;) c.push({x: a[i], i: i, y: b[j], j: j});
        return c;
      }

      function plot(p) {
        var cell = d3.select(this);

        // Plot frame.
        cell.append("svg:rect")
          .attr("class", "frame")
          .attr("x", (padding / 2.0)- 2)
          .attr("y", (padding / 2.0) - 2)
          .attr("width", size - padding + 4)
          .attr("height", size - padding + 4);

        // plot dots in canvas
        var item,
            offsetX = margin.left + (size) * p.i,
            offsetY = margin.top + (size) * p.j,
            screenX,
            screenY;

        var screenID = p.x + p.y;
        screenObj[screenID] = [];

        var n_rows = data[fields[0]].length;
        var pts_dict = {};

        for (var i=0, m=n_rows; i<m; i++) {
          screenX = (offsetX + x[p.x](data[p.x][i])) | 0;
          screenY = (offsetY + y[p.y](data[p.y][i])) | 0;

          screenObj[screenID].push([screenX, screenY]);

          if ([screenX, screenY] in pts_dict)
            continue;
          pts_dict[[screenX, screenY]] = 1;
          bufferctx.beginPath();
          bufferctx.arc(screenX, screenY, 1, 0, end);
          bufferctx.stroke();
          bufferctx.fill();
        }

        if (p.i === n -1 && p.j === n-1)
          ctx.drawImage(buffer, 0, 0);

        // Plot brush.
        cell.call(brush.x(x[p.x]).y(y[p.y]));
      }
      _this.highlightPrep = highlightPrep;
      _this.highlightPoints = highlightPoints;
    },

  Update : function(evt_uuid) {
    var hl_ids = JSON.parse(localStorage.getItem('HL_IDS'));
    if ( hl_ids && this.map_uuid in hl_ids && this.map_uuid == evt_uuid) {
      var ids = hl_ids[this.map_uuid];
      var pts = this.highlightPrep(ids);
      this.highlightPoints(pts);
    }
  },

    print : function() {
      console.log("scatter matrix plot.")
    },
  };

var ScatterMatrixDlg = (function($){
  var instance;

  function init() {
    // singleton

    // private methods/vars
    var sel_el_name = '#scattermatrix-vars';
    var sel_container = $('#scattermatrix-sels')

    var sm_plots = {}; // winid : ParCanvas instance

    function OnBrushing(e) {
      console.log("Parplot OnBrushing", e.detail);
      // don't notify the par windows has e.uuid
      for (var winid in sm_plots) {
          if (winid != e.detail.winid) {
            sm_plots[winid].Update(e.detail.uuid);
          }
      }
    }
    window.addEventListener('brushing', OnBrushing, true);

    $( "#dlg-scatter-matrix" ).dialog({
      dialogClass: "dialogWithDropShadow",
      width: 600,
      height: 480,
      autoOpen: false,
      modal: false,
      resizable:  false,
      draggable: false,
      beforeClose: function(event,ui){
	      $('#dialog-arrow').hide();
      },
      buttons: {
      	"Open": function() {
      	  var fields = [];
      	  $('input[name='+sel_el_name+']:checked').each(function(i, obj){
      	    fields.push(obj.value);
      	  });

      	  if (fields.length <2) {
      	    Utils.ShowMsgBox("Info", "Please select at least 2 variables for scatter matrix.")
      	    return;
      	  }

          var map = MapManager.getInstance().GetMap(),
              current_map = MapManager.getInstance().GetMap(),
              map_uuid = current_map.uuid;

      	  var newWindow = $('#chk-newtab-scattermatrix').is(':checked');

          var scatterMatrix = new ScatterMatrixPlot(fields, current_map.data);
          scatterMatrix.print();
          scatterMatrix.show();
          sm_plots[scatterMatrix.id] = scatterMatrix;

          $(this).dialog("close");
      	},
      },
    });


    return {
      // public methods/vars
      UpdateFields : function(fields) {
	       Utils.addMultiCheckbox(sel_el_name, fields, sel_container, ['integer', 'double']);
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

})($, Utils);

return ScatterMatrixDlg;
});
