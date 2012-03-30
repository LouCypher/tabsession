var TabSession = {
  CONTEXT_ID: [
    "context-tabSession-separator-1",
    "context-tabSession-history",
    "context-tabSession-last",
    "context-tabSession-start",
    "context-tabSession-forward",
    "context-tabSession-back",
    "context-tabSession-separator-0"
  ],

  MENU: ["History", "Last", "Start", "Forward", "Back"],

  get prefs() {
    return Components.classes["@mozilla.org/preferences-service;1"]
                     .getService(Components.interfaces.nsIPrefBranch)
                     .getBranch("extensions.Tab_Session_History.");
  },

  menuShown: function tabSession_getMenuPrefs(aMenu) {
    return this.prefs.getBoolPref("showMenu." + aMenu);
  },

  setStatusMessage: function tabSession_setStatusMessage(aNode) {
    document.getElementById("statusbar-display").label = aNode.statusText;
  },

  clearStatusMessage: function tabSession_clearStatusMessage() {
    document.getElementById("statusbar-display").label = "";
  },

  getBrowser: function tabSession_getTabBrowser() {
    return getBrowser().mContextTab
           ? getBrowser().mContextTab.localName == "tabs"
             ? getBrowser().mCurrentTab.linkedBrowser
             : getBrowser().mContextTab.linkedBrowser
           : getBrowser();
  },

  getHistory: function tabSession_getSessionHistory() {
    return this.getBrowser().webNavigation.sessionHistory;
  },

  get history() {
    return this.getBrowser().webNavigation.sessionHistory;
  },

  getEntry: function tabSession_getHistoryEntry(aIndex) {
    return this.history.getEntryAtIndex(aIndex, false);
  },

  gotoIndex: function tabSession_gotoIndex(aEvent) {
    var index = aEvent.target.value;
    if (!index) return;
    var where = whereToOpenLink(aEvent);
    if (where == "current") {
      return this.getBrowser().webNavigation.gotoIndex(index);
    } else {
      var url = this.getEntry(index).URI.spec;
      openUILinkIn(url, where, false);
    }
  },

  tabBack: function tabSession_BrowserBack(aEvent, aIgnoreAlt) {
    var where = whereToOpenLink(aEvent, false, aIgnoreAlt);
    if (where == "current") {
      try {
        this.getBrowser().goBack();
      } catch (ex) {
      }
    } else {
      var url = this.getEntry(this.history.index - 1).URI.spec;
      openUILinkIn(url, where);
    }
  },

  tabForward: function tabSession_BrowserBack(aEvent, aIgnoreAlt) {
    var where = whereToOpenLink(aEvent, false, aIgnoreAlt);
    if (where == "current") {
      try {
        this.getBrowser().goForward();
      } catch (ex) {
      }
    } else {
      var url = this.getEntry(this.history.index + 1).URI.spec;
      openUILinkIn(url, where);
    }
  },

  populateHistoryMenu: function tabSession_populateHistoryMenu(aNode) {
    while (aNode.lastChild) {
      aNode.removeChild(aNode.lastChild);
    }
    var count = this.history.count;
    var hist = [];
    for (var i = count - 1; i >= 0; i--) {
      hist[i] = {
        title: this.getEntry(i).title,
        url:   this.getEntry(i).URI.spec
      }
    }
    for (var j = hist.length - 1; j >= 0; j--) {
      var mi = aNode.appendChild(document.createElement("menuitem"));
      mi.setAttribute("value", j);
      mi.setAttribute("label", hist[j].title);
      mi.statusText = hist[j].url;
      if (j == this.history.index) {
        mi.setAttribute("type", "checkbox");
        mi.setAttribute("checked", true);
      } else {
        try {
          var iconURL = Components.classes['@mozilla.org/browser/favicon-service;1']
                                  .getService(Components.interfaces.nsIFaviconService)
                                  .getFaviconForPage(this.getEntry(j).URI).spec;
          mi.style.listStyleImage = "url(" + iconURL + ")";
        } catch (ex) {
          mi.style.listStyleImage = "url(chrome://global/skin/icons/folder-item.png)";
          mi.style.MozImageRegion = "rect(0px, 16px, 16px, 0px)";
        }
        mi.className = "menuitem-iconic";
      }
    }
  },

  createTooltip: function tabSession_fixTabTooltip(aEvent) {
    aEvent.stopPropagation();
    var tn = document.tooltipNode;
    if (tn.localName != "tab") {
      return false;
    }
    if (tn.hasAttribute("label")) {
      aEvent.target.setAttribute("label", tn.getAttribute("label"));
      return true;
    }
    return false;
  },

  setItemAttributes: function tabSession_setItemAttr(aNode, aMenu, aCondition, aIndex) {
    if (aCondition) {
      aNode.removeAttribute("tooltiptext");
    } else {
      aNode.tooltipText = this.getEntry(aIndex).title;
    }
    aNode.statusText = aCondition ? "" : this.getEntry(aIndex).URI.spec;
    if (((aNode.id == "context-back") || (aNode.id == "context-forward")) &&
        !this.prefs.getBoolPref("allowHidingContentBackForward")) return;
    //aNode.setAttribute("disabled", aCondition);
    aNode.setAttribute("collapsed", aCondition);
    if (gContextMenu) {
      aNode.hidden = !this.menuShown("content" + this.MENU[aMenu]) ||
                     (this.menuShown("contentHiddenTabBarOnly") &&
                      !getBrowser().mStrip.collapsed) ||
                     (gContextMenu.isContentSelected ||
                       gContextMenu.onLink ||
                       gContextMenu.onImage ||
                       gContextMenu.onTextInput);
    } else if (getBrowser().mContextTab) {
      aNode.hidden = !this.menuShown("tab" + this.MENU[aMenu]);
    }
  },

  initContext: function tabSession_initContext(aEvent) {
    if (gContextMenu) {
      getBrowser().mContextTab = null;
    }
    var browser = this.getBrowser();
    var canGoBack = browser.webNavigation.canGoBack;
    var canGoForward = browser.webNavigation.canGoForward;
    var index = this.history.index;
    var count = this.history.count;
    var mBack, mForward, mStart, mLast, mHist;

    if (gContextMenu) {
      mBack = document.getElementById("context-back");
      mForward = document.getElementById("context-forward");
      mStart = document.getElementById(this.CONTEXT_ID[3]);
      mLast = document.getElementById(this.CONTEXT_ID[2]);
      mHist = document.getElementById(this.CONTEXT_ID[1]);
      mHist.hidden = !this.menuShown("content" + this.MENU[0]) ||
                     (this.menuShown("contentHiddenTabBarOnly") &&
                      !getBrowser().mStrip.collapsed) ||
                     (gContextMenu.isContentSelected ||
                      gContextMenu.onLink || gContextMenu.onImage ||
                      gContextMenu.onTextInput);

    } else if (getBrowser().mContextTab) {
      mBack = document.getElementById("tab" + this.CONTEXT_ID[5]);
      mForward = document.getElementById("tab" + this.CONTEXT_ID[4]);
      mStart = document.getElementById("tab" + this.CONTEXT_ID[3]);
      mLast = document.getElementById("tab" + this.CONTEXT_ID[2]);
      mHist = document.getElementById("tab" + this.CONTEXT_ID[1]);
      mHist.hidden = !this.menuShown("tab" + this.MENU[0]);

    }
    //mHist.setAttribute("disabled", count <= 1);
    mHist.setAttribute("collapsed", count <= 1);
    this.setItemAttributes(mBack, 4, !canGoBack, index - 1);
    this.setItemAttributes(mForward, 3, !canGoForward, index + 1);
    this.setItemAttributes(mStart, 2, !canGoBack, 0);
    this.setItemAttributes(mLast, 1, !canGoForward, count - 1);
    mLast.value = count - 1;
  },

  init: function tabSession_init(aEvent) {
    var context = document.getElementById("contentAreaContextMenu");
    var tabContext = document.getAnonymousElementByAttribute(
                      gBrowser, "anonid", "tabContextMenu");
    var sep = tabContext.getElementsByTagName("xul:menuseparator")[0] ||
              tabContext.getElementsByTagName("menuseparator")[0];
    var mID = this.CONTEXT_ID;
    for (var i in mID) {
      var mi = document.getElementById("tab" + mID[i]);
      tabContext.insertBefore(mi, sep.nextSibling);
    }

    context.addEventListener("popupshowing", function(e) {
      TabSession.initContext(e);
    }, false);

    tabContext.addEventListener("popupshowing", function(e) {
      TabSession.initContext(e);
    }, false);

    // fix tab tooltips bug
    if (typeof gBrowser.createTooltip != "function") {
      var tabTooltip = tabContext.parentNode.firstChild;
      tabTooltip.setAttribute("onpopupshowing",
                              "return TabSession.createTooltip(event);");
    }
  }
}

window.addEventListener("load", function(e) {
  TabSession.init(e);
}, false);
