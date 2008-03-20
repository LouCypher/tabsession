var TabSession_Config = {

  get appInfo() {
    return Components.classes["@mozilla.org/xre/app-info;1"]
                     .getService(Components.interfaces.nsIXULAppInfo);
  },

  get isSongbird() {
    return this.appInfo.ID == "songbird@songbirdnest.com";
  },

  get prefService() {
    return Components.classes["@mozilla.org/preferences-service;1"]
                     .getService(Components.interfaces.nsIPrefService);
  },

  get prefs() {
    return this.prefService.getBranch("extensions.Tab_Session_History.");
  },

  get tabbox() {
    return document.getElementsByTagName("tabbox")[0];
  },

  disableBaFo: function(aBoolean) {
    var id = ["extensions.Tab_Session_History.showMenu.contentBack-check",
              "extensions.Tab_Session_History.showMenu.contentForward-check"];
    var checkbox;
    for (var i in id) {
      checkbox = document.getElementById(id[i]);
      checkbox.disabled = aBoolean;
    }
  },

  setLastTab: function() {
    this.prefs.setIntPref("options.lastTab", this.tabbox._tabs.selectedIndex);
  },

  getLastTab: function() {
    try {
      return this.prefs.getIntPref("options.lastTab");
    } catch(ex) {
      return 0;
    }
  },

  init: function() {
    var allowHidingContent = this.prefs.getBoolPref("allowHidingContentBackForward");
    this.disableBaFo(!allowHidingContent);
    if (this.isSongbird) {
      document.getElementById("tab-mainContext").parentNode.collapsed = true;
      return;
    }
    this.tabbox._tabs.selectedIndex = this.getLastTab();
  }

}

window.addEventListener("load", function(e) {
  TabSession_Config.init();
}, false);

window.addEventListener("unload", function(e) {
  TabSession_Config.setLastTab();
}, false);

