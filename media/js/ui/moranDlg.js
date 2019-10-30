
// Author: xunli at asu.edu
define(['jquery', './utils', './mapManager','./cartoProxy'], function($, Utils, MapManager, CartoProxy) {

//
var MoranScatterPlot = function(data) {
  // common area
  this.id = Utils.popWindow({width:300, height:300});
  this.map = MapManager.getInstance().GetMap();
  this.map_uuid = this.map.uuid;

  if (self == undefined) self = {};
  self[this.id] = this;

  $("#" + this.id).bind('resize', this.resize);
  this.resizeTimer;

  // end of common area
  var xMin, yMin, xMax, yMax, xExt, yExt;

  var fields = Object.keys(data),
      fieldX = fields[0],
      fieldY = fields[1];

  var sorted_points = [];

  var xx = data[fieldX],
      yy = data[fieldY],
      xx = this.normalize(xx),
      yy = this.normalize(yy);

  this.fieldX = fieldX;
  this.fieldY = fieldY;
  this.points = [];
  this.xValues = [];
  this.yValues = [];

  // get bounds from data
  for (var i=0, n = xx.length; i < n; i++ ) {
    var x = xx[i],
        y = yy[i];
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
  this.slope = slope;
};

MoranScatterPlot.prototype = {

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

  normalize : function(data) {
    var nd = [],
        mean = ss.mean(data),
        sd = ss.standard_deviation(data),
        n = data.length;
    for(var i=0; i<n; i++) {
      nd.push( (data[i] - mean ) / sd );
    }
    return nd;
  },

  show : function() {
    // init drawing
    var _this = this;

    var container_id = '#' + this.id + ' > .pop-container';
        container = $(container_id),
        margin = {top: 25, right: 25, bottom: 65, left: 25},
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
        lin = this.lin,
        slope = this.slope;

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

    //
    var xValueRange = -xMin > xMax ?
          [xMin -xExt, -xMin + xExt] : [-xMax - xExt, xMax + xExt],
        yValueRange = -yMin > yMax ?
          [yMin -yExt, -yMin + yExt] : [-yMax - yExt, yMax + yExt];
    xScale.domain(xValueRange);
    yScale.domain(yValueRange);

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

    // lines
    svg.append("line")
        .attr("class", "axis-rule")
        .style("stroke-dasharray", ("3, 3"))
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", height / 2.0)
        .attr("y2", height / 2.0);

    //
    svg.append("line")
        .attr("class", "axis-rule")
        .style("stroke-dasharray", ("3, 3"))
        .attr("x1", width / 2.0)
        .attr("x2", width / 2.0)
        .attr("y1", 0)
        .attr("y2", height);

    //
    svg.append("text")
        .text("Moran's I:" + slope)
        .attr("x", function(){
          return (width - this.clientWidth) / 2.0;
        })
        .attr("y", 0);

    DrawPoints(points);

    // Render the linear fitted line
    var reg_data = xScale.domain().map(function(x) { return [xScale(x), yScale(lin(x))]; });

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


var MoranDlg = (function($){
  var instance;

  function init() {
    // singleton

    // private methods/vars
    var sel_moran_var = $('#sel-moran-var');

    $( "#dlg-moran-scatter-plot" ).dialog({
      dialogClass: "dialogWithDropShadow",
      width: 560,
      height: 480,
      autoOpen: false,
      modal: false,
      resizable:  false,
      draggable: false,
      open: function(event, ui) {
        $('#tabs-dlg-weights').appendTo('#moran-weights-plugin');
      },
      beforeClose: function(event,ui){
	       $('#dialog-arrow').hide();
      },
      buttons: {
        "Open": function() {
          var sel_var = sel_moran_var.val();
	        var map = MapManager.getInstance().GetMap();
	        var newWindow = $('#chk-newtab-moranscatter').is(':checked');
    	    var that = $(this);

    	    require(['ui/weightsDlg'], function(WeightsDlg) {
    	      var w_conf = WeightsDlg.getInstance().GetWeightsConfigure();
            w_conf['layer_uuid'] = map.uuid;
            w_conf['csrfmiddlewaretoken'] = csrftoken;
            $.post('../create_weights/', w_conf).done(function(data) {
                console.log(data);
                var wuuid = data['wuuid'];
                var params = {
                  'layer_uuid' : map.uuid,
                  'var_x' : sel_var,
                  'wuuid' : wuuid,
                };
                $.get('../moran_scatter_plot/', params)
                  .done(function(data){
                  //ProcessData(fieldX, data);
                  var scatter = new MoranScatterPlot(data);
                  scatter.print();
                  scatter.show();
                  //scatter_plots[scatter.id] = scatter;
                });
            });
    	      that.dialog("close");
    	    });

        },
        Cancel: function() {$( this ).dialog( "close" );},
      },
    });

    return {
      // public methods/vars
      UpdateFields : function(fields) {
        Utils.updateSelector(fields, sel_moran_var, ['integer', 'double']);
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

return MoranDlg;
});
