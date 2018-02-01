// 3rd party(youtube) selectors
const YOUTUBE_SELECTORS = {
  LIVE_CHAT_IFRAME_WRAPPER: '#chat' // append message to if can't append to YOUTUBE_SELECTORS.APPEND_EXTENTION_TO
}

// iframe warning html
document.querySelector('#chat').insertAdjacentHTML('beforeend', `
  <div id='troll-extension-wrapper' data-id='troll-extension-wrapper'>
    <div id='iframe-loads-chatroom-warning' data-id='iframe-loads-chatroom-warning'>
      <div id='exit-warning' data-id='exit-warning'>X</div>
      <p class='warning-header'>TROLL BLOCKER</p>
      <p class='warning-orange'>Hey There! This version of the chatroom can't be altered by Troll Blocker.</p>

      <div id='warning-solutions-wrapper'>
        <div>(Solution 1)</div>
        <p>Click "Popout chat" in the chatbox settings. Click the extension icon again on this page.</p>
        <div>(Solution 2)</div>
        <p>Enter "Youtube Gaming Mode". Click the extension icon on that page.</p>
        <div>(Unsure?)</div>
        <p>2 minute <a href='https://chrome.google.com/webstore/detail/youtube-live-chat-troll-s/bcikajlocgcppeihfloalfdnpgfibdpk'>Video Tutorial</a></p>
      </div>
    </div>
  </div>
`);
