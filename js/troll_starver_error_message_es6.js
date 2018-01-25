// 3rd party(youtube) selectors
const YOUTUBE_SELECTORS = {
  LIVE_CHAT_IFRAME_WRAPPER: '#chat' // append message to if can't append to YOUTUBE_SELECTORS.APPEND_EXTENTION_TO
}

// iframe warning html

document.querySelector('#chat').insertAdjacentHTML('beforeend', `
  <div id='troll-extension-wrapper' data-id='troll-extension-wrapper'>
    <div id='iframe-loads-chatroom-warning' data-id='iframe-loads-chatroom-warning'>
      <p class='warning-header'>TROLL BLOCKER</p>
      <p class='warning-orange'>Warning : The chatroom above is loaded through an iframe.</p>
      <p>Solutions: Either A) Click "Pop Out Checkbox" in chatbox settings or B) Enter "Youtube Gaming Mode" in order to use this extension.</p>
    </div>
  </div>
`);
