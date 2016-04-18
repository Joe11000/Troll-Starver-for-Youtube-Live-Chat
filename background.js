chrome.browserAction.onClicked.addListener(function (tab) { //Fired when User Clicks ICON

  chrome.tabs.insertCSS(tab.id, {
      "file": "css/troll_starver.css"
  }, function () { // Execute your code
  });

  chrome.tabs.executeScript(tab.id, {
      "file": "js/troll_starver.js"
  }, function () { // Execute your code
  });

});
