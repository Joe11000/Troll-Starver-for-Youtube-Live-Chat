// 3rd party(youtube) selectors
const YOUTUBE_SELECTORS = {
  APPEND_EXTENTION_TO: 'yt-live-chat-message-input-renderer',
  COMMENT_HEIGHT_TRACKER: '#item-offset.yt-live-chat-item-list-renderer',
  COMMENTS_WRAPPER: '#items.style-scope.yt-live-chat-item-list-renderer', // inside this.COMMENT_HEIGHT_TRACKER
  COMMENT: 'yt-live-chat-text-message-renderer', // inside this.COMMENTS_WRAPPER
  PAID_COMMENT: 'yt-live-chat-paid-message-renderer', // inside this.COMMENTS_WRAPPER
  TROLL_IMG: "#author-photo", // inside this.COMMENT
  TROLL_NAME: '#author-name', // inside this.COMMENT
  TROLL_CHANNEL_LINK_NODE: ".dropdown-content a.ytg-nav-endpoint", // NOT inside this.COMMENT. This is a seperate div that gets moved constantly
  SCROLL_TO_BOTTOM_OF_CHECKBOX_BUTTON: "#show-more",
  LIVE_CHAT_IFRAME_WRAPPER: '#chat',
  LIVE_CHAT_IFRAME: '#chat > iframe'
};

$(YOUTUBE_SELECTORS.SCROLL_TO_BOTTOM_OF_CHECKBOX_BUTTON).on('DOMNodeInserted', function(e) {
  if($(`${YOUTUBE_SELECTORS.SCROLL_TO_BOTTOM_OF_CHECKBOX_BUTTON}`).is(':visible')) {
    dom_manipulating.scrollToBottomOfChatBox();
  }
});


// put the widget on the screen
$(YOUTUBE_SELECTORS.APPEND_EXTENTION_TO).append(`
  <div id='troll-extension-wrapper' data-id='troll-extension-wrapper'>
    <div id='arrow-wrapper' data-id='arrow-wrapper'>
      <div id='expand-arrow-wrapper' data-id='expand-arrow-wrapper'>
        <p>Expand Troll Starver</p>
      </div>

      <div id='minimize-arrow-wrapper' data-id='minimize-arrow-wrapper'>
        <p>Minimize Troll Starver</p>
      </div>
    </div>

    <div id='shrinkable-area' data-id='shrinkable-area'>
      <div id='outer-grid-wrapper' data-id='outer-grid-wrapper'>
        <div id='troll-image-wrapper' data-id='troll-image-wrapper' droppable='true' ondragover="event.preventDefault();">
        </div>

        <div id='troll-names-wrapper' data-id='troll-names-wrapper'>
          <div class='caption' data-class='caption'>Blocking Comments</div>

          <div class='grid-header' data-class='grid-header'>x</div>
          <div class='grid-header' data-class='grid-header' id='header-name' data-id='grid-header-name'>Name(0)</div>
          <div class='grid-header' data-class='grid-header' id='header-count' data-id='grid-header-count'>#(0)</div>
        </div>

        <div id='clear-button-container'><button id='clear-all-comments' data-id='clear-all-comments' value='Clear Chat'>Clear Chat</button></div>
      </div>

      <div id='troll-import-export-wrapper'>
        <a id='import-names-link' class='row-1' data-class='row-1' data-id='import-names-link' href='#'>Import Names</a>
        <a id='export-names-link' class='row-1' data-class='row-1' data-id='export-names-link' href='#'>Export Names</a>

        <form id='import-form' class='append-radio-button-wrapper row-2' data-class='append-radio-button-wrapper row-2' data-id='append-radio-button-wrapper'>
          <input id='append-radio-button' data-id='append-radio-button' type='radio' name='import' value='append' checked>
          <label for='append-radio-button'>Append</label>
        </form>

        <div id='overwrite-radio-button-wrapper' class='overwrite-radio-button-wrapper row-2 row-3' data-class='row-2 row-3'>
          <input id='overwrite-radio-button' data-id='overwrite-radio-button' type='radio' name='import' value='overwrite' form='import-form'>
          <label for='overwrite-radio-button' form='import-form'>Overwrite</label>
        </div>

        <input id='import-submit-button' data-id='import-submit-button' class='row-2' data-class='row-2' type='button' value='Import' form='import-form'>
        <input id='import-close-button' data-id='import-close-button' class='row-3' data-class='row-3' type='button' value='Close' form='import-form'>

        <textarea id='import-names-textarea' data-id='import-names-textarea' class='row-2 row-3' data-class='row-2 row-3' placeholder="Name 1\nName 2\n...No Extra Spaces Or Empty Lines..." form='import-form'></textarea>

        <p id='export-text' class='row-4 row-5' data-class='row-4 row-5'>Exported Names</p>

        <textarea id='export-names-textarea' class='row-4 row-5' data-class='row-4 row-5' data-id='export-names-textarea'></textarea>

        <form id='export-form' class='row-4 row-5' data-class='row-4 row-5'>
          <input id='export-close-button' data-id='export-close-button' type='button' value='Close'>
        </form>
      </div>
    </div>
  </div>
`);


// reusable db manipulting functions
var db = {

  get: function get() {
    var p = new Promise(function (res, rej) {
      chrome.storage.local.get('troll_names_hash', function (troll_names_hash_wrapper) {
        if(typeof troll_names_hash_wrapper['troll_names_hash'] == 'undefined' ) {
          rej("The Trolls Name 'DB' hash does not exist. So create a new one");
        }
        res(troll_names_hash_wrapper['troll_names_hash']);
      });
    }).catch(function (args) {
      return db.replaceWith({});
    });

    return p;
  },

  // replace whole db troll_names_hash with a new hash
  replaceWith: function(hash) {
    return new Promise((res, rej) => {
      chrome.storage.local.set( {'troll_names_hash': hash }, (hash)=>{res(hash)} );
    })
  },

  // delete any db entries that match array names
  deleteNames: function(troll_names_array) {
    return db.get().then((troll_names_hash)=>{

      var updating_hash = troll_names_hash;
      for(let i = 0; i < troll_names_array.length; i++) {
        delete updating_hash[troll_names_array[i]];
      }

      return db.replaceWith(updating_hash)
    });
  },

  // display db on console
  dump: function(){
    db.get().then(hash=>{
      console.log(hash)
    });
  },

  // max number of trolls that can be uploaded, saved, and added to td table columns on the screen.
  importBulkSize: function(){
    return 25;
  },

  // delay is 1.25 seconds after uploading, saving, and adding table entries in bulk.
  importBulkDelay: function(){
    return 1000;
  }
}


// reusable dom manipulting functions
var dom_manipulating = {
  expanded_for_drag: false,
  currently_dragging: false,

  //  this weird youtube math keeps the comment section at the bottom to see the newest comment
  forceUpdateToYoutubesCommentOffsetTracker: function(){
    $(YOUTUBE_SELECTORS.COMMENT_HEIGHT_TRACKER).css('style', 'height: 0px;');
  },

  // given a saved or unsaved hash, (probably a subset of troll_names_hash), remove troll comments from chatroom in bulk and save new entries in db
  // return : a promise with the updated hash
  onExtensionLoadAddTableEntriesForDBEntries: function() {
   db.get().then((troll_names_hash)=>{
      dom_manipulating._onExtensionLoadAddTableEntriesForDBEntries(Object.keys(troll_names_hash), troll_names_hash);
    }).then(()=>{
      dom_manipulating.forceUpdateToYoutubesCommentOffsetTracker();
    })
  },
  _onExtensionLoadAddTableEntriesForDBEntries: function _onExtensionLoadAddTableEntriesForDBEntries(troll_names_array_remaining, troll_names_hash){

    // splice is a mutator method is cuts a subset out of an array and returns it. Here is giving (bulk) sized array sized array from keys_in_next_bulk for this iteration through the function and and assigns the remaining names to keys_in_current_bulk for the next iteration through the loop
      let keys_in_next_bulk = troll_names_array_remaining;
      let keys_in_current_bulk = keys_in_next_bulk.splice(0, db.importBulkSize())

    // console.log('keys_in_next_bulk = ', keys_in_next_bulk)
    // console.log('keys_in_current_bulk = ', keys_in_current_bulk)

    let comments_blocked = dom_manipulating.removeExistingCommentsFromNewTrolls(keys_in_current_bulk);
    let total_comments_blocked_in_batch = 0;

    for(let i = 0; i < keys_in_current_bulk.length; i++) {
      let comments_by_troll = comments_blocked[keys_in_current_bulk[i]];
      total_comments_blocked_in_batch += comments_by_troll;
      troll_names_hash[keys_in_current_bulk[i]] = comments_by_troll;
      // console.log(`${keys_in_current_bulk[i]}: ${comments_by_troll} ... total:${total_comments_blocked_in_batch}`)

      dom_manipulating.addATableRowHTMLNewTroll(keys_in_current_bulk[i], comments_by_troll);
    }

    // console.log(`total:${total_comments_blocked_in_batch}`)

    dom_manipulating.updateTotalCommentsBlocked(total_comments_blocked_in_batch);
    dom_manipulating.updateTotalNamesBlocked();

    if(keys_in_next_bulk.length > 0) {
      setTimeout(_onExtensionLoadAddTableEntriesForDBEntries, db.importBulkDelay(), keys_in_next_bulk, troll_names_hash);
    }
  },

  // start a single promise
  // params troll names array from all ways to create a new troll 1) Single import by drag and drop 2) Mass import by appending 3) Mass import by overwriting(assumes db has been cleared already on mass overwrite)
  // fetch current database
  // run recursive method to
  appendArrayOfTrollNames: function(troll_names_array) {
    db.get().then((troll_names_hash)=>{
        dom_manipulating._appendArrayOfTrollNamesByBulk(troll_names_array, troll_names_hash);
    }).then(()=>{
      dom_manipulating.forceUpdateToYoutubesCommentOffsetTracker();
    })
  },
  _appendArrayOfTrollNamesByBulk: function _appendArrayOfTrollNamesByBulk(troll_names_array_remaining, troll_names_hash) {

    // splice is a mutator method is cuts a subset out of an array and returns it. Here is giving (bulk) sized array sized array from keys_in_next_bulk for this iteration through the function and and assigns the remaining names to keys_in_current_bulk for the next iteration through the loop
    let keys_in_next_bulk = troll_names_array_remaining;
    let keys_in_current_bulk = keys_in_next_bulk.splice(0, db.importBulkSize())

    // console.log('keys_in_next_bulk = ', keys_in_next_bulk)
    // console.log('keys_in_current_bulk = ', keys_in_current_bulk)

    let comments_blocked = dom_manipulating.removeExistingCommentsFromNewTrolls(keys_in_current_bulk);
    let total_comments_blocked_in_batch = 0;

    // append troll name if it doesn't exist already
    for(let i = 0; i < keys_in_current_bulk.length; i++) {
      // add only new troll names to database and into troll table
      if(troll_names_hash[keys_in_current_bulk[i]] === undefined) {
        let comments_by_troll = comments_blocked[keys_in_current_bulk[i]];
        total_comments_blocked_in_batch += comments_by_troll;
        troll_names_hash[keys_in_current_bulk[i]] = comments_by_troll;
        // console.log(`${keys_in_current_bulk[i]}: ${comments_by_troll} ... total:${total_comments_blocked_in_batch}`)

        dom_manipulating.addATableRowHTMLNewTroll(keys_in_current_bulk[i], comments_by_troll);
      }
    }

    // console.log(`total:${total_comments_blocked_in_batch}`)

    dom_manipulating.updateTotalCommentsBlocked(total_comments_blocked_in_batch);


    // promises are suppose to be async, but just in case set 1.5 second js release
    db.replaceWith(troll_names_hash)
    dom_manipulating.updateTotalNamesBlocked();

    if(keys_in_next_bulk.length > 0) {
      setTimeout(_appendArrayOfTrollNamesByBulk, db.importBulkDelay(), keys_in_next_bulk, troll_names_hash);
    }
  },

  minimizeShrinkableArea: function() {
    $("[data-id='troll-extension-wrapper'] [data-id='shrinkable-area']").hide();
    $("[data-id='troll-extension-wrapper'] [data-id='minimize-arrow-wrapper']").hide();
    $("[data-id='troll-extension-wrapper'] [data-id='expand-arrow-wrapper']").show();
  },

  expandShrinkableArea: function() {
    $("[data-id='troll-extension-wrapper'] [data-id='shrinkable-area']").show();
    $("[data-id='troll-extension-wrapper'] [data-id='minimize-arrow-wrapper']").show();
    $("[data-id='troll-extension-wrapper'] [data-id='expand-arrow-wrapper']").hide();
  },

  // add new row on to troll table on the DOM
  addATableRowHTMLNewTroll: function (name, existing_comments_counter=0) {
   $(`
        <div class='td'><img class='remove-name' data-class='remove-name' src=${chrome.extension.getURL("images/remove-name.png")}></img></div>
        <div class='td troll-name' data-class='troll-name'>${name}</div>
        <div class='td comment-counter' data-class='comment-counter'>${existing_comments_counter}</div>
    `).insertAfter($("[data-id='troll-names-wrapper'] .grid-header:last"));
   $("[data-id='troll-extension-wrapper'] [data-id='troll-names-wrapper']").scrollTop(0);
  },

  // input: ie [name_1, name_2, name_3]               array of troll names to remove from chat
  // return int : {name_1: 2, name_2: 15, name_3: 0}  num of comments of his were deleted in chatroom
  removeExistingCommentsFromNewTrolls: function(troll_name_array) {
    let $all_comments = $(`${YOUTUBE_SELECTORS.COMMENTS_WRAPPER} ${YOUTUBE_SELECTORS.COMMENT}, ${YOUTUBE_SELECTORS.COMMENTS_WRAPPER} ${YOUTUBE_SELECTORS.PAID_COMMENT}`) // Look through all  comments but ignoring the last one, because that user text box to chat with. There are no other differentiating tags on it. If I add any they could be removed without me knowing.
    let result = {};

    for(let t of troll_name_array) {
      result[t] = 0;
    }

    $all_comments.each(function() {
      let commenter_name = $(this).find(YOUTUBE_SELECTORS.TROLL_NAME).html();

      let commenter_index_in_troll_array = troll_name_array.indexOf(commenter_name);
      if( commenter_index_in_troll_array != -1)
      {
        this.remove();
        result[commenter_name]++;
      }
    });

    return result;
  },

  updateTotalNamesBlocked: function() {
    var total = $("[data-id='troll-extension-wrapper'] [data-id='outer-grid-wrapper'] [data-id='troll-names-wrapper'] img.remove-name").length || 0;
    $("[data-id='troll-extension-wrapper'] [data-id='outer-grid-wrapper'] [data-id='troll-names-wrapper'] [data-id='grid-header-name']").html(`Name(${total})`);
  },

  updateTotalCommentsBlocked: function(increase_total_by=1) {
    $("[data-id='troll-extension-wrapper'] [data-id='outer-grid-wrapper'] [data-id='troll-names-wrapper'] [data-id='grid-header-count']").html( function(index, old_value) {
      let current_total = Number.parseInt(old_value.match(/#\((\d.*)\)/)[1]) || 0;
      let new_total = current_total + increase_total_by;
      return `#(${new_total})`;
    });
  },

  scrollToBottomOfChatBox: function(){
    $(YOUTUBE_SELECTORS.SCROLL_TO_BOTTOM_OF_CHECKBOX_BUTTON).click();
    $(YOUTUBE_SELECTORS.COMMENTS_WRAPPER).scrollTop(function() { return this.scrollHeight; });
  },
  // scrollToBottomOfChatBox: function(){
  //   let $scroll_box = $(YOUTUBE_SELECTORS.COMMENTS_WRAPPER)
  //   $scroll_box.scrollTop($scroll_box[0].scrollHeight);
  // },

  exportTrollsNamesToTextbox: function() {
    db.get().then((troll_names_hash) => {

      if(
          troll_names_hash === undefined ||
          ((typeof troll_names_hash == "object" ) && Object.keys(troll_names_hash).length === 0 )
        )
      {
       $("[data-id='troll-extension-wrapper'] [data-id='export-names-textarea']").val("");
      }
      else if( (typeof troll_names_hash == "object" ) && Object.keys(troll_names_hash).length > 0 ) {
        let result = Object.keys(troll_names_hash).map((troll_name) => { return(troll_name) } ).join("\n");
        $("[data-id='troll-extension-wrapper'] [data-id='export-names-textarea']").val(result);
      }
    });
  }
}


// make all comments visible
$(`${YOUTUBE_SELECTORS.COMMENTS_WRAPPER} ${YOUTUBE_SELECTORS.COMMENT}, ${YOUTUBE_SELECTORS.COMMENTS_WRAPPER} ${YOUTUBE_SELECTORS.PAID_COMMENT}`).each(function() {
   $(this).addClass('approved-comment');
});

dom_manipulating.onExtensionLoadAddTableEntriesForDBEntries();


// store the single name of the troll you are dragging in event.dataTransfer until successful drop of the icon
$(YOUTUBE_SELECTORS.COMMENTS_WRAPPER).on('dragstart', YOUTUBE_SELECTORS.TROLL_IMG, function(event) {
  // expand extension temporarialy if it is currently minimized
  if($("[data-id='troll-extension-wrapper'] [data-id='shrinkable-area']").is(':hidden')) {
    dom_manipulating.expandShrinkableArea();
    dom_manipulating.expanded_for_drag = true;
  }

  dom_manipulating.currently_dragging = true;
  event.dataTransfer = event.originalEvent.dataTransfer;
  let troll_name = $(this).parents(`${YOUTUBE_SELECTORS.COMMENT}, ${YOUTUBE_SELECTORS.PAID_COMMENT}`).find(YOUTUBE_SELECTORS.TROLL_NAME).html();
  console.log(`troll_name drag start : `, troll_name);
  event.dataTransfer.setData('troll-name', troll_name);
});



// when a user's image is dragged and dropped onto the troll image, save the name in db
$("[data-id='troll-extension-wrapper'] [data-id='troll-image-wrapper']").on('drop', function(event) {
  event.preventDefault();
  event.dataTransfer = event.originalEvent.dataTransfer; // found this on stack overflow. Only way to make dataTransfer work
  let troll_name = event.dataTransfer.getData('troll-name');
  console.log(`troll_name dropped : `, troll_name);

  dom_manipulating.appendArrayOfTrollNames([troll_name]);

  // reminimize the extension if it was only opened for drag process
  if(dom_manipulating.expanded_for_drag && dom_manipulating.currently_dragging){
    // $("[data-id='troll-image-wrapper']").addClass('minimize');
    dom_manipulating.minimizeShrinkableArea();
    dom_manipulating.expanded_for_drag = false;
  }

  dom_manipulating.currently_dragging = false;
});

$(YOUTUBE_SELECTORS.COMMENTS_WRAPPER).on('dragend', function(){
  dom_manipulating.currently_dragging = false;
  dom_manipulating.expanded_for_drag = false;
});

// remove single troll from list
$("[data-id='troll-extension-wrapper'] [data-id='troll-names-wrapper']").on('click', '.remove-name', function(event) {
  let name = $(this).parent().next('.troll-name').html();
  console.log(`removing single troll name : `, name);

  $(this).parent().next('.td').remove();
  $(this).parent().next('.td').remove();
  $(this).parent().remove();

  // $element_to_delete.remove();
  dom_manipulating.updateTotalNamesBlocked();

  db.deleteNames([name]);
});


// clear chat room
$("[data-id='troll-extension-wrapper'] [data-id='clear-all-comments']").on('click', function() {
  $(YOUTUBE_SELECTORS.COMMENTS_WRAPPER).empty(); // $(`${YOUTUBE_SELECTORS.COMMENTS_WRAPPER} .approved-comment`).remove();
  $(YOUTUBE_SELECTORS.COMMENT_HEIGHT_TRACKER).css('style', 'height: 0px;');
  dom_manipulating.scrollToBottomOfChatBox();
});

// if an incoming comment is written by a troll then remove it and increment the comment_counter of troll
$(YOUTUBE_SELECTORS.COMMENTS_WRAPPER).on('DOMNodeInserted', function(event) {

  db.get().then((troll_names_hash)=>{

    if( troll_names_hash !== {} && troll_names_hash !== undefined )
    {
      var $comment_element = $(event.target);
      let commenters_name = $comment_element.find(YOUTUBE_SELECTORS.TROLL_NAME).html();

      if(commenters_name === undefined) {
        return false;
      }

      if(troll_names_hash[commenters_name] != undefined) {
        troll_names_hash[commenters_name]++;
        $(`[data-id='troll-extension-wrapper'] [data-class='troll']:contains(${commenters_name}) > [data-class='comment-counter']`).html(troll_names_hash[commenters_name]);
        $comment_element.remove();
        dom_manipulating.updateTotalCommentsBlocked(1);
        db.replaceWith(troll_names_hash);
        return;
      }
    }

    $(event.target).addClass('approved-comment');
  });


  // in normal view, click on export link.
  $("[data-id='troll-extension-wrapper'] [data-id='export-names-link']").on('click', function (e) {
    e.preventDefault();
    $("[data-id='troll-extension-wrapper'] [data-class*='row-1']").hide();
    $("[data-id='troll-extension-wrapper'] [data-class*='row-4'], [data-class*='row-5']").show();
    dom_manipulating.exportTrollsNamesToTextbox();
  });

  // In normal view, click import button view
  $("[data-id='troll-extension-wrapper'] [data-id='import-names-link']").on('click', function (e) {
    e.preventDefault();
    $("[data-id='troll-extension-wrapper'] [data-class*='row-1']").hide();
    $("[data-id='troll-extension-wrapper'] [data-class*='row-2'], [data-class*='row-3']").show();
  });

  // In export view, click close button to exit.
  $("[data-id='troll-extension-wrapper'] [data-id='export-close-button']").on('click', function () {
    $("[data-id='troll-extension-wrapper'] [data-class*='row-1']").show();
    $("[data-id='troll-extension-wrapper'] [data-class*='row-4'], [data-class*='row-5']").hide();
    $("[data-id='troll-extension-wrapper'] [data-id='export-names-textarea']").val("");
  });

  // In the import view, click the close button to exit.
  $("[data-id='troll-extension-wrapper'] [data-id='import-close-button']").on('click', function () {
    $("[data-id='troll-extension-wrapper'] [data-id='import-names-textarea']").val('');
    $("[data-id='troll-extension-wrapper'] [data-class*='row-1']").show();
    $("[data-id='troll-extension-wrapper'] [data-class*='row-2'], [data-class*='row-3']").hide();
    $("[data-id='troll-extension-wrapper'] [data-id='append-radio-button']").click();
  });

  // In the import view, click import button.
  $("[data-id='troll-extension-wrapper'] [data-id='import-submit-button']").on('click', function () {
    // console.log('import button clicked')
    let importing_names_array = $("[data-id='troll-extension-wrapper'] [data-id='import-names-textarea']").val().match(/.+(\n|$)/g);

    // if there is an import string in the
    if(importing_names_array !== null) {
      let importing_names_array_length = importing_names_array.length;

      // remove the weird '↵' from any line that has it.
      for(let i = 0; i < importing_names_array_length - 1; i++) {
        importing_names_array[i] = importing_names_array[i].substr(0, importing_names_array[i].length - 1);
      }

      let overwrite_checked = $("[data-id='troll-extension-wrapper'] [data-id='overwrite-radio-button']:checked").val() === 'overwrite'; // need this inside variable set for promise
      new Promise((res, rej)=>{ // overwrite the db and then kick off appending names in bulk to db
        res(1);
      }).then(()=>{
        // delete all trolls if overwrite radio button is checked
        if(!!overwrite_checked) {
          $(`[data-id='troll-extension-wrapper'] [data-id='troll-names-wrapper'] > :not([data-class='caption'], [data-class='grid-header'])`).not("[data-class='caption'], [data-class='grid-header']").each(function(idex, element) {
            element.remove();
          });
          return new Promise((res, rej)=>{ // step is async...return promise to empty db and then append new people
            db.replaceWith({});
            res(true);
          })
        }
      }).then(()=>{
        dom_manipulating.appendArrayOfTrollNames(importing_names_array);
      });
    }

    // if the import panel is visible then hide it and show the import or export links
    if($("[data-id='troll-extension-wrapper'] [data-id='append-radio-button-wrapper']").is(':visible')){
      $("[data-id='troll-extension-wrapper'] [data-class*='row-1']").show();
      $("[data-id='troll-extension-wrapper'] [data-class*='row-2'], [data-id='troll-extension-wrapper'] [data-class*='row-3']").hide();
      $("[data-id='troll-extension-wrapper'] [data-id='import-names-textarea']").val('');
      $("[data-id='troll-extension-wrapper'] ['data-class='append-radio-button-wrapper']").click();
    }
  });
});

// user clicks minimize expansion div
$("[data-id='troll-extension-wrapper'] [data-id='minimize-arrow-wrapper']").click( () => {
  dom_manipulating.minimizeShrinkableArea();
});

// user clicks expand expansion div
$("[data-id='troll-extension-wrapper'] [data-id='expand-arrow-wrapper']").click( () => {
  dom_manipulating.expandShrinkableArea();
});

dom_manipulating.scrollToBottomOfChatBox();
