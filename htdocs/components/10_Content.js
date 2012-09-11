// $Revision$

Ensembl.Panel.Content = Ensembl.Panel.extend({
  init: function () {
    this.base();
    
    this.xhr = false;
    
    var fnEls = {
      ajaxLoad:  $('.ajax', this.el),
      hideHints: $('.hint', this.el),
      glossary:  $('.glossary_mouseover', this.el),
      dataTable: $('table.data_table', this.el),
      helpTips:  $('._ht', this.el)
    };
    
    if (this.el.hasClass('ajax')) {
      $.extend(fnEls.ajaxLoad, this.el);
    }
    
    $.extend(this.elLk, fnEls);
    
    for (var fn in fnEls) {
      if (fnEls[fn].length) {
        this[fn]();
      }
    }
    
    Ensembl.EventManager.register('updatePanel', this, this.getContent);
    
    if (this.el.parent('.initial_panel')[0] === Ensembl.initialPanels.get(-1)) {
      Ensembl.EventManager.register('hashChange', this, this.hashChange);
    }
    
    Ensembl.EventManager.trigger('validateForms', this.el);
    Ensembl.EventManager.trigger('relocateTools', $('.other_tool', this.el));
    
    // Links in a popup (help) window should make a new window in the main browser
    if (window.name.match(/^popup_/)) {
      $('a:not(.cp-internal, .popup)', this.el).on('click', function () {
        window.open(this.href, window.name.replace(/^popup_/, '') + '_1');
        return false;
      });
    }
    
    this.toggleable();
  },
  
  ajaxLoad: function () {
    var panel = this;
    
    $('.navbar', this.el).width(Ensembl.width);
    
    this.elLk.ajaxLoad.each(function () {
      var url = $('input.ajax_load', this).val();
      
      if (!url) {
        return;
      }
      
      if (url.match(/\?/)) {
        url = Ensembl.replaceTimestamp(url);
      } else {
        url += '?';
      }
      
      panel.getContent(url, $(this), { updateURL: url + ';update_panel=1' });
    });
  },
  
  getContent: function (url, el, params, newContent) {
    var node;
    
    params = params || this.params;
    url    = url    || Ensembl.replaceTimestamp(params.updateURL);
    el     = el     || this.el.empty();
    
    switch (el[0].nodeName) {
      case 'DL': node = 'dt'; break;
      case 'UL': 
      case 'OL': node = 'li'; break;
      default  : node = 'p';  break;
    }
    
    el.append('<' + node + ' class="spinner">Loading component</' + node + '>');
    
    Ensembl.EventManager.trigger('hideZMenu', this.id); // Hide ZMenus based on this panel
    
    if (newContent) {
      window.location.hash = el[0].id; // Jump to the newly added div
    }
    
    this.xhr = $.ajax({
      url: url,
      dataType: 'html',
      context: this,
      success: function (html) {
        if (html) {
          Ensembl.EventManager.trigger('addPanel', undefined, $((html.match(/<input[^<]*class="[^<]*panel_type[^<]*"[^<]*>/) || [])[0]).val() || 'Content', html, el, params);
          Ensembl.EventManager.trigger('ajaxLoaded');
          
          if (newContent) {
            // Jump to the newly added content. Set the hash to a dummy value first so the browser is forced to jump again
            window.location.hash = '_';
            window.location.hash = el[0].id;
          }
        } else {
          el.html('');
        }
      },
      error: function (e) {
        if (e.status !== 0) { // e.status === 0 when navigating to a new page while request is still loading
          el.html('<p class="ajax_error">Sorry, the page request "' + url + '" failed to load.</p>');
        }
      },
      complete: function () {
        el = null;
        this.xhr = false;
      }
    });
  },
  
  addContent: function (url, rel) {
    var newContent = $('<div class="js_panel">').appendTo(this.el);
    var i          = 1;
    
    if (rel) {
      newContent.addClass(rel);
    } else {
      rel = 'anchor';
    }
    
    // Ensure unique id
    while (document.getElementById(rel)) {
      rel += i++;
    }
    
    newContent.attr('id', rel + 'Panel');
    
    this.getContent(url, newContent, this.params, true);
    
    return newContent;
  },
  
  toggleable: function () {
    var panel     = this;
    var toTrigger = {};
    
    $('a.toggle, .ajax_add', this.el).on('click', function () {
      Ensembl.EventManager.trigger('toggleContent', this.rel);
      
      if ($(this).hasClass('ajax_add')) {
        var url = $('input.url', this).val();
        
        if (url) {
          if (panel.elLk[this.rel]) {
            panel.toggleContent($(this));
            window.location.hash = panel.elLk[this.rel][0].id;
          } else {
            panel.elLk[this.rel] = panel.addContent(url, this.rel);
          }
        }
      } else {
        panel.toggleContent($(this));
      }
      
      return false;
    }).filter('[rel]').each(function () {
      var cookie = Ensembl.cookie.get('toggle_' + this.rel);
      
      if ($(this).hasClass('closed')) {
        var regex = '[#?;&]' + this.rel + '(Panel)?[&;]*'
        
        if (cookie === 'open' || Ensembl.hash.match(new RegExp(regex))) {
          toTrigger[this.rel] = this; 
        }
      } else if ($(this).hasClass('open') && cookie === 'closed') {
        toTrigger[this.rel] = this;
      }
    });
    
    // Ensures that only one matching link with same rel is triggered (two triggers would revert to closed state)
    $.each(toTrigger, function () { $(this).trigger('click'); });
  },
  
  toggleContent: function (el) {
    var rel = el.attr('rel');
    
    if (!rel) {
      el.toggleClass('open closed').siblings('.toggleable').toggle();
    } else {
      if (this.id === rel + 'Panel') {
        $('.toggleable', this.el).toggle();
      } else {
        if (!this.elLk[rel]) {
          this.elLk[rel] = $('.' + rel, this.el);
        }
        
        if (!$('.toggleable', this.elLk[rel]).toggle().length) {
          el.siblings('.toggleable').toggle();
        }
      }
      
      if (el.hasClass('set_cookie')) {
        Ensembl.cookie.set('toggle_' + rel, el.hasClass('open') ? 'open' : 'closed');
      }
    }
    
    el = null;
  },
  
  hashChange: function () {
    this.params.updateURL = Ensembl.urlFromHash(this.params.updateURL);
    
    if (this.xhr) {
      this.xhr.abort();
      this.xhr = false;
    }
    
    this.getContent(Ensembl.replaceTimestamp(this.params.updateURL + ';hash_change=' + Ensembl.lastR));
  },
  
  hideHints: function () {
    this.elLk.hideHints.each(function () {
      var div = $(this);
      
      $('<img src="/i/close.png" alt="Hide" />').on('click', function () {
        var tmp = [];
        
        div.hide();
        
        Ensembl.hideHints[div[0].id] = 1;
        
        for (var i in Ensembl.hideHints) {
          tmp.push(i);
        }
        
        Ensembl.cookie.set('ENSEMBL_HINTS', tmp.join(':'));
      }).prependTo(this.firstChild).helptip('Hide this panel');
    });
  },
  
  glossary: function () {
    this.elLk.glossary.on({
      mouseover: function () {
        var el         = $(this);
        var popup      = el.children('.floating_popup');
        var position   = el.position();
        position.top  -= popup.height() - (0.25 * el.height());
        position.left += 0.75 * el.width();
        
        popup.show().css(position);
        
        popup = el = null;
      },
      mouseout: function () {
        $(this).children('.floating_popup').hide();
      }
    });
  },
  
  dataTable: function () {
    $.extend(this, Ensembl.DataTable);
    this.dataTableInit();
  },

  helpTips: function () {

    this.elLk.helpTips.each(function() {
      $(this).helptip(this.title).removeAttr('title');
    });
  }
});
