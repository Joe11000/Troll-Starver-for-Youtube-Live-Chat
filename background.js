var targetWindow = null;
var tabCount = 0;

var getAllWindows = function() {
  return new Promise((res, rej)=>{
    try {
      // debugger
      chrome.windows.getAll( {populate: true}, (windows)=>{ res(windows) });
    }
    catch(e) {
      rej(e)
    }
  })
}

// if currently on youtube video, then look for popped out chat and put extension on that if it exists.
// else load code on current page
var findTabContainingChatRoom = function(windows, tab_opened_extension_from) {
      // debugger
  
  var  url_of_tab_opened_extension_from = tab_opened_extension_from.url;


  // var chatroom_id = url_of_tab_opened_extension_from.match(/youtube.com.*?v=(.*)/)[1];
  // var chatroom_url = 'youtube.com.*?.*v=([^&]*)is_popout=1'
  // 'https://www.youtube.com/live_chat?v=fDNAHZo_pAU&is_popout=1'
  // 'https://www.youtube.com/watch?v=fDNAHZo_pAU'

  var numWindows = windows.length;
  var tabPosition = tabCount;
  var targetTab = tab_opened_extension_from;
  var target_chatroom_id = tab_opened_extension_from.url.match(/youtube.com\/watch\?v=(.*)/)[1]

  for (var i = 0; i < numWindows; i++) {
    var win = windows[i];
    var numTabs = win.tabs.length;
    for (var j = 0; j < numTabs; j++) {
      var tab = win.tabs[j];
        // debugger

      // if there is an popout version of the target chatbox
      if(
          tab.url.match(/youtube.com\/live_chat\?v=(.*)(?:&)/) && 
          tab.url.match(/youtube.com\/live_chat\?v=(.*)(?:&)/)[1] == target_chatroom_id 
        ) {
        // debugger
        return targetTab
      }
    }
  }
  // debugger
  return targetTab;
}


function start(tab_opened_extension_from) {

  if ( !tab_opened_extension_from.url.match(/youtube.com\//) ) { 
    // debugger;
    return;
  }

  getAllWindows().then((windows)=>{
    var tab_containing_chatroom = findTabContainingChatRoom(windows, tab_opened_extension_from);

    chrome.tabs.insertCSS(tab_containing_chatroom.id, { "file": "css/troll_starver.css" });
    chrome.tabs.executeScript(tab_containing_chatroom.id, { "file": "js/troll_starver.js" });
  });

  // chrome.windows.getCurrent(getWindows);
}
// Set up a click handler so that we can merge all the windows.
chrome.browserAction.onClicked.addListener(start);
