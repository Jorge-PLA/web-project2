
document.addEventListener('DOMContentLoaded', function() {

  // check if there is a nickname in the storage, if not ask for it and save it
  if (!localStorage.getItem('nickname')) {
    document.querySelector('#beginning').onsubmit = function() {
      let nickname = document.querySelector('#nickname').value;
      localStorage.setItem('nickname', nickname);
      const actual = "# General";
      localStorage.setItem('last_channel', actual);
    }
  }
  else {
    let x = document.querySelector('#cardnick');
    x.style.display = "none";
    document.querySelector('#welcome').innerHTML = "Welcome " + localStorage.getItem('nickname');
  }

    //load all the channels that have been registered
    //Inialize a new request
    const request = new XMLHttpRequest();
    request.open('POST', '/load_channels');

    //callback function when request completes
    request.onload = () => {
      const channels = JSON.parse(request.responseText);
      channels.forEach(add_channel);
      //Get acces to the last channel
      document.getElementById((localStorage.getItem('last_channel'))).click();
    }


    //Send request
    request.send();

  //add channel to the list
  function add_channel(contents) {

    //Create a new channel
    const channel = document.createElement('li');
    channel.className = 'channel';

    const a_channel = document.createElement('a');
    a_channel.href = contents;
    a_channel.id = contents;
    a_channel.textContent = contents;

    channel.appendChild(a_channel);

    //Add channel to DOM
    document.querySelector('#channels').append(channel);

    //Add channel to the array of selected elements
    change();

  }

  // By default, create channel button is disabled
  document.querySelector('#submit_newch').disabled = true;
  // Enable button only if there is text in the input field
  document.querySelector('#new_channel').onkeyup = () => {
    if (document.querySelector('#new_channel').value.length > 0)
      document.querySelector('#submit_newch').disabled = false;
    else
      document.querySelector('#submit_newch').disabled = true;
  };

  //Create a new channel
  document.querySelector('#create_channel').onsubmit = () => {

      //Inialize a new request
      const request = new XMLHttpRequest();
      const new_channel = document.querySelector("#new_channel").value;

      request.open('POST', '/create');

      //callback function when request completes
      request.onload = () => {
        const new_channel = (request.responseText);
        if (request.readyState == 4 && request.status == 204) {
          alert("this channel has been created before")
        }

        else {
          add_channel(new_channel);
        }
      }

      //Add data to send with request
      const data = new FormData();
      data.append('new_channel', new_channel);

      //Send request
      request.send(data);
      return false
    }

    document.querySelector("#action_menu").onclick = () => {

      document.getElementById("sidenav").classList.remove('d-none');
    }


      // Template for messages results
      const template = Handlebars.compile(document.querySelector('#result').innerHTML);

      //Fucntion to compare who send the message in handlebars
      Handlebars.registerHelper('if_eq', function(a, opts) {
        if(a === localStorage.getItem('nickname'))
          return opts.fn(this);
        else
          return opts.inverse(this);
      });





      change();



      // Function to load all the messages when a channel is selected
      function change() {
        document.querySelectorAll('.channel').forEach(function(a) {
          a.addEventListener("click", function () {
            const request = new XMLHttpRequest();
            const current_channel = a.textContent;
            //change title in the chat
            change_title(current_channel);

            //change last channel visited
            localStorage.setItem('last_channel', current_channel)
            request.open('POST', '/load_messages');

            request.onload = () => {
              //Add message results to DOM.
              const msg = JSON.parse(request.responseText);
              const content = template({'values': msg});
              document.querySelector('#chatbody').innerHTML = content;


              push_content(current_channel, content);

            };

            const data = new FormData();
            data.append('current_channel', current_channel);

            //send request
            request.send(data);
            localStorage.setItem('last_channel', current_channel);
          })

        })
      };



    //code for the socket and send the messages in real time

      //Connect to websocket
      var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

      //When connected, configurates messages
      socket.on('connect', () => {

        // The send button should emit a "send msg" event
        document.querySelector('#send_button').onclick = () => {
          const nickname = localStorage.getItem('nickname');
          const msg = document.querySelector('#text_msg').value;
          document.querySelector('#text_msg').value = "";
          const msg_time = time();
          socket.emit('send msg', {'nickname': nickname, 'msg': msg, 'msg_time': msg_time});
        };
      });

      //When a new msg is sent, add it to the channel´s mssg
      socket.on('sent msg', sender => {
        //Add message results to DOM.
        const msg = sender;
        const content = template({'values': msg});
        document.querySelector('#chatbody').innerHTML += content;
      });

      //When connected, configurates attach img
      socket.on('connect', () => {

        //The attach_btn should emit a "send img" event
        document.querySelector('#file-input').addEventListener("change", e => {
          const nickname = localStorage.getItem('nickname');
          const msg_time = time();
          var file = e.target.files[0];
          var reader = new FileReader();

          reader.readAsDataURL(e.target.files[0]);
          reader.onload = function(evt) {
            const img = new Image();
            img.src = evt.target.result;
            var mock = img.src;

            img.onload = () => {
              image = new Image();
              image.src = mock;
              var base64 = resize(image, 150, 100, 0.6);
              const msg = `${'<img src="' + base64 + '"/>'} `
              socket.emit('send img', {'nickname': nickname, 'msg': msg, 'msg_time': msg_time});
            }
          }

        })
      });

});

function closeNav() {
  document.querySelector('#sidenav').classList.add('d-none');
}

//function to get the current time
function time() {
  let today = new Date();
  let date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
  let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  let dateTime = date+' '+time;
  return dateTime;
}

function change_title(title) {
  document.querySelector("#title_channel").innerHTML = title;
}

//Push state to URl
function push_content(current_channel, content) {
  document.title = current_channel;
  history.pushState({'title': current_channel, 'content': content}, current_channel, current_channel);
}


// Helper function from https://github.com/SashaRadovic/project2/blob/master/static/index.js
//resize images and convert to base64

  function resize(image, width, height, quality) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    ctx.drawImage(image, 0, 0, width, height);
    const resFile = ctx.canvas.toDataURL("image/jpeg", quality);

    return resFile;
  }
