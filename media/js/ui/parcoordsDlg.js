
// Author: xunli at asu.edu
define(['jquery', './utils', './mapManager', './cartoProxy', 'd3parcoords'], function($, Utils, MapManager, CartoProxy) {

var ParcoordPlot = function(sel_vars, data) {
  // common area
  this.id = Utils.popWindow();
  this.map = MapManager.getInstance().GetMap();
  this.map_uuid = this.map.uuid;

  if (self == undefined) self = {};
  self[this.id] = this;

  $("#" + this.id).bind('resize', this.resize);
  this.resizeTimer;
  // end of common area

  // to d3.csv data type
  this.csv = [];
  let n = data[ sel_vars[0] ].length;
  for (let i =0; i<n; ++i) {
    let row = {}
    sel_vars.forEach(function(v) {
      row[v] = data[v][i];
    });
    this.csv.push(row);
  }
  this.csv.forEach(function(d,i) { d.id = d.id || i; });
};

ParcoordPlot.prototype = {
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

    // init drawing
    var container_id = '#' + this.id + ' > .pop-container',
        container = $(container_id),
        margin = {top: 5, right: 25, bottom: 65, left: 25},
        screenW = parseInt(container.css("width")),
        screenH = parseInt(container.css("height")),
        width = screenW - margin.left - margin.right,
        height = screenH - margin.top - margin.bottom;

    container.empty();

    var par_div = $('<div/>', {
      class : 'parcoords',
    }).appendTo(container);

    var data = this.csv;

    var parcoords = d3.parcoords()(par_div.get(0))
    .alpha(0.2)
    //.color(color)
    .mode('queue')
    .height(screenH)
    .width(screenW)
    .margin({top: 20, right: 0, bottom: 45, left: 0})
    .data(data)
    .render()
    //.reorderable()
    .hideAxis(['id'])
    .brushMode('1D-axes');

    parcoords.svg.selectAll("text")
      .style("font", "12px sans-serif");

    parcoords.on("brush", function(p){
      this.unhighlight();
    });

    parcoords.on("brushend", function(data){
      var ids = [];
      for (var i=0, n=data.length; i<n; i++) {
        ids.push(data[i].id);
      }
      var hl_ids = JSON.parse(localStorage.getItem('HL_IDS'));
      if (hl_ids === null) hl_ids = {};
      hl_ids[_this.map_uuid] = ids;
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
    });

    this.parcoords = parcoords;
  },

  Highlight : function(ids)  {
    var data = this.csv;
    if (data) {
      var id_dict = {};
      for (var i=0,n=ids.length; i<n; i++) {
        id_dict[i] = null;
      }
      var hl_data = [];
      for (var i=0,n=data.length; i<n; i++) {
        if (id_dict[data[i].id] !== undefined) {
          hl_data.push(data[i]);
        }
      }
      if (hl_data.length > 0)
        this.parcoords.highlight(hl_data);
      else 
        this.parcoords.unhighlight();
    }
  },

  Update : function(evt_uuid) {
    this.parcoords.brushReset();
    var hl_ids = JSON.parse(localStorage.getItem('HL_IDS'));
    if ( hl_ids && this.map_uuid in hl_ids && this.map_uuid == evt_uuid) {
      var ids = hl_ids[this.map_uuid];
      this.Highlight(ids);
    }
  },

  print : function() {
    console.log("Parcoords Plot");
  }
};



var ParcoordsDlg = (function($){
  var instance;

  function init() {
    // singleton

    // private methods/vars
    var sel_el_name = "parcoords-vars";
    var sel_container= $("#parcoords-sels");

    var par_plots = {}; // winid : ParCanvas instance

    function OnBrushing(e) {
      console.log("Parplot OnBrushing", e.detail);
      // don't notify the par windows has e.uuid
      for (var winid in par_plots) {
          if (winid != e.detail.winid) {
            par_plots[winid].Update(e.detail.uuid);
          }
      }
    }
    window.addEventListener('brushing', OnBrushing, true);

    $( "#dlg-parcoords" ).dialog({
      dialogClass: "dialogWithDropShadow",
      width: 500,
      height: 450,
      autoOpen: false,
      modal: false,
      resizable:  false,
      draggable: true,
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
        	  var newWindow = $('#chk-newtab-parcoords').is(':checked');

            var parcoordPlot = new ParcoordPlot(fields, current_map.data);
            parcoordPlot.print();
            parcoordPlot.show();
            par_plots[parcoordPlot.id] = parcoordPlot;

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

})($);

return ParcoordsDlg;
});
