
// Author: xunli at asu.edu
define(['jquery', './utils', './mapManager','./cartoProxy'], function($, Utils, MapManager, CartoProxy) {

d3.box = function() {
  var width = 1,
      height = 1,
      duration = 0,
      domain = null,
      value = Number,
      whiskers = boxWhiskers,
      quartiles = boxQuartiles,
          showLabels = true, // whether or not to show text labels
          numBars = 4,
          curBar = 1,
      tickFormat = null;

  // For each small multiple…
  function box(g) {
    g.each(function(data, i) {
      //var boxIndex = data[0];
      //var boxIndex = 1;
      // data [ {id:0, v:xx}, {},...]
      var d = [];
      data[1].forEach(function(item){
        d.push(item.v);
      });
      // console.log(boxIndex);
      //console.log(d);

      var g = d3.select(this),
          n = d.length,
          min = d[0],
          max = d[n - 1];

      // Compute quartiles. Must return exactly 3 elements.
      var quartileData = d.quartiles = quartiles(d);

      // Compute whiskers. Must return exactly 2 elements, or null.
      var whiskerIndices = whiskers && whiskers.call(this, d, i),
          whiskerData = whiskerIndices && whiskerIndices.map(function(i) { return d[i]; });

      // Compute outliers. If no whiskers are specified, all data are "outliers".
      // We compute the outliers as indices, so that we can join across transitions!
      var outlierIndices = whiskerIndices
          ? d3.range(0, whiskerIndices[0]).concat(d3.range(whiskerIndices[1] + 1, n))
          : d3.range(n);

      // Compute the new x-scale.
      var x1 = d3.scale.linear()
          .domain(domain && domain.call(this, d, i) || [min, max])
          .range([height, 0]);

      // Retrieve the old x-scale, if this is an update.
      var x0 = this.__chart__ || d3.scale.linear()
          .domain([0, Infinity])
          // .domain([0, max])
          .range(x1.range());

      // Stash the new scale.
      this.__chart__ = x1;

      // Note: the box, median, and box tick elements are fixed in number,
      // so we only have to handle enter and update. In contrast, the outliers
      // and other elements are variable, so we need to exit them! Variable
      // elements also fade in and out.

      // Update center line: the vertical line spanning the whiskers.
      var center = g.selectAll("line.center")
          .data(whiskerData ? [whiskerData] : []);

      //vertical line
      center.enter().insert("line", "rect")
          .attr("class", "center")
          .attr("x1", width / 2)
          .attr("y1", function(d) { return x0(d[0]); })
          .attr("x2", width / 2)
          .attr("y2", function(d) { return x0(d[1]); })
          .style("opacity", 1e-6)
        .transition()
          .duration(duration)
          .style("opacity", 1)
          .attr("y1", function(d) { return x1(d[0]); })
          .attr("y2", function(d) { return x1(d[1]); });

      center.transition()
          .duration(duration)
          .style("opacity", 1)
          .attr("y1", function(d) { return x1(d[0]); })
          .attr("y2", function(d) { return x1(d[1]); });

      center.exit().transition()
          .duration(duration)
          .style("opacity", 1e-6)
          .attr("y1", function(d) { return x1(d[0]); })
          .attr("y2", function(d) { return x1(d[1]); })
          .remove();

      // Update innerquartile box.
      var box = g.selectAll("rect.box")
          .data([quartileData]);

      box.enter().append("rect")
          .attr("class", "box")
          .attr("x", 0)
          .attr("y", function(d) { return x0(d[2]); })
          .attr("width", width)
          .attr("height", function(d) { return x0(d[0]) - x0(d[2]); })
        .transition()
          .duration(duration)
          .attr("y", function(d) { return x1(d[2]); })
          .attr("height", function(d) { return x1(d[0]) - x1(d[2]); });

      box.transition()
          .duration(duration)
          .attr("y", function(d) { return x1(d[2]); })
          .attr("height", function(d) { return x1(d[0]) - x1(d[2]); });

      // Update median line.
      var medianLine = g.selectAll("line.median")
          .data([quartileData[1]]);

      medianLine.enter().append("line")
          .attr("class", "median")
          .attr("x1", 0)
          .attr("y1", x0)
          .attr("x2", width)
          .attr("y2", x0)
        .transition()
          .duration(duration)
          .attr("y1", x1)
          .attr("y2", x1);

      medianLine.transition()
          .duration(duration)
          .attr("y1", x1)
          .attr("y2", x1);

      // Update whiskers.
      var whisker = g.selectAll("line.whisker")
          .data(whiskerData || []);

      whisker.enter().insert("line", "circle, text")
          .attr("class", "whisker")
          .attr("x1", 0)
          .attr("y1", x0)
          .attr("x2", 0 + width)
          .attr("y2", x0)
          .style("opacity", 1e-6)
        .transition()
          .duration(duration)
          .attr("y1", x1)
          .attr("y2", x1)
          .style("opacity", 1);

      whisker.transition()
          .duration(duration)
          .attr("y1", x1)
          .attr("y2", x1)
          .style("opacity", 1);

      whisker.exit().transition()
          .duration(duration)
          .attr("y1", x1)
          .attr("y2", x1)
          .style("opacity", 1e-6)
          .remove();

      // Update outliers.
      var outlier = g.selectAll("circle.outlier")
          .data(outlierIndices, Number);

      outlier.enter().insert("circle", "text")
          .attr("class", "outlier")
          .attr("id", function(i) { 
	    return data[1][i].id;
	    })
          .attr("r", 2)
          .attr("cx", width / 2)
          .attr("cy", function(i) { return x0(d[i]); })
          .style("opacity", 1e-6)
        .transition()
          .duration(duration)
          .attr("cy", function(i) { return x1(d[i]); })
          .style("opacity", 1);

      outlier.transition()
          .duration(duration)
          .attr("cy", function(i) { return x1(d[i]); })
          .style("opacity", 1);

      outlier.exit().transition()
          .duration(duration)
          .attr("cy", function(i) { return x1(d[i]); })
          .style("opacity", 1e-6)
          .remove();

      // Compute the tick format.
      var format = tickFormat || x1.tickFormat(8);

      // Update box ticks.
      var boxTick = g.selectAll("text.box")
          .data(quartileData);
      if(showLabels == true) {
        boxTick.enter().append("text")
          .attr("class", "box")
          .attr("dy", ".3em")
          .attr("dx", function(d, i) { return i & 1 ? 6 : -6 })
          .attr("x", function(d, i) { return i & 1 ?  + width : 0 })
          .attr("y", x0)
          .attr("text-anchor", function(d, i) { return i & 1 ? "start" : "end"; })
          .text(format)
        .transition()
          .duration(duration)
          .attr("y", x1);
      }

      boxTick.transition()
          .duration(duration)
          .text(format)
          .attr("y", x1);

      // Update whisker ticks. These are handled separately from the box
      // ticks because they may or may not exist, and we want don't want
      // to join box ticks pre-transition with whisker ticks post-.
      var whiskerTick = g.selectAll("text.whisker")
          .data(whiskerData || []);

      if(showLabels == true) {
        whiskerTick.enter().append("text")
          .attr("class", "whisker")
          .attr("dy", ".3em")
          .attr("dx", 6)
          .attr("x", width)
          .attr("y", x0)
          .text(format)
          .style("opacity", 1e-6)
        .transition()
          .duration(duration)
          .attr("y", x1)
          .style("opacity", 1);
      }
      whiskerTick.transition()
          .duration(duration)
          .text(format)
          .attr("y", x1)
          .style("opacity", 1);

      whiskerTick.exit().transition()
          .duration(duration)
          .attr("y", x1)
          .style("opacity", 1e-6)
          .remove();
    });
    d3.timer.flush();
  }

  box.width = function(x) {
    if (!arguments.length) return width;
    width = x;
    return box;
  };

  box.height = function(x) {
    if (!arguments.length) return height;
    height = x;
    return box;
  };

  box.tickFormat = function(x) {
    if (!arguments.length) return tickFormat;
    tickFormat = x;
    return box;
  };

  box.duration = function(x) {
    if (!arguments.length) return duration;
    duration = x;
    return box;
  };

  box.domain = function(x) {
    if (!arguments.length) return domain;
    domain = x == null ? x : d3.functor(x);
    return box;
  };

  box.value = function(x) {
    if (!arguments.length) return value;
    value = x;
    return box;
  };

  box.whiskers = function(x) {
    if (!arguments.length) return whiskers;
    whiskers = x;
    return box;
  };

  box.showLabels = function(x) {
    if (!arguments.length) return showLabels;
    showLabels = x;
    return box;
  };

  box.quartiles = function(x) {
    if (!arguments.length) return quartiles;
    quartiles = x;
    return box;
  };

  return box;
};

function boxWhiskers(d) {
  return [0, d.length - 1];
}

function boxQuartiles(d) {
  return [
    d3.quantile(d, .25),
    d3.quantile(d, .5),
    d3.quantile(d, .75)
  ];
}

// Returns a function to compute the interquartile range.
function iqr(k) {
  return function(d, i) {
    var q1 = d.quartiles[0],
        q3 = d.quartiles[2],
        iqr = (q3 - q1) * k,
        i = -1,
        j = d.length;
    while (d[++i] < q1 - iqr);
    while (d[--j] > q3 + iqr);
    return [i, j];
  };
}

var BoxPlot = function(fields, data) {
  var n_fields = fields.length;

  var win_width = 120 * n_fields;
  if (win_width > 1600) win_width = 1600;
  // common area
  this.id = Utils.popWindow({width: win_width, height:300});
  this.map = MapManager.getInstance().GetMap();
  this.map_uuid = this.map.uuid;

  if (self == undefined) self = {};
  self[this.id] = this;

  $("#" + this.id).bind('resize', this.resize);
  this.resizeTimer;
  // end of common area

  var min = Infinity,
      max = -Infinity;

  // [['crm_prp, [sorted values] ],[]]
  this.data = [];
  for (var j =0; j<n_fields; j++) {
    this.data.push([fields[j], []]);
  }

  let n = data[ fields[0] ].length;
  for (let i=0; i < n; ++i ) {
    for (var j =0; j<n_fields; j++) {
      var v = data[ fields[j] ][i];
      this.data[j][1].push( {'id':i, 'v':v} );
      if (v > max) max = v;
      if (v < min) min = v;
    }
  }
  for (var j =0; j<n_fields; j++) {
    this.data[j][1].sort(function(x,y) {
      return d3.ascending(x.v, y.v);
    });
  }


  this.min = min;
  this.max = max;
};

BoxPlot.prototype = {
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

    var container_id = '#' + this.id + ' > .pop-container',
        container = $(container_id),
        margin = {top: 5, right: 25, bottom: 65, left: 25},
        screenW = parseInt(container.css("width")),
        screenH = parseInt(container.css("height")),
        width = screenW - margin.left - margin.right,
        height = screenH - margin.top - margin.bottom;

    container.empty();

    var svg = d3.select(container.get(0)).append("svg")
      .attr("class", "pop-boxsvg")
      .attr("width", screenW)
      .attr("height", screenH)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var end = 2*Math.PI;

    var min = this.min,
        max = this.max,
        labels = true,
        data = this.data;

    var chart = d3.box()
      .whiskers(iqr(1.5))
      .height(height)
      .domain([min, max])
      .showLabels(labels);

    // the x - axis
    var xScale = d3.scale.ordinal()
      .domain( data.map(function(d) {return d[0]}))
      .rangeRoundBands([0 , width], 0.7, 0.3);

    var xAxis = d3.svg.axis()
      .scale(xScale)
      .orient("bottom");

    // the y-axis
    var yScale = d3.scale.linear()
      .domain([min, max])
      .range([height + margin.top, 0 + margin.top]);

    var yAxis = d3.svg.axis()
      .scale(yScale)
      .orient("left");

    // draw the boxplots
    svg.selectAll(".box")
      .data(data)
    .enter().append("g")
      .attr("transform", function(d) {
        return "translate(" +  xScale(d[0])  + "," + margin.top + ")";
      } )
      .call(
        chart.width(xScale.rangeBand())
      );

    // add a title
    svg.append("text")
      .attr("x", (width / 2))
      .attr("y", 0 + (margin.top / 10))
      .attr("text-anchor", "middle")
      .style("font-size", "18px")
      //.style("text-decoration", "underline")
      .text("");

    // draw y axis
    svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
      .append("text") // and text1
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .style("font-size", "16px")
        .text("");

    // draw x axis
  	svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + (height  + margin.top + 10) + ")")
        .call(xAxis)
  	  .append("text")             // text label for the x axis
          .attr("x", (width / 2) )
          .attr("y",  10 )
  		.attr("dy", ".71em")
          .style("text-anchor", "middle")
  		.style("font-size", "16px")
          .text("");

    this.svg = svg;
    this.xScale = xScale;
    this.yScale = yScale;
    this.width = width;
    this.height = height;
    this.min = min;
    this.max = max;
    this.data = data;

    // add brush
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
	_this.OnSelect([]);
      }
    }
    function brush(p) {
      var e = brush.extent(),
          x0 = e[0][0],
          y0 = e[0][1],
          x1 = e[1][0],
          y1 = e[1][1];

      var xrange = xScale.range(),
          y0 = yScale.invert(y0),
          y1 = yScale.invert(y1),
          nx = xrange.length,
	  box_w = chart.width();
      
      var sel_idx = -1;
      for (var i=0; i<nx; i++) {
          var start_x = xrange[i],
              middle_x = start_x + box_w/2.0;
	      
          if ( x0 < middle_x -2 && x1 > middle_x + 2) {
              sel_idx = i;
              break;
          }
      }

      if (sel_idx >= 0) {
	var sel_ids = [];
	var n_sel_var = data[sel_idx][1].length;
	for (var i=0; i<n_sel_var; i++) {
	  var item = data[sel_idx][1][i];
	  if ( y1 <= item.v) {
	    if (y0 >= item.v) {
	      sel_ids.push(item.id);
	    } else {
	      break; 
	    }
	  }
	}
	_this.OnSelect(sel_ids);
      } // end if (sel_ix>=0)
    } // end function brush(p)

  },

  OnSelect : function(sel_ids) {
    
    // highlight/linking
    this.Highlight(sel_ids);
    var key = this.map_uuid;
    var hl = {};
    if ( localStorage["HL_IDS"] ) {
      hl = JSON.parse(localStorage["HL_IDS"]);
    }
    if (key in hl) {
      var old = hl[key];
      if (old.length!=sel_ids.length || old.every(function(v,i) { return v != sel_ids[i];}) ){
	hl[key] = sel_ids;
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
	    uuid : this.map_uuid, // scatter window id is used
	    winid: this.id, // scatter window id is used
	  }
	});
	window.dispatchEvent(evt);
      }
    } // end if (key in hl)
    if (sel_ids.length == 0 ) {
       this.svg.selectAll("circle.outlier")
	    .style("opacity", 1)
	    .style("stroke", "black");
    }
  },
  
  Highlight : function(ids) {
    console.log(ids);
    var svg = this.svg;

    if (ids.length>0) {
       svg.selectAll("circle.outlier")
	    .style("opacity", 0.2)
	    .style("stroke", "black")
	    .each(function(){
	      if (ids.indexOf(parseInt(this.id))>=0) {
		this.style.opacity = 1;
		this.style.stroke = "red";
	      }
	    });
    } else {
       svg.selectAll("circle.outlier")
	    .style("opacity", 1)
	    .style("stroke", "black");
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
    console.log("Box plot");
  }
};

var BoxplotDlg = (function($){
  var instance;

  function init() {
    // singleton

    var box_plots = {}; // winid : BoxplotCanvas instance

    function OnBrushing(e) {
      console.log("scatterDlg OnBrushing", e.detail);
      // don't notify the BoxPlot windows has e.uuid
      for (var winid in box_plots) {
          if (winid != e.detail.winid) {
            box_plots[winid].Update(e.detail.uuid);
          }
      }
    }
    window.addEventListener('brushing', OnBrushing, true);

    $( "#dlg-boxplot" ).dialog({
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

          var fields = [];
          $('input[name='+sel_el_name+']:checked').each(function(i, obj){
            fields.push(obj.value);
          });

      	  if (fields.length == 0) {
      	    Utils.ShowMsgBox("Info", "Please select variable for box plot.")
      	    return;
      	  }

          var map = MapManager.getInstance().GetMap(),
              current_map = MapManager.getInstance().GetMap(),
              map_uuid = current_map.uuid;
  	       var newWindow = $('#chk-newtab-boxplot').is(':checked');

               var boxPlot = new BoxPlot(fields, current_map.data);
               boxPlot.print();
               boxPlot.show();
               box_plots[boxPlot.id] = boxPlot;

  	       $(this).dialog("close");
	      },
	      Cancel: function() {$( this ).dialog( "close" );},
      },
    });

    // private methods/vars
    var sel_el_name = "boxplot-vars";
    var sel_boxplot_x = $('#sel-boxplot-x') ;

    return {
      // public methods/vars
      UpdateFields : function(fields) {
         //Utils.updateSelector(fields, sel_boxplot_x, ['integer', 'double']);
	       Utils.addMultiCheckbox(sel_el_name, fields, sel_boxplot_x, ['integer', 'double']);
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

return BoxplotDlg;
});
