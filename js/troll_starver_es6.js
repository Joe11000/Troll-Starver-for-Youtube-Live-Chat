// reusable db manipulting functions
db = {
  replaceAllTrollInfo: function(entire_hash, callback) {
    chrome.storage.local.set({ 'troll_names_hash': entire_hash }, callback);
    return entire_hash;
  },

  deleteTrollNames: function(troll_names_array) {
    chrome.storage.local.get('troll_names_hash', function (trolls_chrome_extension_info) {

      var updating_hash = trolls_chrome_extension_info['troll_names_hash'];

      for(let i = 0; i < troll_names_array.length; i++) {
        delete updating_hash[troll_names_array[i]];
      }

      chrome.storage.local.set({'troll_names_hash': updating_hash }, function() {}); //here
    });
  }
};

// reusable dom manipulting functions
dom_manipulating = {
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
  }
}



// put the widget on the screen
$('.live-chat-widget').append(`
  <div id='troll-extension-wrapper'>
    <div id='troll-image-wrapper' droppable='true' ondragover="event.preventDefault();">
    </div>

    <div id='troll-names-wrapper'>
      <table>
        <caption>Blocking Comments</caption>
        <tr id='table-header'>
          <th>x</th>
          <th>Name</th>
          <th>#</th>
        </th>
      </table>
    </div>

    <div><button type='button' id='clear-all-comments'>Clear Chat</button></div>
  </div>
`);

// populate the trolls table with saved data from a previous session
chrome.storage.local.get('troll_names_hash', function(trolls_chrome_extension_info) {
  if(trolls_chrome_extension_info['troll_names_hash'] === undefined) {
    db.replaceAllTrollInfo({}, ()=>{});
  }
  else {

    var troll_names_hash = trolls_chrome_extension_info['troll_names_hash'];

    if( (typeof troll_names_hash == "object" ) && Object.keys(troll_names_hash).length > 0 ) {
      let keys = Object.keys(troll_names_hash);
      let current_troll_comments = dom_manipulating.removeExistingCommentsFromNewTrolls(keys);

      for(let i = 0; i < keys.length; i++) {
        troll_names_hash[keys[i]] = current_troll_comments[keys[i]] || 0;
        dom_manipulating.addEntryToTrollsTable(keys[i], troll_names_hash[keys[i]]);
      }

      db.replaceAllTrollInfo(troll_names_hash, ()=>{});
    }
  }
});

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

      db.replaceAllTrollInfo(troll_names_hash, function() {
        dom_manipulating.addEntryToTrollsTable(troll_name, troll_names_hash[troll_name]);
      });
    }
  });
});

// clear chat room
$('#clear-all-comments').on('click', function() {
  $('#all-comments').html('');
});


// click the remove image to remove that troll from list
$('#troll-names-wrapper').on('click', '.remove-name', function(event) {
  var $element_to_delete = $(this).closest('.troll');
  let name = $element_to_delete.find('.troll-name').html();
  $element_to_delete.remove();
  db.deleteTrollNames([name]);
});


// after new comment is appended remove comments by trolls, then increment the comment_counter of troll
$('#all-comments').on('DOMNodeInserted', function(event) {

  // the chat room doubles up on this comment for when you start sending a comment and when it is done. So ignore the first one
  if(event.target.className.indexOf('sending-in-progress') != -1) {
    return;
  }

  chrome.storage.local.get('troll_names_hash', function(trolls_chrome_extension_info) {
    var troll_names_hash = trolls_chrome_extension_info['troll_names_hash'];

    if( Object.keys(troll_names_hash).length > 0 )
    {
      var $comment_element = $(event.target);
      let blocked_names = Object.keys(troll_names_hash);
      let commenters_name = $comment_element.find(".author [data-name]").html();

      if(commenters_name === undefined) {
        return false;
      }

      let index_of_troll_in_blocked_names = blocked_names.indexOf(commenters_name);

      if(index_of_troll_in_blocked_names >= 0) {
        troll_names_hash[blocked_names[index_of_troll_in_blocked_names]]++;
        $(`.troll:contains(${commenters_name}) > .comment-counter`).html(troll_names_hash[commenters_name]);
        $comment_element.remove();

        db.replaceAllTrollInfo(troll_names_hash, ()=>{})
      }
    }
  });
});
