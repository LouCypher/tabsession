/*
  Version: MPL 1.1/GPL 2.0/LGPL 2.1

  The contents of this file are subject to the Mozilla Public License
  Version 1.1 (the "License"); you may not use this file except in
  compliance with the License. You may obtain a copy of the License at
  http://www.mozilla.org/MPL/1.1/

  Software distributed under the License is distributed on an "AS IS" basis,
  WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
  for the specific language governing rights and limitations under the
  License.

  The Original Code is Tab Session History or Context History extension.

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

Components.utils.import("resource://gre/modules/AddonManager.jsm");
Components.utils.import("resource://gre/modules/Services.jsm");

function $(aId) {
  return document.getElementById(aId);
}

var prefs = Services.prefs.getBranch("extensions.Context_History.");
var tabbox = document.getElementsByTagName("tabbox")[0];

function disableBaFo(aBoolean) {
  var id = ["extensions.Context_History.showMenu.contentBack-check",
            "extensions.Context_History.showMenu.contentForward-check"];
  for (var i in id) {
    $(id[i]).disabled = aBoolean;
  }
}

function setLastTab() {
  prefs.setIntPref("options.lastTab", tabbox._tabs.selectedIndex);
}

function getLastTab() {
  try {
    return prefs.getIntPref("options.lastTab");
  } catch(ex) {
    return 0;
  }
}

function checkTMP(aCallback) {
  AddonManager.getAddonByID("{dc572301-7619-498c-a57d-39143191b318}",
    function(aObject) {
      try {
        aCallback(aObject.isActive);
      } catch(ex) {
        aCallback(false);
      }
    }
  )
}

function toggleHide(aTMPstatus) {
  $("browser.tabs.autoHide-check").hidden = aTMPstatus;
  $("tabmixplus").hidden = !aTMPstatus;
}

function onLoad() {
  var allowHidingContent = prefs.getBoolPref("allowHidingContentBackForward");
  disableBaFo(!allowHidingContent);
  tabbox._tabs.selectedIndex = getLastTab();
  checkTMP(toggleHide);
}

window.addEventListener("unload", setLastTab, false);
window.addEventListener("load", onLoad, false);
window.removeEventListener("unload", onLoad, false);
