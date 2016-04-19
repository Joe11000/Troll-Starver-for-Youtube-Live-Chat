if($('#troll-extension-wrapper').length == 0) {

  var troll_img_src = chrome.extension.getURL("images/trollx60.png");
  var remove_name_src = chrome.extension.getURL("images/remove-name.png");
  // document.getElementById("someImage").src = imgURL;


  $('#live-comments-controls').append(`

    <div id='troll-extension-wrapper'>
      <div id='troll-image-wrapper' droppable='true' ondragover="event.preventDefault();">


        <img alt='Drag names of trolls to Ignore' src=${troll_img_src}>
      </div>

      <table id='troll-names-wrapper'>
        <caption>Blocking Comments</caption>
        <tr id='table-header'>
          <th></th>
          <th>Name</th>
          <th>#</th>
        </th>
      </table>

      <button type='button' id='clear-all-comments'>Clear Chat</button>
    </div>
  `)


  // unabtrusive js

    window.troll_names_hash = {};


    // clear chat room
    $('#clear-all-comments').on('click', function(){
      $('#all-comments').html('');
    });

    // input name of troll
    // return int : # of comments of his were deleted in chatroom
    function removeExistingCommentsFromNewTroll(troll_name) {

      let $all_comments = $('#all-comments .comment') // Look through all  ".comment" but ignoring the last one, because that user text box to chat with. There are no other differentiating tags on it. If I add any they could be removed without me knowing.
      let comments_counter = 0;

      $all_comments.each(function(element, index){
        if( $(this).find('.author [data-name]').html() === troll_name )
        {
          comments_counter++;
          $(this).remove();
        }
      });

      return comments_counter;
    }

    function addTrollToList(name, existing_comments_counter=0){
       $(`
          <tr class='troll'>
            <td><img class='remove-name' src=${remove_name_src}></img></td>
            <td class='troll-name'>${name}</td>
            <td class='comment-counter'>${existing_comments_counter}</td>
          </tr>
        `).insertAfter($('#troll-names-wrapper #table-header'));
       $('#troll-names-wrapper').scrollTop(0);
    }

    function removeTrollFromList(dom_element){
      let name = $(dom_element).find('.troll_name').html();
      $(dom_element).closest('li.troll').remove();
      delete window.troll_names_hash[name]
    }

    function isTrollAlreadyInList(name) {
      return( Object.keys(window.troll_names_hash).indexOf(name) !== -1 )
    }

    // add new troll to list, clear his old comments, and start ignoring new comments
    $('#all-comments').on('dragstart', '.yt-thumb-img', function(event){
      event.dataTransfer = event.originalEvent.dataTransfer;
      let troll_name = this.alt || $(this).closest('.comment').find('.author [data-name]').html();
      event.dataTransfer.setData('troll-name', troll_name)
    });

    $('#troll-image-wrapper').on('drop', function(event){
      event.preventDefault();
      event.dataTransfer = event.originalEvent.dataTransfer; // found this on stack overflow. Only way to make dataTransfer work
      let troll_name = event.dataTransfer.getData('troll-name')

      if(isTrollAlreadyInList(troll_name) === false){
        window.troll_names_hash[troll_name] = 0; // make sure no additional comments added from troll while removing other comments
        window.troll_names_hash[troll_name] = removeExistingCommentsFromNewTroll(troll_name) || 0;
        addTrollToList(troll_name, window.troll_names_hash[troll_name]);
      }
    });

    // click the remove image to remove that troll from list
    $('#troll-names-wrapper').on('click', '.remove-name', function(event){
      removeTrollFromList(this);
    });


  // after new comment is appended remove comments by trolls, then increment the comment_counter of troll
  $('#all-comments').bind('DOMNodeInserted', function(event) {
    if( Object.keys(window.troll_names_hash).length > 0 )
    {
      var $comment_element = $(event.target);
      let blocked_names = Object.keys(window.troll_names_hash);
      for(let blocked_name of blocked_names)
      {
        if($comment_element.find(".author [data-name]").html() === blocked_name) {
          window.troll_names_hash[blocked_name] +=1;
          $(`.troll:contains(${blocked_name}) > .comment-counter`).html(window.troll_names_hash[blocked_name]);
          $comment_element.remove();
        }
      }
    }
  });

}

// chrome.storage.sync.set({'value': theValue}, function() {
//   // Notify that we saved.
//   message('Settings saved');
// });

  // save users added as trolls to internalStorage if they want info saved, otherwise just to window.troll_names_hash

