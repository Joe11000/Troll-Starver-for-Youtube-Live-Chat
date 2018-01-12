// var targetWindow = null;
var CONSTANTS = {
  TROLL_STARVER_CSS: "css/troll_starver.css",
  TROLL_STARVER_JS: "js/troll_starver.js",
  REGEX_FOR_YOUTUBE_VIDEO_W_LIVE_CHAT: /youtube.com\/watch\?.*v=([a-zA-Z0-9]*)/, // ie 'https://www.youtube.com/watch?v=fDNAHZo_pAU'

  REGEX_FOR_YOUTUBE_NO_VIDEO_JUST_LIVE_CHAT: /youtube.com\/live_chat\?.*v=([a-zA-Z0-9]*)/ // ie 'https://www.youtube.com/live_chat?v=fDNAHZo_pAU&is_popout=1'
}

var getAllWindows = function() {
  return new Promise((res, rej)=>{
    try {
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

  var  url_of_tab_opened_extension_from = tab_opened_extension_from.url;
  var numWindows = windows.length;
  var targetTab = tab_opened_extension_from;
  var current_tab_chatroom_id = tab_opened_extension_from.url.match(CONSTANTS.REGEX_FOR_YOUTUBE_VIDEO_W_LIVE_CHAT)[1];

  // look through each tab in each window and see if there is a popout that takes presidence over the current the current page's chatroom. Done this way because currently the default chatroom by youtube is displayed through a iframe, so popped out tabs are prefereble.
  for (var i = 0; i < numWindows; i++) {
    var win = windows[i];
    var numTabs = win.tabs.length;
    for (var j = 0; j < numTabs; j++) {
      var tab = win.tabs[j];

      if(
          tab.url.match(CONSTANTS.REGEX_FOR_YOUTUBE_NO_VIDEO_JUST_LIVE_CHAT) &&
          tab.url.match(CONSTANTS.REGEX_FOR_YOUTUBE_NO_VIDEO_JUST_LIVE_CHAT)[1] == current_tab_chatroom_id
        ) {
        return tab
      }
    }
  }
  return targetTab;
}

function start(tab_opened_extension_from) {

  if ( !tab_opened_extension_from.url.match(/youtube.com\//) ) {
    return;
  }

  getAllWindows().then((windows)=>{
    var tab_containing_chatroom = findTabContainingChatRoom(windows, tab_opened_extension_from);

    chrome.tabs.insertCSS(tab_containing_chatroom.id, { "file": CONSTANTS.TROLL_STARVER_CSS });
    chrome.tabs.executeScript(tab_containing_chatroom.id, { "file": CONSTANTS.TROLL_STARVER_JS });
  });
}


chrome.browserAction.onClicked.addListener(start);
