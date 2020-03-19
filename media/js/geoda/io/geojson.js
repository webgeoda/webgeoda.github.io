
// Author: xunli at asu.edu

define(['../utils','kdtree'], function(Utils, kdtree){


  /**
   * @class GeoJSON
   *
   * @param name -- the name of the input JSON object
   * @param json -- the JSON object represents the map shapes
   * @param prj -- the projection of the map
   */
  var GeoJSON = function(name, json, prj) {
    this.name = name;
    this.json = json;
    this.prj = prj;

    this.n = this.json.features.length;
    //this.shpType = this.json.features[0].geometry.type.toUpperCase();
    this.shpTypes = [];
    this.bbox = [];
    this.centroids = [];
    this.extent = null;

    this.points = [];
    this.pt_dict = {};
    this.queen_dict = {};
    this.arcs = [];
    this.arc_dict = {};
    this.shapes = [];

    // number of non-duplicated points
    this.nn = 0;

    this.init();
  };

  /**
   * @member static function
   * @param type -- check the geometry type of JSON object
   */
  GeoJSON.translateGeoJSONType = function(type) {
    typeLookup = {
      LineString: 'polyline',
      MultiLineString: 'polyline',
      Polygon: 'polygon',
      MultiPolygon: 'polygon',
      Point: 'point',
      MultiPoint: 'point'
    };
    return typeLookup[type] || null;
  };


  GeoJSON.prototype = {

    addPoint : function(x, y, polyid) {
      if (this.queen_dict[[x,y]]) {
        this.queen_dict[[x,y]][polyid] = null;
      } else {
        this.queen_dict[[x,y]] = {polyid:null};
      }
      if (this.pt_dict[x]) {
        if (this.pt_dict[x][y]) {
          return this.pt_dict[x][y];
        } else {
          this.points.push([x,y]);
          this.pt_dict[x][y] = this.nn;
          return this.nn++;
        }
      } else {
        this.pt_dict[x] = {};
        this.pt_dict[x][y] = this.nn;
        this.points.push([x,y]);
        return this.nn++;
      }
    },

    addArc : function(pt1, pt2, polyid) {
      if (this.arc_dict[[pt1, pt2]]) {
        this.arc_dict[[pt1, pt2]][polyid] = null;
      } else if (this.arc_dict[[pt2, pt1]]) {
        this.arc_dict[[pt2, pt1]][polyid] = null;
      } else {
        this.arc_dict[[pt1, pt2]] = {};
        this.arc_dict[[pt1, pt2]][polyid] = null;
      }
    },

    init: function() {

      // get extent, bbox, centroids
      var minX = Number.POSITIVE_INFINITY,
          maxX = Number.NEGATIVE_INFINITY,
          minY = Number.POSITIVE_INFINITY,
          maxY = Number.NEGATIVE_INFINITY;

      for ( var i=0; i<this.n; i++ ) {
        var bminX = Number.POSITIVE_INFINITY,
            bmaxX = Number.NEGATIVE_INFINITY,
            bminY = Number.POSITIVE_INFINITY,
            bmaxY = Number.NEGATIVE_INFINITY,
            geom = this.json.features[i].geometry,
            x, y, part, projPt, ptIdx, arcIdx;

        var arcs, arc;

        this.shpTypes.push(geom.type.toUpperCase());

        if (geom.type.toUpperCase() === "MULTILINESTRING" || geom.type.toUpperCase() === "MULTIPOLYGON") {
          arcs = [];

          for (var j=0, nParts=geom.coordinates.length; j<nParts; j++ ) {
            arc = [];

            if (typeof(geom.coordinates[j][0]) == "number") {
              part = geom.coordinates[j];
            } else {
              part = geom.coordinates[j][0];
            }

            for (var k=0, nPoints=part.length; k<nPoints; k++) {
              x = part[k][0];
              y = part[k][1];
              if (this.prj) {
                projPt = this.prj.forward([x, y]);
                x = projPt[0];
                y = projPt[1];
                part[k][0] = x;
                part[k][1] = y;
              }
              if (x > maxX) {maxX = x;}
              if (x <= minX) {minX = x;}
              if (y > maxY) {maxY = y;}
              if (y <= minY) {minY = y;}

              if (x > bmaxX) {bmaxX = x;}
              if (x <= bminX) {bminX = x;}
              if (y > bmaxY) {bmaxY = y;}
              if (y <= bminY) {bminY = y;}
              
              ptIdx = this.addPoint(x, y, i);
              arc.push(ptIdx);
            }
            for (var k=0, nArc=arc.length; k<nArc-1;k++) {
              this.addArc(arc[k], arc[k+1], i);
            }
            arcs.push(arc);
          }
          this.shapes.push(arcs);

        } else if (geom.type.toUpperCase() === "LINESTRING" || geom.type.toUpperCase() === "POLYGON" ||
                   geom.type.toUpperCase() === "MULTIPOINT") {
          arc = [];

          // in some cases: geom.coordinates is [Array[24]]
          // in other cases: geom.coordinates is Array[24]
          var coordinates;
          if (typeof(geom.coordinates[0][0]) == "number") {
            coordinates = geom.coordinates;
          } else {
            coordinates = geom.coordinates[0];
          }

          for (var k=0, nPoints=coordinates.length; k<nPoints; k++ ) {
            x = coordinates[k][0];
            y = coordinates[k][1];
            if (this.prj) {
              projPt = this.prj.forward([x, y]);
              x = projPt[0];
              y = projPt[1];
              coordinates[k][0] = x;
              coordinates[k][1] = y;
            }
            if (x > maxX) {maxX = x;}
            if (x <= minX) {minX = x;}
            if (y > maxY) {maxY = y;}
            if (y <= minY) {minY = y;}

            if (x > bmaxX) {bmaxX = x;}
            if (x <= bminX) {bminX = x;}
            if (y > bmaxY) {bmaxY = y;}
            if (y <= bminY) {bminY = y;}
            ptIdx = this.addPoint(x, y,i );
            arc.push(ptIdx);
          }
          for (var k=0, nArc=arc.length; k<nArc-1;k++) {
            this.addArc(arc[k], arc[k+1], i);
          }
          this.shapes.push(arc);

        } else if (geom.type.toUpperCase() === "POINT") {
            x = geom.coordinates[0];
            y = geom.coordinates[1];
            if (this.prj) {
              projPt = this.prj.forward([x, y]);
              x = projPt[0];
              y = projPt[1];
              geom.coordinates[0] = x;
              geom.coordinates[1] = y;
            }
            if (x > maxX) {maxX = x;}
            if (x <= minX) {minX = x;}
            if (y > maxY) {maxY = y;}
            if (y <= minY) {minY = y;}

            if (x > bmaxX) {bmaxX = x;}
            if (x <= bminX) {bminX = x;}
            if (y > bmaxY) {bmaxY = y;}
            if (y <= bminY) {bminY = y;}

            ptIdx = this.addPoint(x, y, i);
            this.shapes.push(ptIdx);
        }

        if ( geom.type.toUpperCase() == "POLYGON" || geom.type.toUpperCase() == "MULTIPOLYGON" ||
            geom.type.toUpperCase() == "LINESTRING" || geom.type.toUpperCase() == "LINE" )
        {
          this.bbox.push([bminX, bmaxX, bminY, bmaxY]);
          this.centroids.push([(bmaxX + bminX)/2.0, (bmaxY + bminY)/2.0]);
        } else {
          this.bbox.push([x, x, y, y]);
          this.centroids.push([x, y]);
        }
      }
      this.extent = [minX, maxX, minY, maxY];
      if (this.name == "states.geojson") {
        this.extent = [-144.731422424316, -66.9698486328125, 24.9559669494629, 49.3717346191406];
      }
    },

  };

return GeoJSON;

}); // end define
