
var websocketConnection = new WebSocket("wss://guident.bluepepper.us:8848");

websocketConnection.onopen = function(evt) {
  console.log("JsFiddleWssCallingExample::_onWssConnectionOpen(): CONNECTED!");
  /* var msg = "This is the calling side." */
  /* console.log("JsFiddleWssCallingExample::_onWssConnectionOpen(): Sending this to the callee side: " + msg + ".") */
  /* websocketConnection.send(msg) */
}


websocketConnection.onmessage = function(evt) {

	var obj = JSON.parse(evt.data);
	onOfferReceived(obj.sdp);
}

websocketConnection.onclose = function(evt) {
  console.log("JsFiddleWssCallingExample::_onWssConnectionClose(): Code: " + evt.code + " Reason: " + evt.reason + " Clean?: " + evt.wasClean);
}

websocketConnection.onerror = function(evt) {
  console.log("JsFiddleWssCallingExample::_onWssConnectionError(): " + evt);
}



var pc = null;
var localMediaStreams = null;
var localAudioVideo = null
var localVideo = null
var localVideoSecond = null

var remoteVideoStream = null;


async function mikemadethis() {
        localMediaStreams = await navigator.mediaDevices.getUserMedia({audio: true, video: true});

	var tracks = localMediaStreams.getTracks();

	tracks.forEach((track) => {
		var trackSettings = track.getSettings();
		console.log("ID: <<" + track.id + ">> Kind: <<" + track.kind + ">> Label: <<" + track.label + ">> DeviceId: <<" + trackSettings.deviceId + ">>");

	});

}



async function getLocalMediaStreams() {
	localAudioVideo = await navigator.mediaDevices.getUserMedia({audio: true, video: true});
	localVideo = await navigator.mediaDevices.getUserMedia({audio:false, video:true})
	localVideosecond = await navigator.mediaDevices.getUserMedia({audio:false, video:true})
	
		
}


//getLocalMediaStreams();
mikemadethis();


const configuration = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}], 'bundlePolicy': 'max-bundle'};

pc = new RTCPeerConnection(configuration);


function onOfferReceived(offer) {

	var constraints = {
                video: true,
                audio: true,
	};

	pc.ontrack = function(ev) {

		console.log("pc.ontrack(): Got a track! Id: <<" + ev.track.id + ">> Kind: <<" + ev.track.kind + ">> Mid: <<" + ev.transceiver.mid + ">> Label: <<" + ev.track.label + ">> Streams Length: <<" + ev.streams.length + ">>" );

		//console.log("pc.ontrack(): Got a track! Id: <<" + ev.track.id + ">> Kind: <<" + ev.track.kind + ">> Mid: <<" + ev.transceiver.mid + ">> Label: <<" + ev.track.label + ">> Streams length: <<" + ev.streams.length + ">> Stream Id: <<" + ev.streams[0].id + ">> #Tracks in stream: <<" + ev.streams[0].getTracks().length + ">>" );

		if ( ev.transceiver.mid == "0" ) {
			if ( remoteVideoStream == null ) {
				remoteVideoStream = new MediaStream([ ev.track ]);
                        	console.log("New stream id: <<" + remoteVideoStream.id + ">> # tracks: " + remoteVideoStream.getTracks().length + " New stream.");
			} else {
				pc.addTrack(ev.track, remoteMediaStream);
                        	console.log("New stream id: <<" + remoteVideoStream.id + ">> # tracks: " + remoteVideoStream.getTracks().length);
			}
		}

		if ( ev.transceiver.mid == "1" ) {
			if ( remoteVideoStream == null ) {
				remoteVideoStream = new MediaStream([ ev.track ]);
                        	console.log("New stream id: <<" + remoteVideoStream.id + ">> # tracks: " + remoteVideoStream.getTracks().length + " New stream.");
			} else {
				remoteVideoStream.addTrack(ev.track);
                        	console.log("New stream id: <<" + remoteVideoStream.id + ">> # tracks: " + remoteVideoStream.getTracks().length);
			}
                        document.getElementById("videoStream").srcObject = remoteVideoStream;
                } 
	}


	localAudioVideo.getTracks().forEach(track => pc.addTransceiver(track, { direction: "sendrecv" }));
	// localMediaStreams.getTracks().forEach(track => pc.addTrack(track, localMediaStreams));
    pc.addTransceiver("video", { direction: "sendonly" } );
	pc.addTransceiver("video", { direction: "sendonly" } );
	

	pc.onicecandidate = function(iceevt) {
		if ( iceevt.candidate == null ) {
			console.log("pc.onicecandidate(): Completed!");
			//sendAnswerToCaller();
			waitTwoSeconds();
		} else {
			console.log("pc.onicecandidate(): Got an ice candidate: <<" + iceevt.candidate.candidate + ">>");
		}
	};

	console.log("onOfferReceived(): Setting received offer as remote description.");
	console.log("onOfferReceived(): OFFER: " + JSON.stringify(offer) + ">>");
	pc.setRemoteDescription(offer).then(function() {
		console.log("onOfferReceived(): Creating local answe SDP.");
		pc.createAnswer().then(function(description) {
			console.log("onStartPressed(): Answer SDP has been created. Setting it as local descript tio the PC.");
			pc.setLocalDescription(description);
		});
	});

}


function waitTwoSeconds() {
	setTimeout(sendAnswerToCaller, 2000);
}


function sendAnswerToCaller() {

	var msg = { sdp: pc.localDescription };

	websocketConnection.send(JSON.stringify(msg));

}






