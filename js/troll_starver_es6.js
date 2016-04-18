

  var troll_img_src = chrome.extension.getURL("images/trollx60.png");
  var remove_name_src = chrome.extension.getURL("images/remove-name.png");
  // document.getElementById("someImage").src = imgURL;


  $('#live-comments-controls').append(`

    <div id='troll-extension-wrapper'>
      <div id='troll-image-wrapper' droppable='true' ondragover="event.preventDefault();" ondrop="users_id_url = event.dataTransfer.getData('text');
                            debugger;
                            users_id = users_id_url.match(/channel\/(.+)$/)[1];
                            selector_str = 'a[data-ytid=' + users_id + ']';
                            name = $(selector_str).html();
                            console.warn(name);
                            "
                            >


        <img alt='Drag names of trolls to Ignore' src=${troll_img_src}>
      </div>

      <ul id='troll-names-wrapper'>
        <li class='troll'>
          <img class='remove-name' src=${remove_name_src} onclick="console.warn('remove troll from list')"></img>
          <label data-id='name'>Joser Noonski</label>
          <span data-id='comment-counter'>0</span>
        </li>
      </ul>

      <a id="clear-all-comments" href='#'>clear chat</a>
    </div>
  `)


  // unabtrusive js
  $('#clear-all-comments').on('click', function(){
    event.preventDefault();
    $('all-comments').html('');
  });
