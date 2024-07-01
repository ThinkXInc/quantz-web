var WORKER_PATH = 'js/lib/Recorderjs/recorderWorker.js';

function __log(e, data) {
  document.getElementById("log").innerHTML = "\n" + e + " " + (data || '');
  console.log(document.getElementById("log"));
}

var audio_context;
var recorder;
var processing = false;

function startUserMedia(stream) {
  var input = audio_context.createMediaStreamSource(stream);
  __log('Media stream created.');
  
  input.connect(audio_context.destination);
  __log('Input connected to audio context destination.');
  
  recorder = new Recorder(input);
  __log('Audio Interface initialized.');
}

function startRecording($button) {
  $yourname = $("#yourname");
  if(isToken){
  	if($yourname.hasClass("check")){
  		$yourname.toggleClass("check");
  	}
  	$button.val("Done");
  	recorder && recorder.record();
  	__log('Runing...');
  }else{
  	__log('The connection could not be established');
  	if(!$yourname.hasClass("check")){
  		$yourname.toggleClass("check");
  	}
  }
}

function stopRecording($button) {
  $button.val("Start Detection");
  recorder && recorder.stop();
  __log('Exit');
  
  // create WAV download link using audio data blob
  createDownloadLink();
  
  recorder.clear();
}

function createDownloadLink() {
  recorder && recorder.exportWAV(function(blob) {
    var url = URL.createObjectURL(blob);
    var li = document.createElement('li');
    var au = document.createElement('audio');
    var hf = document.createElement('a');
    
    au.controls = true;
    au.src = url;
    hf.href = url;
    hf.download = new Date().toISOString() + '.wav';
    hf.innerHTML = hf.download;
    li.appendChild(au);
    li.appendChild(hf);
    recordingslist.appendChild(li);
  });
}

function isToken(){
	console.log($("#token").val());
  	if($("#token").val().length > 0){
  		return true
  	}else{
  		return false 
  	}
}

$(function() {
  if(isToken() && !$("#yourname").is(':hidden')){
  		__log('session found'); 
        whatToDoWhenSessionFound();
  		createChannel();
  }else{
  		__log('session not found'); 
  }
});

var COLOR_CODE_GREEN = '#008080'
var COLOR_CODE_GREEN_YELLOW = '#00ff7f'
var COLOR_CODE_YELLOW = '#ffff00'
var COLOR_CODE_ORANGE = '#ffa500'
var COLOR_CODE_PINK = '#ff00ff'
var COLOR_CODE_RED = '#ff0000'

function createChannel(){
  channel = new goog.appengine.Channel($("#token").val());
  socket = channel.open();
  socket.onopen = function (e){
  	__log("socket opened");
  }
  socket.onmessage = function (message){
	data = JSON.parse(message.data);
    actionWhenReceivedData(data);
  }
  socket.onerror = function (err){
  	__log("socket error "+err);
  }
  socket.onclose = function (){
  	__log("socket close");
  }
}

function actionWhenReceivedData(data){
	console.log(data);
	console.log(data.F0);
	console.log(data.TS);
	console.log(data.MV);
	showResults(data.F0,data.TS,data.MV);
}

function showResults(F0,TS,MV){
  if(processing){
    if(TS != null){
  	__log("level "+TS+" detected");
    }
    if(MV <= 1200){
      Demo.changeOrbits(10);
    }else if(MV > 2000){
      Demo.changeOrbits(45);
    }else{
      Demo.changeOrbits(((MV-1200)/800)*30+10);
    }
    if(TS < 50){
  	Demo.setColor(COLOR_CODE_GREEN);
    }else if(TS >= 50 && TS < 52){
  	Demo.setColor(COLOR_CODE_GREEN_YELLOW);
    }else if(TS >= 53 && TS < 55){
  	Demo.setColor(COLOR_CODE_YELLOW);
    }else if(TS >= 55 && TS < 58){
  	Demo.setColor(COLOR_CODE_ORANGE);
    }else if(TS >= 58 && TS < 61){
  	Demo.setColor(COLOR_CODE_PINK);
    }else if(TS >= 61){
  	Demo.setColor(COLOR_CODE_RED);
    }
  }
}

function whatToDoWhenSessionFound(){
    $("#yourname").hide();
    $("#user_name_display").text('Hello '+$("#user_name").val());
}

window.onload = function init() {
  try {
    // webkit shim
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
    window.URL = window.URL || window.webkitURL;
    
    audio_context = new AudioContext;
    __log('Audio context set up.');
    __log('navigator.getUserMedia ' + (navigator.getUserMedia ? 'available.' : 'not present!'));
  } catch (e) {
    alert('No web audio support in this browser!'+e);
  }
  
  navigator.getUserMedia({audio: true}, startUserMedia, function(e) {
    __log('No live audio input: ' + e);
  });

  
  $('#start').click(function(){
  	console.log($("#token").val().length);
  	if(isToken()){
  		if(!$("#yourname").is(':hidden')){
          whatToDoWhenSessionFound();
  		}
  		//connection established -> start recording
  		if(recorder !== undefined){
    		$(this).toggleClass("on");
  			if($(this).hasClass("on")){
   			 	//on
  				Demo.changeOrbits(10);
    			startRecording($(this));
  				processing = true;
    		}else{
    			//off
  				Demo.setRandomColor();
  				Demo.changeOrbits(30);
    			stopRecording($(this));
  				processing = false;
   			 }
  		 }else{
  		    __log('please turn your microphone on');
  		 }
  	}else{
  		//connection not established -> send name
  		if($("#yourname").val().length == 0){
  			__log('input your name!');
  			
  		}else if($("#yourname").val().length < 50){	
  			$.post("/getToken",$("#yourname").val(),
  				function(responseData){
  					console.log('response '+responseData);
					__log('user successfully recognized')
                    responseObject = JSON.parse(responseData);
  					$("#token").val(responseObject.token);
                    $("#user_name").val(responseObject.name);
  				    whatToDoWhenSessionFound();
  				}
  			);
  		}else{
  			__log('this name is too long!');

  		}
  	}
  });
  $('#start').hover(
  	function(){ //on
  	  if(!processing){
  	    Demo.setColor('#000');
  	    Demo.changeOrbits(10);
  	  }
  	},
  	function(){ //out
  	  if(!processing){
  	    Demo.setRandomColor();
  	    Demo.changeOrbits(30);
  	  }
  	}
  );
};




const canvas = document.getElementById('container');
const ctx = canvas.getContext('2d');

// Draw a red rectangle for demonstration purposes
ctx.fillStyle = 'red';
ctx.fillRect(0, 0, canvas.width, canvas.height);

// Clip the canvas content to have rounded corners
const radius = 25; // This should match the CSS border-radius
ctx.clearRect(0, 0, canvas.width, canvas.height);
ctx.beginPath();
ctx.moveTo(radius, 0);
ctx.lineTo(canvas.width - radius, 0);
ctx.quadraticCurveTo(canvas.width, 0, canvas.width, radius);
ctx.lineTo(canvas.width, canvas.height - radius);
ctx.quadraticCurveTo(canvas.width, canvas.height, canvas.width - radius, canvas.height);
ctx.lineTo(radius, canvas.height);
ctx.quadraticCurveTo(0, canvas.height, 0, canvas.height - radius);
ctx.lineTo(0, radius);
ctx.quadraticCurveTo(0, 0, radius, 0);
ctx.closePath();
ctx.clip();

// Redraw the red rectangle, now with clipped rounded corners
ctx.fillStyle = 'red';
ctx.fillRect(0, 0, canvas.width, canvas.height);