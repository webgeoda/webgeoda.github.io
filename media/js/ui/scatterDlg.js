
// Author: xunli at asu.edu
define(['jquery',
        'colorbrewer',
        'd3',
        './utils',
        './mapManager',
        './cartoProxy'],
  function($,
        colorbrewer,
        d3,
        Utils,
        MapManager,
        CartoProxy) {

//
var ScatterPlot = function(sel_vars, data) {
  // common area
  this.id = Utils.popWindow();
  this.map = MapManager.getInstance().GetMap();
  this.map_uuid = this.map.uuid;

  if (self == undefined) self = {};
  self[this.id] = this;

  $("#" + this.id).bind('resize', this.resize);
  this.resizeTimer;

  // end of common area

  var xMin, yMin, xMax, yMax, xExt, yExt;

  var fieldX = sel_vars[0],
      fieldY = sel_vars[1];

  var sorted_points = [];

  this.fieldX = fieldX;
  this.fieldY = fieldY;
  this.points = [];
  this.xValues = [];
  this.yValues = [];

  // get bounds from data
  for (var i=0, n = data[fieldX].length; i < n; i++ ) {
    var x = data[fieldX][i],
        y = data[fieldY][i];
    this.points.push([x,y]);
    sorted_points.push([x,y]);
    if ( i == 0 ) {
      xMin = x;
      xMax = x;
      yMin = y;
      yMax = y;
    } else {
      if ( x < xMin) xMin = x;
      if ( y < yMin) yMin = y;
      if ( x > xMax) xMax = x;
      if ( y > yMax) yMax = y;
    }
  }
  // sort the points by x
  sorted_points.sort(function(a,b) {
    if (a[0] > b[0]) return 1;
    if (a[0] < b[0]) return -1;
    return 0;
  });

  for (var i in sorted_points) {
    this.xValues.push(sorted_points[i][0]);
    this.yValues.push(sorted_points[i][1]);
  }
  // scale the x&y with real data
  xExt = (xMax - xMin) / 10.0;
  yExt = (yMax - yMin) / 10.0;

  this.xExt = xExt;
  this.yExt = yExt;
  this.xMin = xMin;
  this.xMax = xMax;
  this.yMin = yMin;
  this.yMax = yMax;

  var linear = ss.linear_regression().data(this.points.map(function(d){ return d;})),
      lin = linear.line(),
      slope = linear.m(),
      intercept = linear.b(),
      r_squared = ss.r_squared(this.points, lin);

  this.lin = lin;
};

ScatterPlot.prototype = {

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
    // init drawing
    var _this = this;

    var container_id = '#' + this.id + ' > .pop-container';
        container = $(container_id),
        margin = {top: 5, right: 25, bottom: 65, left: 25},
        screenW = parseInt(container.css("width")),
        screenH = parseInt(container.css("height")),
        width = screenW - margin.left - margin.right,
        height = screenH - margin.top - margin.bottom;

    container.empty();

    var end = 2*Math.PI;

    var xExt = this.xExt,
        yExt = this.yExt,
        xMin = this.xMin,
        xMax = this.xMax,
        yMin = this.yMin,
        yMax = this.yMax,
        points = this.points,
        xValues = this.xValues,
        yValues = this.yValues,
        fieldX = this.fieldX,
        fieldY = this.fieldY,
        lin = this.lin;

    var svg = d3.select(container.get(0)).append("svg")
      .attr("class", "pop-svg")
      .attr("width", screenW)
      .attr("height", screenH)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var canvas_id = 'canvas-' + this.id,
        canvas = $('<canvas/>', {
          class : 'pop-canvas',
          id : canvas_id,
        }).appendTo(container)[0];
    canvas.width = screenW;
    canvas.height = screenH;

    var buffer = document.createElement("canvas");
    buffer.width = screenW;
    buffer.height = screenH;

    // d3 draw
    var xScale = d3.scale.linear()
        .range([0, width])
        .nice();

    var yScale = d3.scale.linear()
        .range([height, 0])
        .nice();

    var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient("left");

    //
    var regline = d3.svg.line()
        .interpolate('basis')
        .x(function(d) { return d[0]; })
        .y(function(d) { return d[1]; });

    xScale.domain([xMin - xExt, xMax + xExt]);
    yScale.domain([yMin - yExt, yMax + yExt]);

    // create axis
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
      .append("text")
        .attr("x", width)
        .attr("y", -6)
        .style("text-anchor", "end")
        .text(fieldX);

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
      .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text(fieldY);

    DrawPoints(points);

    // Render the linear fitted line
    var reg_data = xScale.domain().map(function(x) { return [xScale(x), yScale(lin(x))]; });

	// prevent 
	var l_start = reg_data[0],
		l_end = reg_data[1];
	
	var max_height = yScale(yMin) + yExt;
	if (l_end[1] > max_height) {
	  var new_end_y = max_height - l_start[1];
	  new_end_x = (l_end[0] - l_start[0]) / (l_end[1] - l_start[1]);
	  new_end_x = new_end_x * new_end_y;
	  l_end[0] = new_end_x;
	  l_end[1] = max_height;
	}
	
    svg.append('path')
      .attr('class', 'reg')
      //.style("stroke-dasharray", ("3, 3"))
      .attr('d', regline(reg_data));

    // create brush
    var brushX = d3.scale.identity().domain([0, width]),
        brushY = d3.scale.identity().domain([0, height]);

    var brush = d3.svg.brush()
      .x(brushX)
      .y(brushY)
      .on("brushstart", brushstart)
      .on("brush", brush)
      .on("brushend", brushend);

    svg.append("g")
      .attr("class", "brush")
      .call(brush)
      .call(brush.event);

    // support functions
    function brushstart(p) {
      if (brush.data !== p) {
        brush.clear();
      }
    }
    // If the brush is empty, select all circles.
    function brushend() {
      if (brush.empty()) {
        var ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, screenW, screenH);
        ctx.drawImage(buffer, 0,0);
      }
    }
    function brush(p) {
      var e = brush.extent(),
          x0 = e[0][0],
          y0 = e[0][1],
          x1 = e[1][0],
          y1 = e[1][1];
      // highlight select area
      var ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, screenW, screenH);
      ctx.globalAlpha = 0.2;
      ctx.drawImage(buffer, 0, 0);
      ctx.globalAlpha = 1;
      ctx.save();
      ctx.beginPath();
      ctx.rect(x0 + margin.left, y0 + margin.top, x1-x0, y1-y0);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(buffer, 0, 0);
      ctx.restore();
      // get points id in select area
      x0 = xScale.invert(x0),
      x1 = xScale.invert(x1),
      y0 = yScale.invert(y0),
      y1 = yScale.invert(y1);
      var selected_ids = [];
      for (var i=0, n=points.length; i < n; i++) {
        var x = points[i][0],
            y = points[i][1];
        if ( x >= x0 && x <= x1 && y <= y0 && y >= y1) {
          selected_ids.push(i);
        }
      }
      // clean up select rect since it's ids only
      var key = _this.map_uuid;
      var hl = {};
      if ( localStorage["HL_IDS"] ) {
        hl = JSON.parse(localStorage["HL_IDS"]);
      }
      if (key in hl) {
        var old = hl[key];
        if (old.length!=selected_ids.length || old.every(function(v,i) { return v != selected_ids[i];}) ){
          hl[key] = selected_ids;
          localStorage.setItem("HL_IDS",JSON.stringify(hl));
          // update HL_MAP also since it's not by ext anymore
          if (localStorage["HL_MAP"] ) {
            hm = JSON.parse(localStorage["HL_MAP"]);
            delete hm[key];
            localStorage["HL_MAP"] = JSON.stringify(hm);
          }
          // Now actually trigger it
          var evt = new CustomEvent("brushing", {
            detail: {
              uuid : _this.map_uuid, // scatter window id is used
              winid: _this.id, // scatter window id is used
            }
          });
          window.dispatchEvent(evt);
        }
      }
    }

    function Buffer2Screen(buffer) {
      var ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled= false;
      ctx.clearRect(0, 0, buffer.width, buffer.height);
      ctx.drawImage(buffer, 0, 0);
      return ctx;
    }

    function DrawPoints(pts) {
      var ctx = buffer.getContext('2d');
      ctx.imageSmoothingEnabled= false;
      ctx.lineWidth = 0.3;
      ctx.fillStyle = 'green';

      var xRange = xMax - xMin,
          yRange = yMax - yMin;

      for (var i=0, n = pts.length; i< n; i++ ) {
        var x = pts[i][0],
            y = pts[i][1];
        x = xScale(x) + margin.left;
        y = yScale(y) + margin.top;
        ctx.beginPath();
        ctx.arc(x,y,2,0,end);
        ctx.stroke();
        ctx.fill();
      }

      Buffer2Screen(buffer);
    }

    this.screenW = screenW;
    this.screenH = screenH;
    this.buffer = buffer;
    this.points = points;
    this.xScale = xScale;
    this.yScale = yScale;
    this.margin = margin;
    this.canvas = canvas;
  },

  Highlight : function(ids) {
    var screenW = this.screenW,
        screenH = this.screenH,
        buffer = this.buffer,
        points = this.points,
        xScale = this.xScale,
        yScale = this.yScale,
        margin = this.margin,
        canvas = this.canvas;

    var ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled= false;
    ctx.clearRect(0, 0, screenW, screenH);

    if (ids.length == 0) {
      ctx.globalAlpha = 1.0;
      ctx.drawImage(buffer, 0, 0);
      return;
    }
    ctx.globalAlpha = 0.2;
    ctx.drawImage(buffer, 0, 0);
    ctx.globalAlpha = 1;
    ctx.lineWidth = 0.3;
    ctx.fillStyle = 'green';

    var end = 2*Math.PI;

    for (var i=0, n = ids.length; i< n; i++ ) {
      var x = points[ ids[i] ][0],
          y = points[ ids[i] ][1];
      x = xScale(x) + margin.left;
      y = yScale(y) + margin.top;
      ctx.beginPath();
      ctx.arc(x,y,2,0,end);
      ctx.stroke();
      ctx.fill();
    }
  },

  Update : function(evt_uuid) {
    var hl_ids = JSON.parse(localStorage.getItem('HL_IDS'));
    if ( hl_ids && this.map_uuid in hl_ids && this.map_uuid == evt_uuid) {
      var ids = hl_ids[this.map_uuid];
      this.Highlight(ids);
    }
  },

  print : function() {
    console.log("ScatterPlot");
  },
};


var ScatterDlg = (function(window, $, ScatterPlot){
  var instance;

  function init() {
    // singleton

    // private methods/vars
    var sel_x = $('#sel-scatter-x');
    var sel_y = $('#sel-scatter-y');

    var scatter_plots = {}; // winid : ScatterCanvas instance

    function OnBrushing(e) {
      console.log("scatterDlg OnBrushing", e.detail);
      // don't notify the scatter windows has e.uuid
      for (var winid in scatter_plots) {
          if (winid != e.detail.winid) {
            scatter_plots[winid].Update(e.detail.uuid);
          }
      }
    }
    window.addEventListener('brushing', OnBrushing, true);

    $( "#dlg-scatter-plot" ).dialog({
      dialogClass: "dialogWithDropShadow",
      width: 500,
      height: 400,
      autoOpen: false,
      modal: false,
      resizable:  false,
      draggable: false,
      beforeClose: function(event,ui){
        $('#dialog-arrow').hide();
      },
      buttons: {
        "Open": function() {
      	  var var_x = sel_x.val(),
      	      var_y = sel_y.val();
      	  if (var_x == '' || var_y == '') {
      	    Utils.ShowMsgBox("Info", "Please select variables for scatter plot.")
      	    return;
      	  }
          var newWindow = $('#chk-newtab-hist').is(':checked');
          var map = MapManager.getInstance().GetMap(),
              current_map = MapManager.getInstance().GetMap(),
              map_uuid = current_map.uuid;

          var scatter = new ScatterPlot([var_x, var_y], current_map.data);
          scatter.print();
          scatter.show();
          scatter_plots[scatter.id] = scatter;

          $(this).dialog("close");
        },
      },
    });

    return {
      // public methods/vars
      UpdateFields : function(fields) {
        Utils.updateSelector(fields, sel_x, ['integer', 'double']);
        Utils.updateSelector(fields, sel_y, ['integer', 'double']);
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

})(this, $, ScatterPlot, Utils);

return ScatterDlg;
});
