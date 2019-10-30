
// Author: xunli at asu.edu
define(['jquery', './utils', './mapManager','./cartoProxy'], function($, Utils, MapManager, CartoProxy) {

var HistogramPlot = function(var_x, data) {
  // common area
  this.id = Utils.popWindow();
  this.map = MapManager.getInstance().GetMap();
  this.map_uuid = this.map.uuid;

  if (self == undefined) self = {};
  self[this.id] = this;

  $("#" + this.id).bind('resize', this.resize);
  this.resizeTimer;

  // end of common area

  this.results = data[var_x];
  this.n = this.results.length;

  var xMin, xMax;
  for (var i=0; i < this.n; i++ ) {
    var _x = this.results[i];
    if ( i == 0 ) {
      xMin = _x;
      xMax = _x;
    } else {
      if ( _x < xMin) xMin = _x;
      if ( _x > xMax) xMax = _x;
    }
  }
  this.xMin = xMin;
  this.xMax = xMax;
  this.var_x = var_x;
};

HistogramPlot.prototype = {

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

  show: function() {
    var _this = this;

    var xMin = this.xMin,
        xMax = this.xMax,
        results = this.results,
        n_records = this.n;

    // init drawing
    var container_id = '#' + this.id + ' > .pop-container';
        container = $(container_id),
        margin = {top: 5, right: 25, bottom: 65, left: 25},
        screenW = parseInt(container.css("width")),
        screenH = parseInt(container.css("height")),
        width = screenW - margin.left - margin.right,
        height = screenH - margin.top - margin.bottom;

    container.empty();

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

    var xScale = d3.scale.linear()
      .domain([xMin, xMax])
      .range([0, width]).nice();

    var bin_thres = xScale.ticks(10);
    var histogram = d3.layout.histogram()
        .bins(bin_thres)
        (results);

    var bin_dict = {};

    for (var b_idx=0, n=bin_thres.length; b_idx < n-1; b_idx++) {
      bin_dict[b_idx]  = [];
      var lbound = bin_thres[b_idx],
          ubound = bin_thres[b_idx+1];
      for (var j=0; j < n_records; j++ ) {
        if (results[j] >= lbound && results[j] < ubound) {
          bin_dict[b_idx].push(j);
        }
      }
    }

    var numbins = histogram.length,
        barWidth = (width-10) / numbins - 1;

    var y_max = d3.max(histogram, function(d) { return d.y; });

    var yScale = d3.scale.linear()
      .domain([0, y_max])
      .range([height, 0]).nice();

    var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient("left");

    var bar = svg.selectAll(".bar")
        .data(histogram)
      .enter().append("g")
        .attr("class", "bar")
        .attr("transform", function(d) {
          return "translate(" + xScale(d.x) + "," + yScale(d.y) + ")";
        });

    var colors = colorbrewer.Paired[10];

    bar.append("rect")
        .attr("x", 1)
        .attr("id", function(d,i) { return i;})
        .attr("width", barWidth)
        .attr("height", function(d) {
          return height +2 - yScale(d.y) ;
        })
        .style('fill', function(d,i) {
            return colors[i%10];
          })
        .on("click",function(){
            svg.selectAll('.bar_hl').remove();
            var bin_idx = $(this).attr("id")
                selected_ids = bin_dict[bin_idx];
            if (selected_ids) {
              // highlight/linking
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
          })
        .on("mouseover",function(){
            $(this).attr("fill-old", $(this).css("fill"));
            $(this).css("fill", 'rgb(255,255,0)');
            $(this).css("cursor", "hand");
          })
        .on("mouseout",function(){
            if($(this).attr("fill-old"))
              $(this).css("fill", $(this).attr("fill-old"));
          });

    bar.append("text")
        .attr("y", 0)
        .attr("x", barWidth / 2)
        .attr("text-anchor", "middle")
        .text(function(d) { return d.y; });

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + (parseInt(height) + 10) +  ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
      .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .text("");

    //
    svg.append("text")
        .text(this.var_x)
        .attr("x", function(){
          return (width - this.clientWidth) / 2.0;
        })
        .attr("y", 5);

    _this.svg = svg;
    _this.xScale = xScale;
    _this.yScale = yScale;
    _this.barWidth = barWidth;
    _this.height = height;
  },

  Highlight: function(ids) {
    var svg = this.svg;

    if (ids.length>0) {
      var xScale = this.xScale,
          yScale = this.yScale,
          results = this.results,
          barWidth = this.barWidth,
          height  = this.height,
          sel_results = [];

      var bin_thres = xScale.ticks(10);

      ids.forEach(function(i){
        sel_results.push(results[i]);
      });

      svg.selectAll('.bar').style("opacity", 0.2);
      svg.selectAll('.bar_hl').remove();

      var histogram = d3.layout.histogram()
        .bins(bin_thres)
        (sel_results);

      var bar = svg.selectAll(".bar_hl")
          .data(histogram)
        .enter().append("g")
          .attr("class", "bar_hl")
          .attr("transform", function(d) {
            return "translate(" + xScale(d.x) + "," + yScale(d.y) + ")";
          });

      var colors = colorbrewer.Paired[10];

      bar.append("rect")
          .attr("x", 1)
          .attr("id", function(d,i) { return i;})
          .attr("width", barWidth)
          .attr("height", function(d) {
            return height +2 - yScale(d.y) ;
          })
          .style('fill', function(d,i) {
              return colors[i%10];
            });

    } else {
      svg.selectAll('.bar').style("opacity", 1.0);
      svg.selectAll('.bar_hl').remove();
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
    console.log("histogram plot.")
  },
};

var HistogramDlg = (function($){
  var instance;

  var histogram_plots = {}; // winid : HistCanvas instance

  function OnBrushing(e) {
    console.log("histogramDlg OnBrushing", e.detail);
    // don't notify the histogram  windows has e.uuid
    for (var winid in histogram_plots) {
        if (winid != e.detail.winid) {
          histogram_plots[winid].Update(e.detail.uuid);
        }
    }
  }
  window.addEventListener('brushing', OnBrushing, true);

  function init() {
    // singleton
    $( "#dlg-histogram" ).dialog({
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

      	  var sel_x = $('#sel-histogram-x').val();
      	  if (sel_x == '') {
      	    Utils.ShowMsgBox("Info", "Please select variable for histogram plot.")
      	    return;
      	  }

          var map = MapManager.getInstance().GetMap(),
              current_map = MapManager.getInstance().GetMap(),
              map_uuid = current_map.uuid;

      	  var newWindow = $('#chk-newtab-hist').is(':checked');

          var histogram = new HistogramPlot(sel_x, current_map.data);
          histogram.print();
          histogram.show();
          histogram_plots[histogram.id] = histogram;

      	  $(this).dialog("close");
      	},
      	Cancel: function() {$( this ).dialog( "close" );},
      },
    });

    // private methods/vars
    var sel_hist_x = $('#sel-histogram-x') ;

    return {
      // public methods/vars
      UpdateFields : function(fields) {
        Utils.updateSelector(fields, sel_hist_x, ['integer', 'double']);
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

return HistogramDlg;
});
