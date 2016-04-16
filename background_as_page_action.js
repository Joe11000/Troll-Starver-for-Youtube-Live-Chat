// when the extension is first installed
// chrome.runtime.onInstalled.addListener(function(details) {
//     chrome.storage.sync.set({clean_news_feed: true});
// });

// // listen for any changes to the URL of any tab.
// chrome.tabs.onUpdated.addListener(function(id, info, tab){
//     if (tab.url.toLowerCase().indexOf("facebook.com") > -1){
//         chrome.pageAction.show(tab.id);
//     }
// });


// chrome.tabs.onUpdated.addListener(function(id, info, tab){
//     chrome.pageAction.show(tab.id);
//     chrome.tabs.executeScript(null, {"file": "js/troll_starver.js"});
// });

chrome.pageAction.onClicked.addListener(function (tab) { //Fired when User Clicks ICON
  chrome.tabs.executeScript(tab.id, {
      "file": "js/troll_starver.js"
  }, function () { // Execute your code
      console.log("Script Executed .. "); // Notification on Completion
      console.warn("Script Executed .. "); // Notification on Completion
      console.error("Script Executed .. "); // Notification on Completion
  });

  chrome.tabs.insertCss(tab.id, {
      "file": "js/troll_starver.css"
  }, function () { // Execute your code
      console.log("CSS Executed .. "); // Notification on Completion
      console.warn("CSS Executed .. "); // Notification on Completion
      console.error("CSS Executed .. "); // Notification on Completion
  });
});


// chrome.pageAction.onClicked.addListener(function(tab)
// {chrome.tabs.create({url: 'options.html'})});


// update the icon when the user's settings change
// chrome.storage.onChanged.addListener(function(changes, areaName){
//     alert("changed settings");
//     console.log("changed settings");
//     if (localStorage["clean_news_feed"] == "true"){
//         path = "active-icon.jpeg";
//     } else {
//         path = "inactive-icon.jpeg";
//     }
//     chrome.tabs.getCurrent( function(tab){
//         chrome.pageAction.setIcon({
//             "tabId": tab.id,
//             "path": path
//         });
//     });
// });
