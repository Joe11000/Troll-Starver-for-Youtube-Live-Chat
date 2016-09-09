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

  asyncAppendArrayOfTrollNames: function(troll_names_array) {
    chrome.storage.local.get('troll_names_hash', function (trolls_chrome_extension_info) {
      var updating_hash = trolls_chrome_extension_info['troll_names_hash'];

      // append troll name if it doesn't exist already
      for(let i = 0; i < troll_names_array.length; i++) {
        if(updating_hash[troll_names_array[i]] === undefined) {
          updating_hash[troll_names_array[i]] = 0;
        }
      }

      chrome.storage.local.set({'troll_names_hash': updating_hash}, (updating_hash)=>{
        dom_manipulating.makeTableReflectSavedTrollNames();
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

      debugger;

        // db.asyncReplaceAllTrollInfo(troll_names_hash, function() {
          // dom_manipulating.addEntryToTrollsTable(troll_name, troll_names_hash[troll_name]);
          // dom_manipulating.updateTotalNamesBlocked();
          // dom_manipulating.updateTotalCommentsBlocked(troll_names_hash[troll_name]);
        // });



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
      <tr class='troll'>
        <td><img class='remove-name' src=${chrome.extension.getURL("images/remove-name.png")}></img></td>
        <td class='troll-name'>${name}</td>
        <td class='comment-counter'>${existing_comments_counter}</td>
      </tr>
    `).insertAfter($('#troll-names-wrapper #table-header'));
   $('#troll-names-wrapper').scrollTop(0);
  },

  // input: ie [name_1, name_2, name_3]               array of troll names to remove from chat
  // return int : {name_1: 2, name_2: 15, name_3: 0}  num of comments of his were deleted in chatroom
  removeExistingCommentsFromNewTrolls: function(troll_name_array) {
    let $all_comments = $('#all-comments .comment') // Look through all  ".comment" but ignoring the last one, because that user text box to chat with. There are no other differentiating tags on it. If I add any they could be removed without me knowing.

    let result = {};
    for(let t of troll_name_array) {
      result[t] = 0;
    }

    $all_comments.each(function() {
      let commenter_name = $(this).find('.author [data-name]').html();

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
    var total = $('#troll-table-wrapper #troll-names-wrapper table img.remove-name').length || 0;

    $('#troll-table-wrapper #troll-names-wrapper #header-name').html(`Name(${total})`);
  },

  // calculated differently than updateTotalNamesBlocked, because if someone removes a troll, then I still want to remember the total amount of comments blocked that are no longer represented in the table.
  updateTotalCommentsBlocked: function(increase_total_by=1) {
    let string = $('#troll-table-wrapper #troll-names-wrapper #header-count').html() || "";
    let current_total = Number.parseInt(string.match(/#\((\d.*)\)/)[1]) || 0;
    let new_total = current_total + increase_total_by;
    $('#troll-table-wrapper #troll-names-wrapper #header-count').html(`#(${new_total})`);
  },

  scrollToBottomOfChatBox: function(){
    var $scroll_box = $('#all-comments').parent();
    $scroll_box.scrollTop($scroll_box[0].scrollHeight);
  },

  exportTrollsNamesToTextbox: function(){
    chrome.storage.local.get('troll_names_hash', (trolls_chrome_extension_info)=>{
      var troll_names_hash = trolls_chrome_extension_info['troll_names_hash'];
      // console.log($('#export-textarea').val(""));

      if(
          trolls_chrome_extension_info['troll_names_hash'] === undefined ||
          ((typeof troll_names_hash == "object" ) && Object.keys(troll_names_hash).length === 0 )
        )
      {
       $('#export-textarea').val("");
      }
      else if( (typeof troll_names_hash == "object" ) && Object.keys(troll_names_hash).length > 0 ) {
        let result = "'" + Object.keys(troll_names_hash).map((b) => { return(b + 'a') } ).join("' '") + "'";
        $('#export-textarea').val(result);
      }
    });
  }
}

// put the widget on the screen
$('.live-chat-widget').append(`
  <div id='troll-extension-wrapper'>
    <div id='troll-table-wrapper'>
      <div id='troll-image-wrapper' droppable='true' ondragover="event.preventDefault();">
      </div>

      <div id='troll-names-wrapper'>
        <table>
          <caption>Blocking Comments</caption>
          <tr id='table-header'>
            <th>x</th>
            <th id='header-name'>Name(0)</th>
            <th id='header-count'>#(0)</th>
          </th>
        </table>
      </div>

      <div><form><input type='button' id='clear-all-comments' value='Clear Chat'</input></form></div>
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

        <textarea id='import-names-textarea' placeholder='paste exported names.'></textarea>
        <div id='import-buttons'>
          <input id='import-close-button' type='button' value='close'>
          <input id='import-names-button' type='button' value='import'>
        </div>
      </form>

      <div id='export-names-wrapper'>
        <label for='export-textarea'>exported names</label>
        <textarea id='export-textarea'></textarea>
        <form id='export-form'>
          <input id='export-close-button' type='button' value='close'>
        </form>
      </div>
    </div>

  </div>
`);

// make all comments visible
$('#all-comments .comment').each(function() {
   $(this).addClass('approved-comment');
});


// populate the trolls table with saved data from a previous session
if(trolls_chrome_extension_info['troll_names_hash'] === undefined) {
  db.asyncReplaceAllTrollInfo({}, ()=>{});
}
else {
  dom_manipulating.makeTableReflectSavedTrollNames();
}

dom_manipulating.scrollToBottomOfChatBox();


// add new troll to list, clear his old comments, and start ignoring new comments
$('#all-comments').on('dragstart', '.yt-thumb-img', function(event) {
  event.dataTransfer = event.originalEvent.dataTransfer;
  let troll_name = this.alt || $(this).closest('.comment').find('.author [data-name]').html();
  event.dataTransfer.setData('troll-name', troll_name);
});


// when a user's image is dragged and dropped onto the troll, save troll to saved chrome.storage and
$('#troll-image-wrapper').on('drop', function(event) {
  event.preventDefault();
  event.dataTransfer = event.originalEvent.dataTransfer; // found this on stack overflow. Only way to make dataTransfer work
  let troll_name = event.dataTransfer.getData('troll-name');

  chrome.storage.local.get('troll_names_hash', function(trolls_chrome_extension_info) {
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
});

// clear chat room
$('#clear-all-comments').on('click', function() {
  dom_manipulating.scrollToBottomOfChatBox();
  $('#all-comments').html('');
});


// remove single troll from list
$('#troll-names-wrapper').on('click', '.remove-name', function(event) {
  var $element_to_delete = $(this).closest('.troll');
  let name = $element_to_delete.find('.troll-name').html();
  $element_to_delete.remove();
  dom_manipulating.updateTotalNamesBlocked();
  db.asyncDeleteTrollNames([name]);
});

// if an incoming comment is written by a troll then remove it and increment the comment_counter of troll
$('#all-comments').on('DOMNodeInserted', function(event) {

  // the chat room doubles up on this comment for when you start sending a comment and when it is done. So ignore the first one
  if(event.target.className.indexOf('sending-in-progress') != -1) {
    return;
  }

  chrome.storage.local.get('troll_names_hash', function(trolls_chrome_extension_info) {
    var troll_names_hash = trolls_chrome_extension_info['troll_names_hash'];

    if( troll_names_hash !== {} && troll_names_hash !== undefined )
    {
      var $comment_element = $(event.target);
      let commenters_name = $comment_element.find(".author [data-name]").html();

      if(commenters_name === undefined) {
        return false;
      }

      if(troll_names_hash[commenters_name] != undefined) {
        troll_names_hash[commenters_name]++;
        $(`.troll:contains(${commenters_name}) > .comment-counter`).html(troll_names_hash[commenters_name]);
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
    $('#import-export-links-wrapper').hide();
    $('#export-names-wrapper').show();
    dom_manipulating.exportTrollsNamesToTextbox();
  });

  // In normal view, click inport button view
  $('#import-names-link').on('click', function (e) {
    $('#import-export-links-wrapper').hide();
    $('#import-names-wrapper').show();
  });

  // In export view, click close button to exit.
  $('#export-names-wrapper #export-close-button').on('click', function () {
    $('#import-export-links-wrapper').show();
    $('#export-names-wrapper').hide();
    $('#export-textarea').val("");
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

    let importing_names_string_with_quotes = $('#import-names-textarea').val();

    // if there is an import string in the
    if(importing_names_string_with_quotes.length > 0) {

      // delete all trolls if overwrite radio button is checked
      if( $("#import-names-radio-wrapper :checked").val() === 'overwrite') {
        db.asyncReplaceAllTrollInfo({}, ()=>{});
        $('#troll-names-wrapper .troll').each(function(idex, element){
          element.remove();
        });
      }

      // get names and remove extra quotes on beginning and end of troll name
      let importing_names_array = $('#import-names-textarea').val().match(/'([^']*)'/g).map(function(troll_name){
        return( troll_name.substr(1, troll_name.length - 2) );
      });

      db.asyncAppendArrayOfTrollNames(importing_names_array);
    }

    $('#import-export-links-wrapper').show();
    $('#import-names-wrapper').hide();
    $('#import-names-textarea').val('');
    $('#append-label').click();
  });
});
