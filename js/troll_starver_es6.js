if(document.getElementById('troll-extension-wrapper') === null) {



  chrome.storage.local.get('troll_names_hash', function(trolls_chrome_extension_info) {
    if(trolls_chrome_extension_info === null)
      chrome.storage.local.set({'troll_names_hash': troll_names_hash }, function(){});
  });


  // put the widget on the screen
  $('.live-chat-widget').append(`

    <div id='troll-extension-wrapper'>
      <div id='troll-image-wrapper' droppable='true' ondragover="event.preventDefault();">
      </div>

      <div id='troll-names-wrapper'>
        <table>
          <caption>Blocking Comments</caption>
          <tr id='table-header'>
            <th></th>
            <th>Name</th>
            <th>#</th>
          </th>
        </table>
      </div>

      <button type='button' id='clear-all-comments'>Clear Chat</button>
    </div>
  `);



  function getSavedinfoAndDo(func){
    chrome.storage.local.get('troll_names_hash', function(trolls_chrome_extension_info) {
      func(trolls_chrome_extension_info['troll_names_hash']);
    });
  }

  function replaceAllSavedInfo(entire_hash){
    chrome.storage.local.set({'troll_names_hash': entire_hash })
    return entire_hash;
  }

  //
  function deleteSavedInfo(troll_names_array){
    chrome.storage.local.get('troll_names_hash', function (trolls_chrome_extension_info) {

      var updating_hash = trolls_chrome_extension_info['troll_names_hash']

      for(let i = 0; i < troll_names_array.length; i++){
        delete updating_hash[troll_names_array[i]]
      }

      chrome.storage.local.set({'troll_names_hash': updating_hash }, function(){}) //here
    });
  }


  function addTrollToList(name, existing_comments_counter=0){
     $(`
        <tr class='troll'>
          <td><img class='remove-name' src=${chrome.extension.getURL("images/remove-name.png")}></img></td>
          <td class='troll-name'>${name}</td>
          <td class='comment-counter'>${existing_comments_counter}</td>
        </tr>
      `).insertAfter($('#troll-names-wrapper #table-header'));
     $('#troll-names-wrapper').scrollTop(0);
  }



  // populate the trolls table with saved data from a previous session
  chrome.storage.local.get('troll_names_hash', function(trolls_chrome_extension_info) {

    if(trolls_chrome_extension_info['troll_names_hash'] === undefined) {
      chrome.storage.local.set({'troll_names_hash': {} }, function(){});
    }
    else {

      let troll_names_hash = trolls_chrome_extension_info['troll_names_hash'];

      if( (typeof troll_names_hash == "object" ) && Object.keys(troll_names_hash).length > 0 ) {
        let keys = Object.keys(troll_names_hash)
        let current_troll_comments = removeExistingCommentsFromNewTrolls(keys);

        for(let i = 0; i < keys.length; i++)
        {
          troll_names_hash[keys[i]] = current_troll_comments[keys[i]] || 0;
          addTrollToList(keys[i], troll_names_hash[keys[i]]);
        }

        chrome.storage.local.set({'troll_names_hash': troll_names_hash }, function(){});
      }
    }
  });

  // add new troll to list, clear his old comments, and start ignoring new comments
  $('#all-comments').on('dragstart', '.yt-thumb-img', function(event){
    event.dataTransfer = event.originalEvent.dataTransfer;
    let troll_name = this.alt || $(this).closest('.comment').find('.author [data-name]').html();
    event.dataTransfer.setData('troll-name', troll_name)
  });


  // input: ie [name_1, name_2, name_3]               array of troll names to remove from chat
  // return int : {name_1: 2, name_2: 15, name_3: 0}  num of comments of his were deleted in chatroom
  function removeExistingCommentsFromNewTrolls(troll_name_array) {
    let $all_comments = $('#all-comments .comment') // Look through all  ".comment" but ignoring the last one, because that user text box to chat with. There are no other differentiating tags on it. If I add any they could be removed without me knowing.

    let result = {}
    for(let t of troll_name_array)
    {
      result[t] = 0
    }

    $all_comments.each(function(){
      let commenter_name = $(this).find('.author [data-name]').html();

      let commenter_index_in_troll_array = troll_name_array.indexOf(commenter_name)
      if( commenter_index_in_troll_array != -1)
      {
        result[commenter_name]++;
        $(this).remove();
      }
    });

    return result;
  }

  // when a user's image is dragged and dropped onto the troll, save troll to saved chrome.storage and
  $('#troll-image-wrapper').on('drop', function(event){
    event.preventDefault();
    event.dataTransfer = event.originalEvent.dataTransfer; // found this on stack overflow. Only way to make dataTransfer work
    let troll_name = event.dataTransfer.getData('troll-name')

    getSavedinfoAndDo(function(troll_names_hash){
      if(troll_names_hash[troll_name] === undefined){
        // save with real number of comments removed
        troll_names_hash[troll_name] = removeExistingCommentsFromNewTrolls([troll_name])[troll_name] || 0
        chrome.storage.local.set({'troll_names_hash': troll_names_hash }, function(){
          addTrollToList(troll_name, troll_names_hash[troll_name]);
        });
      }
    });
  });

  // clear chat room
  $('#clear-all-comments').on('click', function(){
    $('#all-comments').html('');
  });


  //*
  // click the remove image to remove that troll from list
  $('#troll-names-wrapper').on('click', '.remove-name', function(event){
    var $element_to_delete = $(this).closest('.troll');
    let name = $element_to_delete.find('.troll-name').html();
    $element_to_delete.remove();
    deleteSavedInfo([name]);
  });


  // after new comment is appended remove comments by trolls, then increment the comment_counter of troll
  $('#all-comments').on('DOMNodeInserted', function(event) {

    // the chat room doubles up on this comment for when you start sending a comment and when it is done. So ignore the first one
    if(event.target.className.indexOf('sending-in-progress') != -1) {
      return;
    }

    getSavedinfoAndDo(function(troll_names_hash) {

      if( Object.keys(troll_names_hash).length > 0 )
      {
        var $comment_element = $(event.target);
        let blocked_names = Object.keys(troll_names_hash);
        let commenters_name = $comment_element.find(".author [data-name]").html()

        if(commenters_name === undefined)
          {return false;}

        let index_of_troll_in_blocked_names = blocked_names.indexOf(commenters_name);

        if(index_of_troll_in_blocked_names >= 0) {
          troll_names_hash[blocked_names[index_of_troll_in_blocked_names]]++;
          $(`.troll:contains(${commenters_name}) > .comment-counter`).html(troll_names_hash[commenters_name]);
          $comment_element.remove();
          chrome.storage.local.set({'troll_names_hash': troll_names_hash }, function(){});
        }
      }
    });
  });
}
