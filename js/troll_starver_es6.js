const YOUTUBE_SELECTORS = new function(){
  // APPEND_EXTENTION_TO: '#panel-pages',
  this.APPEND_EXTENTION_TO = 'yt-live-chat-message-input-renderer';
  // this.COMMENTS_WRAPPER = '#items.yt-live-chat-ticker-renderer'; style-scope yt-live-chat-item-list-renderer
  this.COMMENTS_WRAPPER = '#items.style-scope.yt-live-chat-item-list-renderer'; // inside this.COMMENTS_WRAPPER
  this.COMMENT = 'yt-live-chat-text-message-renderer';  // inside this.COMMENTS_WRAPPER
  this.TROLL_IMG = "[is='yt-img']";                     // inside this.COMMENT
  this.TROLL_NAME = '#author-name';                     // inside this.COMMENT
}

// reusable db manipulting functions
var db = {
  asyncReplaceAllTrollInfo: function(entire_hash, callback) {
    chrome.storage.local.set({ 'troll_names_hash': entire_hash }, callback);
  },

  asyncDeleteTrollNames: function(troll_names_array) {
    chrome.storage.local.get('troll_names_hash', function (trolls_chrome_extension_info) {

      var updating_hash = trolls_chrome_extension_info['troll_names_hash'];

      for(let i = 0; i < troll_names_array.length; i++) {
        delete updating_hash[troll_names_array[i]];
      }

      chrome.storage.local.set({'troll_names_hash': updating_hash}, ()=>{}); //here
    });
  },

  // this method needs optimizing. Should do bulk like this instead of doing through multiple loops.
    // 1) figure out all hash of trolls messages that should be removed from chat box dom_manipulating.removeExistingCommentsFromNewTrolls
    // 2) add take results of (1) and bulk create entries in troll table dom_manipulating.addEntryToTrollsTable
    // 3) updateTotalNamesBlocked
    // 4) updateTotalCommentsBlocked
  asyncAppendArrayOfTrollNames: function(troll_names_array) {
    chrome.storage.local.get('troll_names_hash', function (trolls_chrome_extension_info) {
      var updating_hash = trolls_chrome_extension_info['troll_names_hash'];

      // append troll name if it doesn't exist already
      for(let i = 0; i < troll_names_array.length; i++) {
        // add only new troll names to database and into troll table
        if(updating_hash[troll_names_array[i]] === undefined) {
          let comments_blocked = dom_manipulating.removeExistingCommentsFromNewTrolls([troll_names_array[i]])[troll_names_array[i]] || 0;
          updating_hash[troll_names_array[i]] = comments_blocked;
          dom_manipulating.addEntryToTrollsTable(troll_names_array[i], comments_blocked);
          dom_manipulating.updateTotalCommentsBlocked(comments_blocked);
        }
      }

      chrome.storage.local.set({'troll_names_hash': updating_hash}, (updating_hash)=>{
        dom_manipulating.updateTotalNamesBlocked();
      });
    });
  }
};

// reusable dom manipulting functions
var dom_manipulating = {

  makeTableReflectSavedTrollNames: function() {
    chrome.storage.local.get('troll_names_hash', function (trolls_chrome_extension_info) {
      // nothing to update if db doesn't exist yet.
      if (trolls_chrome_extension_info['troll_names_hash'] === undefined) {
        db.asyncReplaceAllTrollInfo({}, function () {});
        return;
      }

      var troll_names_hash = trolls_chrome_extension_info['troll_names_hash'];

      if( (typeof troll_names_hash == "object" ) && Object.keys(troll_names_hash).length > 0 ) {
        let keys = Object.keys(troll_names_hash);
        let current_troll_comments = dom_manipulating.removeExistingCommentsFromNewTrolls(keys);

        for(let key of keys){
          troll_names_hash[key] = current_troll_comments[key] || 0;
          dom_manipulating.addEntryToTrollsTable(key, troll_names_hash[key]);
          dom_manipulating.updateTotalCommentsBlocked(troll_names_hash[key]);
        }

        dom_manipulating.updateTotalNamesBlocked();

        db.asyncReplaceAllTrollInfo(troll_names_hash, ()=>{});
      }
    });
  },

  // add new row on to troll table on the DOM
  addEntryToTrollsTable: function (name, existing_comments_counter=0) {
   $(`
      <tr class='troll' data-class='troll'>
        <td><img class='remove-name' data-class='remove-name' src=${chrome.extension.getURL("images/remove-name.png")}></img></td>
        <td class='troll-name' data-class='troll-name'>${name}</td>
        <td class='comment-counter' data-class='comment-counter'>${existing_comments_counter}</td>
      </tr>
    `).insertAfter($('#troll-names-wrapper #table-header'));
   $('#troll-names-wrapper').scrollTop(0);
  },

  // input: ie [name_1, name_2, name_3]               array of troll names to remove from chat
  // return int : {name_1: 2, name_2: 15, name_3: 0}  num of comments of his were deleted in chatroom
  removeExistingCommentsFromNewTrolls: function(troll_name_array) {
    let $all_comments = $(`${YOUTUBE_SELECTORS.COMMENTS_WRAPPER} ${YOUTUBE_SELECTORS.COMMENT}`) // Look through all  ".comment" but ignoring the last one, because that user text box to chat with. There are no other differentiating tags on it. If I add any they could be removed without me knowing.

    let result = {};
    for(let t of troll_name_array) {
      result[t] = 0;
    }

    $all_comments.each(function() {
      let commenter_name = $(this).find(YOUTUBE_SELECTORS.TROLL_NAME).html();

      let commenter_index_in_troll_array = troll_name_array.indexOf(commenter_name);
      if( commenter_index_in_troll_array != -1)
      {
        result[commenter_name]++;
        $(this).remove();
      }
    });

    return result;
  },

  updateTotalNamesBlocked: function() {
    var total = $("[data-id='troll-table-wrapper'] #troll-names-wrapper table img.remove-name").length || 0;

    $("[data-id='troll-table-wrapper'] #troll-names-wrapper #header-name").html(`Name(${total})`);
  },

  updateTotalCommentsBlocked: function(increase_total_by=1) {
    let string = $("[data-id='troll-table-wrapper'] #troll-names-wrapper #header-count").html() || "";
    let current_total = Number.parseInt(string.match(/#\((\d.*)\)/)[1]) || 0;
    let new_total = current_total + increase_total_by;
    $("[data-id='troll-table-wrapper'] #troll-names-wrapper #header-count").html(`#(${new_total})`);
  },

  scrollToBottomOfChatBox: function(){
    let $scroll_box = $('#items.style-scope.yt-live-chat-item-list-renderer')
    $scroll_box.scrollTop($scroll_box[0].scrollHeight);
  },

  exportTrollsNamesToTextbox: function(){
    chrome.storage.local.get('troll_names_hash', (trolls_chrome_extension_info)=>{
      var troll_names_hash = trolls_chrome_extension_info['troll_names_hash'];
      // console.log($('#export-names-textarea').val(""));

      if(
          trolls_chrome_extension_info['troll_names_hash'] === undefined ||
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

// put the widget on the screen
$(YOUTUBE_SELECTORS.APPEND_EXTENTION_TO).append(`
  <div id='troll-extension-wrapper'>
    <div id='arrow-wrapper'>
      <div id='expand-arrow-wrapper' data-id='expand-arrow-wrapper'>
        &#11014;
        <p>Expand Troll Starver</p>
        &#11014;
      </div>

      <div id='minimize-arrow-wrapper' data-id='minimize-arrow-wrapper'>
        &#11015;
        <p>Minimize Troll Starver</p>
        &#11015;
      </div>
    </div>

    <div id='shrinkable-area' data-id='shrinkable-area'>
      <div id='troll-table-wrapper' data-id='troll-table-wrapper'>
        <div id='troll-image-wrapper' droppable='true' ondragover="event.preventDefault();">
        </div>

        <div id='troll-names-wrapper' data-id='troll-names-wrapper'>
          <table>
            <caption>Blocking Comments</caption>
            <tr id='table-header'>
              <th>x</th>
              <th id='header-name'>Name(0)</th>
              <th id='header-count'>#(0)</th>
            </th>
          </table>
        </div>

        <div><form><input type='button' id='clear-all-comments' data-id='clear-all-comments' value='Clear Chat'</input></form></div>
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
            <input id='import-close-button' type='button' value='close'>
            <input id='import-names-button' type='button' value='import'>
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

$('#troll-extension-wrapper #arrow-wrapper').click( ()=> {
  if ($('#troll-extension-wrapper #arrow-wrapper #expand-arrow-wrapper:visible').length == 0) {
    $('#troll-extension-wrapper').addClass('minimize');
  }
  else
  {
    $('#troll-extension-wrapper').removeClass('minimize');
  }
});

// make all comments visible
$(`${YOUTUBE_SELECTORS.COMMENTS_WRAPPER} ${YOUTUBE_SELECTORS.COMMENT}`).each(function() {
   $(this).addClass('approved-comment');
});

dom_manipulating.makeTableReflectSavedTrollNames();

dom_manipulating.scrollToBottomOfChatBox();

var expanded_for_drag = false

// add new troll to list, clear his old comments, and start ignoring new comments
$(YOUTUBE_SELECTORS.COMMENTS_WRAPPER).on('dragstart', YOUTUBE_SELECTORS.TROLL_IMG, function(event) {
  // expand extension if it is currently minimized
  if($("#troll-extension-wrapper [data-id='expand-arrow-wrapper']:visible").length > 0)
  {
    $('#troll-extension-wrapper').removeClass('minimize');
    expanded_for_drag = true
  }

  event.dataTransfer = event.originalEvent.dataTransfer;
  let troll_name = $(this).closest(YOUTUBE_SELECTORS.COMMENT).find(YOUTUBE_SELECTORS.TROLL_NAME).html();
  event.dataTransfer.setData('troll-name', troll_name);
});


// when a user's image is dragged and dropped onto the troll, save troll to saved chrome.storage and
$('#troll-image-wrapper').on('drop', function(event) {
  event.preventDefault();
  event.dataTransfer = event.originalEvent.dataTransfer; // found this on stack overflow. Only way to make dataTransfer work
  let troll_name = event.dataTransfer.getData('troll-name');

  chrome.storage.local.get('troll_names_hash', function(trolls_chrome_extension_info) {
    debugger;
    var troll_names_hash = trolls_chrome_extension_info['troll_names_hash'];

    if(troll_names_hash[troll_name] === undefined) {
      troll_names_hash[troll_name] = dom_manipulating.removeExistingCommentsFromNewTrolls([troll_name])[troll_name] || 0;

      db.asyncReplaceAllTrollInfo(troll_names_hash, function() {
        dom_manipulating.addEntryToTrollsTable(troll_name, troll_names_hash[troll_name]);
        dom_manipulating.updateTotalNamesBlocked();
        dom_manipulating.updateTotalCommentsBlocked(troll_names_hash[troll_name]);
      });
    }
  });

  // reminimize the extension if it was only opened for drag process
  if(expanded_for_drag){
    $('#troll-extension-wrapper').addClass('minimize');
    expanded_for_drag = false;
  }
});

// clear chat room
$("[data-id='clear-all-comments']").on('click', function() {
  dom_manipulating.scrollToBottomOfChatBox();
  $(YOUTUBE_SELECTORS.COMMENTS_WRAPPER).html('');
});


// remove single troll from list
$("[data-id='troll-names-wrapper']").on('click', '.remove-name', function(event) {
  var $element_to_delete = $(this).closest("[data-class='troll']");
  let name = $element_to_delete.find('.troll-name').html();
  $element_to_delete.remove();
  dom_manipulating.updateTotalNamesBlocked();
  db.asyncDeleteTrollNames([name]);
});

// if an incoming comment is written by a troll then remove it and increment the comment_counter of troll
$(YOUTUBE_SELECTORS.COMMENTS_WRAPPER).on('DOMNodeInserted', function(event) {
  // the chat room doubles up on this comment for when you start sending a comment and when it is done. So ignore the first one
  // Youtube fixed this
  // if(event.target && event.target.className && event.target.className.indexOf('sending-in-progress') != -1) {
  //   return;
  // }

  chrome.storage.local.get('troll_names_hash', function(trolls_chrome_extension_info) {
    var troll_names_hash = trolls_chrome_extension_info['troll_names_hash'];

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
        db.asyncReplaceAllTrollInfo(troll_names_hash, ()=>{});
        return;
      }
    }

  $(event.target).addClass('approved-comment');
    dom_manipulating.scrollToBottomOfChatBox();
  });


  // in normal view, click on export link.
  $('#export-names-link').on('click', function (e) {
    e.preventDefault();
    $('#import-export-links-wrapper').hide();
    $('#export-names-wrapper').show();
    dom_manipulating.exportTrollsNamesToTextbox();
  });

  // In normal view, click inport button view
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
  $("#import-names-wrapper input[value='import']").on('click', function () {

    let importing_names_array = $('#import-names-textarea').val().match(/.+(\n|$)/g);

    // if there is an import string in the
    if(importing_names_array !== null) {
      let importing_names_array_length = importing_names_array.length;

      // delete all trolls if overwrite radio button is checked
      if( $("#import-names-radio-wrapper :checked").val() === 'overwrite') {
        db.asyncReplaceAllTrollInfo({}, ()=>{});
        $("[data-id='troll-names-wrapper']" + ' .troll').each(function(idex, element){
          element.remove();
        });
      }

      // remove the weird '↵' at the end of each line that isn't the final line.
      for(let i = 0; i < importing_names_array_length - 1; i++)
      {
        importing_names_array[i] = importing_names_array[i].substr(0, importing_names_array[i].length - 1);
      }

      db.asyncAppendArrayOfTrollNames(importing_names_array);
    }

    $('#import-export-links-wrapper').show();
    $('#import-names-wrapper').hide();
    $('#import-names-textarea').val('');
    $('#append-label').click();
  });
});
