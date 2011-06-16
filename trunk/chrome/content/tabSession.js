/*
  Version: MPL 1.1/GPL 2.0/LGPL 2.1

  The contents of this file are subject to the Mozilla Public License
  Version 1.1 (the "License"); you may not use this file except in
  compliance with the License. You may obtain a copy of the License at
  http://www.mozilla.org/MPL/

  Software distributed under the License is distributed on an "AS IS" basis,
  WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
  for the specific language governing rights and limitations under the
  License.

  The Original Code is Tab Session History extension.

  The Initial Developer of the Original Code is LouCypher.
  Portions created by the Initial Developer are Copyright (C) 2007
  the Initial Developer. All Rights Reserved.

  Contributor(s) (alphabetical order):
  - LouCypher <loucypher@mozillaca.com>

  Alternatively, the contents of this file may be used under the terms of
  either the GNU General Public License Version 2 or later (the "GPL"), or
  the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
  in which case the provisions of the GPL or the LGPL are applicable instead
  of those above. If you wish to allow use of your version of this file only
  under the terms of either the GPL or the LGPL, and not to allow others to
  use your version of this file under the terms of the MPL, indicate your
  decision by deleting the provisions above and replace them with the notice
  and other provisions required by the GPL or the LGPL. If you do not delete
  the provisions above, a recipient may use your version of this file under
  the terms of any one of the MPL, the GPL or the LGPL.
*/

var TabSession = {
  CONTEXT_ID: [
    "context-tabSession-separator-1",
    "context-tabSession-history",
    "context-tabSession-last",
    "context-tabSession-start",
    "context-tabSession-forward",
    "context-tabSession-back"
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

  get statusbar() {
    return document.getElementById("status-bar");
  },

  setStatusMessage: function tabSession_setStatusMessage(aString) {
    document.getElementById("statusbar-display").label = aString;
  },

  getBrowser: function tabSession_getTabBrowser() {
    return getBrowser().mContextTab
           ? (getBrowser().mContextTab.localName == "tabs")
             ? getBrowser().mCurrentTab.linkedBrowser
             : getBrowser().mContextTab.linkedBrowser
           : (typeof SplitBrowser == "object")
             ? SplitBrowser._mFocusedSubBrowser.browser
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

  openPrefs: function tabSession_openPrefs() {
    openDialog("chrome://contexthistory/content/options.xul",
               "tabsession-config",
               "chrome, dialog, close, centerscreen");
  },

  browserBack: function tabSession_browserBack(aEvent, aIgnoreAlt) {
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

  browserForward: function tabSession_browserForward(aEvent, aIgnoreAlt) {
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
      mi.setAttribute("statustext", hist[j].url);
      if (j == this.history.index) {
        mi.setAttribute("type", "radio");
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
        mi.className = "menuitem-iconic unified-nav-";
        mi.className += (j < this.history.index) ? "back" : "forward";
      }
    }
  },

  setItemAttributes: function tabSession_setItemAttr(aNode, aMenu, aCondition, aIndex) {
    if (aCondition) {
      aNode.removeAttribute("tooltiptext");
    } else {
      aNode.tooltipText = this.getEntry(aIndex).title;
    }
    aNode.statusText = aCondition ? "" : this.getEntry(aIndex).URI.spec;
    if (((aNode.id == "context-back") || (aNode.id == "context-forward")) &&
        !this.prefs.getBoolPref("allowHidingContentBackForward")) {
      return;
    }
    //aNode.setAttribute("disabled", aCondition);
    aNode.setAttribute("collapsed", aCondition);
    if ((typeof gContextMenu == "object") && (gContextMenu != null)) {
      aNode.hidden = !this.menuShown("content" + this.MENU[aMenu]) ||
                     (this.menuShown("contentHiddenTabBarOnly") &&
                      !getBrowser().mStrip.collapsed) ||
                     (gContextMenu.isContentSelected ||
                       gContextMenu.onLink ||
                       gContextMenu.onImage ||
                       gContextMenu.onTextInput);
    } else if (getBrowser().mContextTab) {
      aNode.hidden = !this.menuShown("tab" + this.MENU[aMenu]);
    } else {
      return;
    }
  },

  initContext: function tabSession_initContext(aEvent) {
    if ((typeof gContextMenu == "object") && (gContextMenu != null)) {
      getBrowser().mContextTab = null;
    }

    var browser = this.getBrowser();
    var canGoBack = browser.webNavigation.canGoBack;
    var canGoForward = browser.webNavigation.canGoForward;
    var index = this.history.index;
    var count = this.history.count;
    var mBack, mForward, mStart, mLast, mHist;

    if ((typeof gContextMenu == "object") && (gContextMenu != null)) {
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
    } else {
      return;
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
    context.addEventListener("popupshowing", initMainContext = function(e) {
      TabSession.initContext(e);
    }, false);
    context.removeEventListener("popuphiding", initMainContext, false);

    var tabContext = document.getElementById("tabContextMenu");
    tabContext.addEventListener("popupshowing", initTabContext = function(e) {
      TabSession.initContext(e);
    }, false);
    tabContext.removeEventListener("popuphiding", initTabContext, false);
  }
}

window.addEventListener("load", initContextHistory = function(e) {
  TabSession.init(e);
}, false);

window.removeEventListener("unload", initContextHistory, false);

