
// Author: xunli at asu.edu
define(['jquery', './utils', './mapManager'], function($, Utils, MapManager) {

var WeightsDlg= (function($, Utils){
  var instance;

  function init() {
    // singleton

    // private methods/vars
    var weights_dict = {}; // weights_name : w_uid

    var txt_w_name = $('#txt-w-name');

    $( "#sel-w-files" ).change(function(e) {
      console.log(e.target.options[e.target.selectedIndex].text);
      let w_name = e.target.options[e.target.selectedIndex].text;
      if (w_name in weights_dict) {
        ShowWeightsMetaInfo(w_name);
      }
    });

    function ShowWeightsMetaInfo(w_name) {
      if (w_name in weights_dict) {
        let w = weights_dict[w_name];
        var table='<table id="weightsmeta"><tr><th>&nbsp;Property</th><th> Value</th></tr>';
        table+='<tr><td>Weights Type: </td><td>'+ w.get_weight_type()+'</td></tr>'; 
        table+='<tr><td>Number of Obs: </td><td>'+ w.get_num_obs()+'</td></tr>'; 
        table+='<tr><td>Is Symmetric: </td><td>'+ w.get_is_symmetric()+'</td></tr>'; 
        table+='<tr><td>Density: </td><td>'+ w.get_density()+'</td></tr>'; 
        table+='<tr><td>Sparsity: </td><td>'+ w.get_sparsity()+'</td></tr>'; 
        table+='<tr><td>Max #neighbors: </td><td>'+ w.get_max_nbrs()+'</td></tr>'; 
        table+='<tr><td>Min #neighbors: </td><td>'+ w.get_min_nbrs()+'</td></tr>'; 
        table+='<tr><td>Median #neighbors: </td><td>'+ w.get_median_nbrs()+'</td></tr>'; 
        table+='<tr><td>Mean #neighbors: </td><td>'+ w.get_mean_nbrs()+'</td></tr>'; 
        table+='<tr><td>UUID: </td><td>'+ w.get_uid()+'</td></tr>'; 
        table+='</table>';
        $("#weights-meta").html( table );	
      }
    }

    $('#dist-slider').slider({
      min: 0, max: 0,
      slide: function( event, ui ) { $('#txt-dist-thr').val(ui.value); }
    });

    $('#ker-dist-slider').slider({
      min: 0, max: 0,
      slide: function( event, ui ) { $('#txt-ker-dist-thr').val(ui.value); }
    });

    $('#spn-pow-idst, #spn-cont-order, #spn-dist-knn').spinner();

    $('#tabs-dlg-weights').tabs();

    // get current weights parameters
    function GetWeightsConf() {
      var active = $('#tabs-dlg-weights').tabs("option","active"),
          param = {};

      if ( active == 0 ) {
        var cont_type = $('#sel-cont-type').find(":selected").val(),
            cont_order = $('#spn-cont-order').val(),
            cont_ilo = $('#cbx-cont-ilo').prop("checked"),
            cont_threshold = $('#cont-dist-thres').val();
        param['cont_type'] = parseInt(cont_type);
        param['cont_order'] = parseInt(cont_order);
        param['cont_ilo'] = cont_ilo;
        param['cont_threshold'] = parseFloat(cont_threshold);

      } else if ( active == 1 ) {
        param['dist_metric'] = $('#sel-dist-metr').val();
        param['dist_knn'] = parseInt($('#spn-dist-knn').val());
        param['dist_threshold'] = parseFloat($('#txt-dist-thr').val());
        param['dist_power'] = parseInt($('#spn-pow-idst').val());

      } else if ( active == 2 ) {
        param['kernel_type'] = $("#sel-kel-type").val();
        param['kernel_nn'] = parseInt($("#txt-kel-nn").val());
        param['kernel_diag'] = $('input:radio[name=rdo-w-diagonal]:checked').attr("id");
        param['kernel_bandwidth'] = parseFloat($('#txt-ker-dist-thr'));
      }
      param['w_type'] = active;
      return param;
    }

    $( "#dialog-weights" ).dialog({
      height: 520,
      width: 560,
      autoOpen: false,
      modal: false,
      dialogClass: "dialogWithDropShadow",
      open: function(event, ui) {
        $('#sel-w-files').appendTo('#weights-plugin');
      },
      beforeClose: function(event,ui){
        $('#dialog-arrow').hide();
      },
      buttons: [{
        text: "Create",
        id: "btn-create-w",
        click: function() {

          var mapCanvas = MapManager.getInstance().GetMapCanvas(),
              current_map = MapManager.getInstance().GetMap(),
              map_uuid = current_map.uuid,
              geoda = MapManager.getInstance().GetGeoDa(map_uuid);

          var w_name = txt_w_name.val(),
              active = $('#tabs-dlg-weights').tabs("option","active");

          if ( w_name.length == 0 ) {
            Utils.ShowMsgBox("Error", "Weights name can't be empty.");
            return;
          }

          var param = GetWeightsConf();

          var is_arc = false;
          var is_mile = true;
          
          if (param['dist_metric'] == 1) {
            is_arc = true;
          } else if (param['dist_metric'] == 2) {
            is_arc = true;
            is_mile = false;
          }

          var w = "";

          if (param['w_type'] == 0) {
            // contiguity weights
            let order = param['cont_order'];
            let include_lower = param['cont_ilo'];
            let threshold = param['cont_threshold'];
            if(param['cont_type'] == 0) {
              // rook
              w = geoda.CreateRookWeights(map_uuid, order, include_lower, threshold);
            }  else {
              // queen
              w = geoda.CreateQueenWeights(map_uuid, order, include_lower, threshold);
            }
          }  else if (param['w_type'] == 1) {
            let dist_inverse = $('#cbx-w-inverse').prop("checked");
            let dist_method =$('input:radio[name=rdo-dist]:checked').attr("id");
            let is_inverse = (dist_inverse == 1);

            if ( dist_method == 0 ) {
              // knn
              let nn = param['dist_knn'];
              let power = param['dist_power'];
              w = geoda.CreateKnnWeights(map_uuid, nn, power, is_inverse, is_arc, is_mile);
            } else if ( dist_method == 1 ) {
              // thres
              let dist = param['dist_threshold'];
              let power = param['dist_power'];
              w = geoda.CreateDistWeights(map_uuid, dist, power, is_inverse, is_arc, is_mile);
            } 
          }  else if (param['w_type'] == 2) {
            // kernel weights
            let kernel_diag = (param['kernel_diag'] == 1);
            let kernel_nm = param['kernel_type'];

            let ker_spec=$('input:radio[name=rdo-w-kernel-spec]:checked').attr("id");
            if (ker_spec == 0) {
              // fixed bandwidth
              let kernel_bandwidth = param['kernel_bandwidth'];
              w = geoda.CreateKernelBandwidthWeights(map_uuid, kernel_bandwidth, kernel_nm, kernel_diag, is_arc, is_mile);

            } else {
              let is_adaptive = (ker_spec == 1);
              // adaptive bandwidth
              // max nn bandwidth
              let kernel_nn = param['kernel_nn'];
              w = geoda.CreateKernelWeights(map_uuid, kernel_nn, kernel_nm, is_adaptive, kernel_diag, is_arc, is_mile);
            }
          }
          
          if (w && w.get_uid().length > 0) {

            weights_dict[w_name] = w;
            let w_uid = w.get_uid();

            if ($("#sel-w-files option[value='" + w_name + "']").length == 0) {
              $("#sel-w-files").append(new Option(w_name, w_name));
              $("#sel-w-files").val(w_name);
              ShowWeightsMetaInfo(w_name);
            }

            Utils.ShowMsgBox("","Create weights done.");
          } else {
            Utils.ShowMsgBox("Error", "Create weights failed.");
          }
        }
      },{
        text: "Close",
        click: function() {
          $( this ).dialog( "close" );
        },
      }]
    }); // end dialog

    return {
      // public methods/vars
      UpdateFields : function(fields) {
        // update parameters
        var cur_min = $('#dist-slider').slider('option', 'min'),
            cur_max = $('#dist-slider').slider('option', 'max');
        if (cur_min == cur_max) {
          var mapCanvas = MapManager.getInstance().GetMapCanvas();
          var map_uid = mapCanvas.map.uuid,
              geoda = MapManager.getInstance().GetGeoDa(map_uid);

          var dist_min = geoda.GetMinDistThreshold(map_uid, false, true);
          var dist_max = mapCanvas.map.extent[1] -  mapCanvas.map.extent[0];
          $('#dist-slider').slider('option', 'min', dist_min);
          $('#dist-slider').slider('option', 'max', dist_max);
          $('#txt-dist-thr').val(dist_min);
          $('#ker-dist-slider').slider('option', 'min', dist_min);
          $('#ker-dist-slider').slider('option', 'max', dist_max);
          $('#txt-ker-dist-thr').val(dist_min);
        }
      },

      GetWeightsConfigure : function() {
        return GetWeightsConf();
      },

      GetWeights : function() {
        return weights_dict;
      }
    };
  } // end function init()

  return {
    getInstance : function() {
      if (!instance) {
        instance = init();
      }
      return instance;
    },
  };

})($, Utils);

return WeightsDlg;
});
