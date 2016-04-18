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

    window.troll_names = {};


    // clear chat room
    $('#clear-all-comments').on('click', function(){
      event.preventDefault();
      $('all-comments').html('');
    });

    function removeExistingCommentsFromNewTroll(dom_element){
      $trolls_existing_comments = $('#all-comments').find(`.comment:contains(${dom_element.alt})`)

      comments_counter = $trolls_existing_comments.length
      $trolls_existing_comments.remove();

      return comments_counter;
    }

    function addTrollToList(name, existing_comments_counter=0){
       $('#troll-names-wrapper').append(`
          <li class='troll'>
            <img class='remove-name' src=${remove_name_src} onclick="console.warn('remove troll from list')"></img>
            <label data-id='name'>${name}</label>
            <span data-id='comment-counter'>${existing_comments_counter}</span>
          </li>
        `);
    }

    function removeTrollFromList(dom_element){
      $(dom_element).closest('li.troll').remove();
      console.warn("Still have to : Allow person's comments to be seen now + reset persons comment counter")
    }

    function isTrollAlreadyInList(name) {
      return( Object.keys(window.troll_names).indexOf(name) !== -1 )
    }

    // add new troll to list, clear his old comments, and start ignoring new comments
    $('#all-comments').on('dragend', '.yt-thumb-img', function(event){
      event.preventDefault();
      var troll_name = this.alt
      if(isTrollAlreadyInList(troll_name) === false){
        window.troll_names[troll_name] = 0; // make sure no additional comments added from troll while removing other comments
        window.troll_names[troll_name] = removeExistingCommentsFromNewTroll(this) || 0;
        addTrollToList(troll_name, window.troll_names[troll_name]);
      }
    });

    // click the remove image to remove that troll from list
    $('ul#troll-names-wrapper').on('click', '.remove-name', function(event){
      removeTrollFromList(this);
    });


    // save users added as trolls to internalStorage if they want info saved, otherwise just to window.troll_names



}


  // // after new comment is appended remove comments by trolls, then increment counter of troll
  // $('#all-comments').bind('DOMNodeInserted', function(e) {
  //     var $e = $(e.target);

  //     for(var i = 0; i < troll_names.length; i++)
  //     {
  //       if($e.find(`.author:contains${troll_names[i]}`)) {
  //         // $e.remove();
  //       }
  //     }
  // });
