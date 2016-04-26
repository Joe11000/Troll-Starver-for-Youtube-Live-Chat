chrome.browserAction.onClicked.addListener(function (tab) { //Fired when User Clicks ICON
  chrome.tabs.insertCSS(tab.id, { "file": "css/troll_starver.css" });

  chrome.tabs.executeScript(tab.id, { "file": "js/troll_starver.js" });
});
