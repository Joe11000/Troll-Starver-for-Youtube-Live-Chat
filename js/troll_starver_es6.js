// 3rd party(youtube) selectors
const YOUTUBE_SELECTORS = {
  APPEND_EXTENTION_TO: 'yt-live-chat-message-input-renderer',
  COMMENTS_WRAPPER: '#items.style-scope.yt-live-chat-item-list-renderer', // inside this.COMMENTS_WRAPPER
  COMMENT: 'yt-live-chat-text-message-renderer',  // inside this.COMMENTS_WRAPPER
  TROLL_IMG: "[is='yt-img']",                     // inside this.COMMENT
  TROLL_NAME: '#author-name',                     // inside this.COMMENT
  TROLL_CHANNEL_LINK_NODE: ".dropdown-content a.ytg-nav-endpoint" // NOT inside this.COMMENT. This is a seperate div that gets moved constantly
}

// put the widget on the screen
$(YOUTUBE_SELECTORS.APPEND_EXTENTION_TO).append(`
  <div id='troll-extension-wrapper'>
    <div id='arrow-wrapper'>
      <div id='expand-arrow-wrapper' data-id='expand-arrow-wrapper'>
        <p>Expand Troll Starver</p>
      </div>

      <div id='minimize-arrow-wrapper' data-id='minimize-arrow-wrapper'>
        <p>Minimize Troll Starver</p>
      </div>
    </div>

    <div id='shrinkable-area' data-id='shrinkable-area'>
      <div id='outer-grid-wrapper' data-id='outer-grid-wrapper'>
        <div id='troll-image-wrapper' droppable='true' ondragover="event.preventDefault();">
        </div>

        <div id='troll-names-wrapper' data-id='troll-names-wrapper'>
          <div class='caption'>Blocking Comments</div>

          <div class='grid-header'>x</div>
          <div class='grid-header' id='header-name'>Name<strong>(0)</strong></div>
          <div class='grid-header' id='header-count'><strong>#(0)</strong></div>


          <div class='troll' data-class='troll'>
            <div class='td'><img class='remove-name' data-class='remove-name' src=${chrome.extension.getURL("images/remove-name.png")}></img></div>
            <div class='td troll-name' data-class='troll-name'><p>Troll Name 1</p></div>
            <div class='td comment-counter' data-class='comment-counter'>34</div>
          </div>

          <div class='troll' data-class='troll'>
            <div class='td'><img class='remove-name' data-class='remove-name' src=${chrome.extension.getURL("images/remove-name.png")}></img></div>
            <div class='td troll-name' data-class='troll-name'>Troll Name 1</div>
            <div class='td comment-counter' data-class='comment-counter'>34</div>
          </div>

          <div class='troll' data-class='troll'>
            <div class='td'><img class='remove-name' data-class='remove-name' src=${chrome.extension.getURL("images/remove-name.png")}></img></div>
            <div class='td troll-name' data-class='troll-name'>Troll Name 1</div>
            <div class='td comment-counter' data-class='comment-counter'>34</div>
           </div>
        </div>

        <div id='clear-button-container'><button id='clear-all-comments' data-id='clear-all-comments' value='Clear Chat'>Clear Chat</button></div>
      </div>

      <div id='troll-import-export-wrapper'>
        <div id='import-export-links-wrapper'>
          <a id='import-names-link' href='#'><span>import names</span></a>
          <a id='export-names-link' href='#'><span>export names</span></a>
        </div>

        <form id='import-names-wrapper'>
          <div id='import-names-radio-wrapper'>
            <div class='import-names-radio-row'>
              <input id='append-label' type='radio' name='import' value='append' checked>
              <label for='append-label'>append</label>
            </div>

            <div class='import-names-radio-row'>
              <input id='overwrite-label' type='radio' name='import' value='overwrite'>
              <label for='overwrite-label'>overwrite</label>
            </div>
          </div>
          <div id='import-names-textarea-wrapper'>
            <textarea id='import-names-textarea' placeholder="name 1\nname 2\nname 3"></textarea>
          </div>
          <div id='import-buttons'>
            <input id='import-close-button' data-id='import-close-button' type='button' value='close'>
            <input id='import-names-button' data-id='import-names-button' type='button' value='import'>
          </div>
        </form>

        <div id='export-names-wrapper'>
          <label for='export-names-textarea'>exported names</label>

          <div id='export-names-textarea-wrapper'>
            <textarea id='export-names-textarea'></textarea>
          </div>

          <div id='export-form-wrapper'>
            <form id='export-form'>
              <input id='export-close-button' type='button' value='close'>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
`);


// reusable db manipulting functions
var db = {
  get: function() {
    return new Promise((res, rej) => {
      chrome.storage.local.get('troll_names_hash', (troll_names_hash_wrapper)=>{res(troll_names_hash_wrapper['troll_names_hash'])})
    })
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
    return 100
  },

  // delay is 1.25 seconds after uploading, saving, and adding table entries in bulk.
  importBulkDelay: function(){
    return 1250;
  }
}


// reusable dom manipulting functions
var dom_manipulating = {

  // given a saved or unsaved hash, (probably a subset of troll_names_hash), remove troll comments from chatroom in bulk and save new entries in db
  // return : a promise with the updated hash
  onExtensionLoadAddTableEntriesForDBEntries: function() {
   db.get().then((troll_names_hash)=>{
      dom_manipulating._onExtensionLoadAddTableEntriesForDBEntries(Object.keys(troll_names_hash), troll_names_hash);
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

    // append troll name if it doesn't exist already
    for(let i = 0; i < keys_in_current_bulk.length; i++) {
      // add only new troll names to database and into troll table
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

  // add new row on to troll table on the DOM
  addATableRowHTMLNewTroll: function (name, existing_comments_counter=0) {
   $(`
      <div class='troll' data-class='troll'>
        <div class='td'><img class='remove-name' data-class='remove-name' src=${chrome.extension.getURL("images/remove-name.png")}></img></div>
        <div class='td troll-name' data-class='troll-name'>${name}</div>
        <div class='td comment-counter' data-class='comment-counter'>${existing_comments_counter}</div>
      </div>
    `).insertAfter($('#troll-names-wrapper .table-headers'));
   $('#troll-names-wrapper').scrollTop(0);
  },

  // input: ie [name_1, name_2, name_3]               array of troll names to remove from chat
  // return int : {name_1: 2, name_2: 15, name_3: 0}  num of comments of his were deleted in chatroom
  removeExistingCommentsFromNewTrolls: function(troll_name_array) {
    let $all_comments = $(`${YOUTUBE_SELECTORS.COMMENTS_WRAPPER} ${YOUTUBE_SELECTORS.COMMENT}`) // Look through all  comments but ignoring the last one, because that user text box to chat with. There are no other differentiating tags on it. If I add any they could be removed without me knowing.

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
    var total = $("[data-id='outer-grid-wrapper'] #troll-names-wrapper img.remove-name").length || 0;

    $("[data-id='outer-grid-wrapper'] #troll-names-wrapper #header-name").html(`Name(${total})`);
  },

  updateTotalCommentsBlocked: function(increase_total_by=1) {
    let string = $("[data-id='outer-grid-wrapper'] #troll-names-wrapper #header-count").html() || "";
    let current_total = Number.parseInt(string.match(/#\((\d.*)\)/)[1]) || 0;
    let new_total = current_total + increase_total_by;
    $("[data-id='outer-grid-wrapper'] #troll-names-wrapper #header-count").html(`#(${new_total})`);
  },

  scrollToBottomOfChatBox: function(){
    let $scroll_box = $(YOUTUBE_SELECTORS.COMMENTS_WRAPPER)
    $scroll_box.scrollTop($scroll_box[0].scrollHeight);
  },

  exportTrollsNamesToTextbox: function(){
    db.get().then((troll_names_hash)=>{

      if(
          troll_names_hash === undefined ||
          ((typeof troll_names_hash == "object" ) && Object.keys(troll_names_hash).length === 0 )
        )
      {
       $('#export-names-textarea').val("");
      }
      else if( (typeof troll_names_hash == "object" ) && Object.keys(troll_names_hash).length > 0 ) {
        let result = Object.keys(troll_names_hash).map((troll_name) => { return(troll_name) } ).join("\n");
        $('#export-names-textarea').val(result);
      }
    });
  }
}





// start a single promise
  // params troll names array from all ways to create a new troll 1) Single import by drag and drop 2) Mass import by appending 3) Mass import by overwriting(assumes db has been cleared already on mass overwrite)
  // fetch current database
  // run recursive method to

function appendArrayOfTrollNames(troll_names_array) {
  db.get().then((troll_names_hash)=>{
    _appendArrayOfTrollNamesByBulk(troll_names_array, troll_names_hash);
  })
}
var _appendArrayOfTrollNamesByBulk = function _appendArrayOfTrollNamesByBulk(troll_names_array_remaining, troll_names_hash){

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
}


var expanded_for_drag = false


// make all comments visible
$(`${YOUTUBE_SELECTORS.COMMENTS_WRAPPER} ${YOUTUBE_SELECTORS.COMMENT}`).each(function() {
   $(this).addClass('approved-comment');
});

dom_manipulating.onExtensionLoadAddTableEntriesForDBEntries();


// store the single name of the troll you are dragging in event.dataTransfer until successful drop of the icon
$(YOUTUBE_SELECTORS.COMMENTS_WRAPPER).on('dragstart', YOUTUBE_SELECTORS.TROLL_IMG, function(event) {
  // expand extension temporarialy if it is currently minimized
  if($("#troll-extension-wrapper [data-id='expand-arrow-wrapper']:visible").length > 0)
  {
    $('#troll-extension-wrapper').removeClass('minimize');
    expanded_for_drag = true
  }

  event.dataTransfer = event.originalEvent.dataTransfer;
  let troll_name = $(this).closest(YOUTUBE_SELECTORS.COMMENT).find(YOUTUBE_SELECTORS.TROLL_NAME).html();
  event.dataTransfer.setData('troll-name', troll_name);
});



// when a user's image is dragged and dropped onto the troll image, save the name in db
$('#troll-image-wrapper').on('drop', function(event) {
  event.preventDefault();
  event.dataTransfer = event.originalEvent.dataTransfer; // found this on stack overflow. Only way to make dataTransfer work
  let troll_name = event.dataTransfer.getData('troll-name');

  appendArrayOfTrollNames([troll_name])

  // reminimize the extension if it was only opened for drag process
  if(expanded_for_drag){
    $('#troll-extension-wrapper').addClass('minimize');
    expanded_for_drag = false;
  }
});

// remove single troll from list
$("[data-id='troll-names-wrapper']").on('click', '.remove-name', function(event) {
  var $element_to_delete = $(this).closest("[data-class='troll']");
  let name = $element_to_delete.find('.troll-name').html();
  $element_to_delete.remove();
  dom_manipulating.updateTotalNamesBlocked();

  db.deleteNames([name]);
});


// clear chat room
$("[data-id='clear-all-comments']").on('click', function() {
  dom_manipulating.scrollToBottomOfChatBox();
  $(YOUTUBE_SELECTORS.COMMENTS_WRAPPER).html('');
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
        $(`[data-class='troll']:contains(${commenters_name}) > [data-class='comment-counter']`).html(troll_names_hash[commenters_name]);
        $comment_element.remove();
        dom_manipulating.updateTotalCommentsBlocked(1);
        db.replaceWith(troll_names_hash);
        return;
      }
    }

    $(event.target).addClass('approved-comment');
  });


  // in normal view, click on export link.
  $('#export-names-link').on('click', function (e) {
    e.preventDefault();
    $('#import-export-links-wrapper').hide();
    $('#export-names-wrapper').show();
    dom_manipulating.exportTrollsNamesToTextbox();
  });

  // In normal view, click import button view
  $('#import-names-link').on('click', function (e) {
    e.preventDefault();
    $('#import-export-links-wrapper').hide();
    $('#import-names-wrapper').show();
  });

  // In export view, click close button to exit.
  $('#export-names-wrapper #export-close-button').on('click', function () {
    $('#import-export-links-wrapper').show();
    $('#export-names-wrapper').hide();
    $('#export-names-textarea').val("");
  });

  // In the import view, click the close button to exit.
  $('#import-names-wrapper #import-close-button').on('click', function () {
    $('#import-names-textarea').val('');
    $('#import-export-links-wrapper').show();
    $('#import-names-wrapper').hide();
    $('#append-label').click();
  });

  // In the import view, click import button.
  $("#import-names-wrapper [data-id='import-names-button']").on('click', function () {
    // console.log('import button clicked')
    let importing_names_array = $('#import-names-textarea').val().match(/.+(\n|$)/g);

    // if there is an import string in the
    if(importing_names_array !== null) {
      let importing_names_array_length = importing_names_array.length;

      // remove the weird '↵' at the end of each line that isn't the final line.
      for(let i = 0; i < importing_names_array_length - 1; i++)
      {
        importing_names_array[i] = importing_names_array[i].substr(0, importing_names_array[i].length - 1);
      }

      let overwrite_checked = $("#import-names-radio-wrapper :checked").val() === 'overwrite' // need this inside variable set for promise
      new Promise((res, rej)=>{ // overwrite the db and then kick off appending names in bulk to db
        res(1)
      }).then(()=>{
        // delete all trolls if overwrite radio button is checked
        if(!!overwrite_checked) {
          $("[data-id='troll-names-wrapper']" + ' .troll').each(function(idex, element){
            element.remove();
          });
          return new Promise((res, rej)=>{ // step is async...return promise to empty db and then append new people
            db.replaceWith({});
            res(true);
          })
        }
      }).then(()=>{
        appendArrayOfTrollNames(importing_names_array);
      })
    }

    // if the import panel is visible then hide it and show the import or export links
    if($('#import-names-wrapper:visible').length != 0){
      $('#import-export-links-wrapper').show();
      $('#import-names-wrapper').hide();
      $('#import-names-textarea').val('');
      $('#append-label').click();
    }
  });
});

// When the user clicks on the minimize/maximize div, then either open or minimize the extension
$('#troll-extension-wrapper #arrow-wrapper').click( ()=> {
  if ($('#troll-extension-wrapper #arrow-wrapper #expand-arrow-wrapper:visible').length == 0) {
    $('#troll-extension-wrapper').addClass('minimize');
  }
  else
  {
    $('#troll-extension-wrapper').removeClass('minimize');
  }
});

dom_manipulating.scrollToBottomOfChatBox();


// iframe warning html

// document.querySelector('iframe#live-chat-iframe').parentNode.insertAdjacentHTML('beforeend', `
//   <div id='troll-extension-wrapper'>
//     <div id='iframe-loads-chatroom-warning'>
//       <p class='warning-header'>TROLL BLOCKER</p>
//       <p class='warning-orange'>Warning : The chatroom above is loaded through an iframe.</p>
//       <p>You must either 1) Pop out the chatbox or 2) Enter "Youtube Gaming Mode" in order to use this extension.</p>
//   </div>
//   </div>
// `);
