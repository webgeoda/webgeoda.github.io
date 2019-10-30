

// Author: xunli at asu.edu
define(['jquery', 'd3', './msgbox', './message'], function($, d3, MsgBox, M) {


return {
  // update field selector
  addMultiCheckbox: function(name, fields, div, filter) {
    div.empty();

    var container = $('<ul class="mvcheckbox"></ul');
    for (var field in fields) {
      var type = fields[field];

      // some types from Postgresql are more complex
      if (type.toLowerCase() === "integer64") {
        type = "integer";
      }
      if (type.toLowerCase() === "real" || type.toLowerCase() === "number") {
        type = "double";
      }

      if (filter && filter.indexOf(type) >= 0) {
        $('<li><input type="checkbox" name="'+name+'" value="'+field+'">'+field+'</li>').appendTo(container);
      }
    }

    var fieldset = $('<fieldset class="group"></fieldset');
    fieldset.append($('<legend>').text(""));
    fieldset.append(container);

    div.append(fieldset);
  },

  // update field selector
  addVariablesCheckbox: function(name, fields, div, filter) {
    div.empty();
    var field_names = [];
    for (var field in fields) {
      field_names.push(field);
    }
    field_names.sort();
    for (var field in fields) {
      var type = fields[field];

      // some types from Postgresql are more complex
      if (type.toLowerCase() === "integer64" || type.toLowerCase() === "integer") {
        type = "integer";
      }
      if (type.toLowerCase() === "real" || type.toLowerCase() === "number") {
        type = "double";
      }

      if (filter && filter.indexOf(type) >= 0) {
        $('<label><input type="checkbox" name="'+name+'" value="'+field+'">'+field+'</label>').appendTo(div);
      }
    }
  },
  // update field selector: filter has 3 types
  // integer, double, string
  updateSelector : function(fields, selector, filter) {
    var field_names = [];
    for (var field in fields) {
      field_names.push(field);
    }
    field_names.sort();

    selector.find('option').remove().end();
    selector.append($('<option>', {value: ''}).text(''));
    for (var field in fields) {
      var type = fields[field];

      // some types from Postgresql are more complex
      if (type.toLowerCase() === "integer64" || type.toLowerCase() === "integer") {
        type = "integer";
      }
      if (type.toLowerCase() === "real" || type.toLowerCase() === 'number') {
        type = "double";
      }

      if (filter && filter.indexOf(type) >= 0) {
        selector.append($('<option>', {value: field}).text(field));
      }
    }
  },

  shrinkText : function(text, maxlength) {
    if (!maxlength) maxlength = 14;
    if (text.length > maxlength) {
      text = text.slice(0, maxlength -2);
      return text + "...";
    }
    return text;
  },

  guid : function() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
                 .toString(16)
                 .substring(1);
    }
    //return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    return s4() + s4() + '_' + s4();
  },

  getParameterByName : function(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results == undefined ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
  },

  getParameterByNameFromUrl: function(url,name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(url);
    return results == undefined ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
  },

  getFileName : function(url) {
    return url.substring(url.lastIndexOf('/')+1);
  },

  getSuffix : function(path) {
      return path.substring(path.lastIndexOf('.')+1);
  },

  getName : function(path) {
    return path.substring(0, path.lastIndexOf('.'));
  },

  getFileNameNoExt : function(url) {
    return getName(getFileName(url));
  },

  sortKeys :function(dict) {
    var field_names = [];
    for ( var key in fields ){
      field_names.push(key);
    }
    field_names.sort();
  },

  isValidEmailAddress : function(emailAddress) {
    var pattern = new RegExp(/^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i);
    return pattern.test(emailAddress);
  },

  exportTableToCSV : function($table, filename) {
    var $rows = $table.find('tr:has(td)'),

        // Temporary delimiter characters unlikely to be typed by keyboard
        // This is to avoid accidentally splitting the actual contents
        tmpColDelim = String.fromCharCode(11), // vertical tab character
        tmpRowDelim = String.fromCharCode(0), // null character

        // actual delimiter characters for CSV format
        colDelim = '","',
        rowDelim = '"\r\n"',

        // Grab text from table into CSV formatted string
        csv = '"' + $rows.map(function (i, row) {
            var $row = $(row),
                $cols = $row.find('td');

            return $cols.map(function (j, col) {
                var $col = $(col),
                    text = $col.text();

                return text.replace('"', '""'); // escape double quotes

            }).get().join(tmpColDelim);

        }).get().join(tmpRowDelim)
            .split(tmpRowDelim).join(rowDelim)
            .split(tmpColDelim).join(colDelim) + '"',

        // Data URI
        csvData = 'data:application/csv;charset=utf-8,' + encodeURIComponent(csv);

    $(this).attr({
      'download': filename,
      'href': csvData,
      'target': '_blank'
    });
  },

  create_legend : function(div, bins, colors, var_name) {
    var txts = [];
    div.empty();
    div.append('<table></table>');
    var table = div.children();
    for (var i=0, n = colors.length; i < n; i++) {
      var txt = "";
      var _bin = bins[i] === undefined ? bins[i-1] : bins[i];
      if (typeof _bin == 'string' || _bin instanceof String) {
        txt = _bin;
      } else {
        var lower, upper = _bin.toFixed(2);
        if (i > 0 && bins[i] !== undefined) {
          lower = bins[i-1].toFixed(2);
          txt = lower ? "(" + lower + ", " + upper + "]" : "<=" + upper;
        } else if (i==0) {
          txt = "< " + upper;
        } else if (i>0) {
          txt = "> " + upper;
        }
      }
      txts.push(txt);
      var html = '<tr><td><div style="height:15px;width:20px;border:1px solid black;background-color:' + colors[i] + '"></div></td><td align="left">&nbsp;'+ txt +'</td></tr>';
      table.append(html);
    }
    if (var_name && var_name.length > 0) {
      div.prepend("<p>"+var_name+"</p>");
    }
    div.draggable().show();

    return txts;
  },

  GetJSON : function(url, successHandler, errorHandler) {
    var xhr = new XMLHttpRequest();
    xhr.open('get', url, true);
    xhr.responseType = 'text';
    xhr.onload = function() {
      var status = xhr.status;
      if (status == 200) {
        successHandler && successHandler(JSON.parse(xhr.response));
      } else {
        errorHandler && errorHandler(status);
      }
    };
    xhr.send();
  },

  // new TabDialog for all widgets
  TabDialog : function() {
    this.tabCounter = 0;

    this.init = function(w, h) {
      var main = $('<div/>', {
        class:'popup-frame ui-popup-container',
        id: 'tabDialog',
        'data-role': "popup",
      });
      main.css('width', w);
      main.css('height', h);

      var wrapper = $('<div/>', {class: 'iframeBlocker'});
      wrapper.appendTo(main);

      var closeBtn = $('<div/>', {class:'popup-close'}).click(function(){
        $(this).parent().remove();
      });
      closeBtn.appendTo(main);

      var tabContainer = $('<div/>', {
          id: 'popTabs',
          class: 'pop-tabs'
      });
      tabContainer.appendTo(main);

      var tabBar = $('<div/>', {
        id: 'popTabBar',
        class: 'w3-bar',
      });
      tabBar.appendTo(tabContainer);

      main.draggable().resizable();
      main.resize(function() {
          $('#tool-menu-arrow, #dialog-arrow, .ui-dialog').hide();
      });
      var isDown = false;
      main.mousedown(function(){
        $('.iframeBlocker').css('display', 'block');
      });

      main.mousemove(function(){
        if (isDown) {
          //drag
        }
      });

      main.mouseup(function(){
        $('.iframeBlocker').css('display', 'none');
      });

      main.appendTo($('body'));

      var left =  50,
        top = 70;

      main.css({
        position: 'fixed',
        left: left,
        top: top,
      });
      main.show();

      if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) )
        $('div.tool-menu, .ui-dialog, #dialog-arrow').hide();
    };

    this.add = function(title, url) {
      var tab_id = "pop-tab-" + this.tabCounter;

      var btn = $('<button/>', {
        id: tab_id,
        text: title,
        href: '#',
        class: 'w3-bar-item w3-button',
        click: function (evt) {
          var _tab_id = evt.currentTarget.id,
              _tab_el = $('div#' + _tab_id);

          if (_tab_el.length > 0)  {
            $('.w3-container').css('display','none');
            _tab_el.css('display','block');
            $('.w3-bar-item').css('border-bottom','3px solid #CCC');
            $('button#'+_tab_id).css('border-bottom','3px solid red');
          }
        }
      });

      $('#popTabBar').append( btn );
      $('.w3-bar-item').css('border-bottom','3px solid #CCC');
      $('button#'+tab_id).css('border-bottom','3px solid red');

      var tabContent = $('<div/>', {
        id: tab_id,
        class: 'w3-container w3-display-container'
      });

      var frame = $('<iframe />', {
        //width: '100%',
        //height: '100%',
        src: url,
        scrolling: 'auto',
        frameborder: 0,
      });

      frame.appendTo(tabContent);
      tabContent.appendTo($('#popTabs'));

      // show it
      $('.w3-container').css('display','none');
      tabContent.css('display','block');

      this.tabCounter++;
    };

    this.close = function(){
    };

    this.popup = function() {
    };
  },

  tabD : undefined,

  popFrame : function(title, url, newWindow, w, h, pos) {
    if (this.tabD === undefined) {
      this.tabD = new this.TabDialog();
      this.tabD.init(w, h);
    }
    this.tabD.add(title, url);
  },

  popFrame1 : function(url, newWindow, size, pos) {
    if (newWindow==true) {
      window.open(
        url,
        "_blank",
        "titlebar=no,toolbar=no,location=no,width=900, height=700, scrollbars=yes"
      );
      return;
    }
    var uuid = this.guid();
    var main = $('<div/>', {
      class:'popup-frame ui-popup-container',
      id: uuid,
      'data-role': "popup",
    });

    // close button
    var header = $('<div/>', {class:'popup-close'});
    var closeBtn = $('<img/>', {
      src: "../../media/img/close_pop.png",
    }).click(function(){
      $(this).parent().parent().remove();
    });
    closeBtn.appendTo(header);
    header.appendTo(main);

    main.draggable().resizable();
    main.resize(function() {
        $('#tool-menu-arrow, #dialog-arrow, .ui-dialog').hide();
    });

    var frame = $('<iframe />', {
      //width: '100%',
      //height: '100%',
      src: url,
      scrolling: 'no',
      frameborder: 0,
    });
    frame.appendTo(main);
    main.appendTo($('body'));

    var left =  100 + Math.random() * 20,
        top = 100 + Math.random() * 20;

    if (pos)  {
      left = pos['left'];
      top = pos['top'];
    }

    main.css({
      position: 'fixed',
      left: left,
      top: top,
    });

    if (size) {
      main.css({
        width: size['width'],
        height: size['height']
      });
    }
    main.show();

    if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) )
      $('div.tool-menu, .ui-dialog, #dialog-arrow').hide();

    return uuid;
  },

  popWindow : function(size, pos) {
    var uuid = this.guid();
    var main = $('<div/>', {
      class:'popup-frame ui-popup-container',
      id: uuid,
      'data-role': "popup",
    });

    main.resize(function() {
        $('#tool-menu-arrow, #dialog-arrow, .ui-dialog').hide();
    });

    // close button
    var header = $('<div/>', {class:'popup-close'});
    var closeBtn = $('<img/>', {
      src: "../../media/img/close_pop.png",
    }).click(function(){
      $(this).parent().parent().remove();
    });
    closeBtn.appendTo(header);
    header.appendTo(main);

    // add content
    $('<div/>', {
      class : 'pop-container'
    }).appendTo(main);
    main.appendTo($('body'));

    var left =  100 + Math.random() * 20,
        top = 100 + Math.random() * 20;

    if (pos)  {
      left = pos['left'];
      top = pos['top'];
    }

    main.resizable();
    main.draggable({handle: ".popup-close"});
    main.css({
      position: 'fixed',
      left: left,
      top: top,
    });

    if (size) {
      main.css({
        width: size['width'],
        height: size['height']
      });
    }
    main.show();

    if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) )
      $('div.tool-menu, .ui-dialog, #dialog-arrow').hide();

    return uuid;
  },

  map2vizJson : function() {
  },

  ShowYesNoDlg : function(msg, onYes, onNo) {
    $('<div></div>').appendTo('body')
    .html('<br/><div>'+msg+'</div>')
    .dialog({
      modal: true,
      title: "Confirmation required",
      buttons: {
        Yes: function() {
          if (onYes) onYes();
          $(this).dialog("close");
        },
        No: function() {
          if (onNo) onNo();
          $(this).dialog("close");
        }
      },
      close: function( evt, ui) { $(this).remove(); }
    });
  },

  ShowMsgBox: function(title, msg) {
    $('<div id="msgdlg"></div>').appendTo('body')
    .html('<br/><div>'+msg+'</div>')
    .dialog({
      modal: true,
      title: title,
      buttons: {
        Close: function() {
          $(this).dialog("close");
        }

      },
      close: function( evt, ui) { $(this).remove(); }
    });
  },
};

});
