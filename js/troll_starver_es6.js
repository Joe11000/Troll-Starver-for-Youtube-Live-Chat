if($('#troll-extension-wrapper').length == 0) {

  var troll_img_src = chrome.extension.getURL("images/trollx60.png");
  var remove_name_src = chrome.extension.getURL("images/remove-name.png");
  // document.getElementById("someImage").src = imgURL;


  $('#live-comments-controls').append(`

    <div id='troll-extension-wrapper'>
      <div id='troll-image-wrapper' droppable='true' ondragover="event.preventDefault();">


        <img alt='Drag names of trolls to Ignore' src=${troll_img_src}>
      </div>

      <ul id='troll-names-wrapper'>
        <li class='troll'>
            <img class='remove-name' src=${remove_name_src}></img>
            <label data-id='name'>here</label>
            <span data-id='comment-counter'>0</span>
          </li>
      </ul>

      <div id='clear-all-comments-wrapper'>
        <a id="clear-all-comments" href='#'>clear chat</a>
      </div>
    </div>
  `)


  // unabtrusive js

    // clear chat room
    $('#clear-all-comments').on('click', function(){
      event.preventDefault();
      $('all-comments').html('');
    });

    function removeExistingCommentsFromNewTroll(dom_element){
      debugger
      return 5;
    }

    function addTrollToList(name, existing_comments=0){
       $('#troll-names-list').append(`
          <li class='troll'>
            <img class='remove-name' src=${remove_name_src} onclick="console.warn('remove troll from list')"></img>
            <label data-id='name'>${name}</label>
            <span data-id='comment-counter'>0</span>
          </li>
        `);
    }

    function removeTrollFromList(dom_element){
      $(dom_element).closest('li.troll').remove();
      console.warn("Still have to : Allow person's comments to be seen now + reset persons comment counter")
    }


    // add new troll to list, clear his old comments, and start ignoring new comments
    $('#all-comments').on('dragend', '.yt-thumb-img', function(event){
      event.preventDefault();
      var number_of_existing_comments = removeExistingCommentsFromNewTroll(this) || 0;
      addTrollToList(this.alt);
    });

    $('ul#troll-names-wrapper').on('click', '.remove-name', function(event){
      removeTrollFromList(dom_element);
    });




    // save users added as trolls to internalStorage

    // after new comment is appended remove comments by trolls, then increment counter of troll


}
