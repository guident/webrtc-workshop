
var websocketConnection = new WebSocket("wss://guident.bluepepper.us:8848");

websocketConnection.onopen = function(evt) {
  console.log("JsFiddleWssCallingExample::_onWssConnectionOpen(): CONNECTED!");
  /* var msg = "This is the calling side." */
  /* console.log("JsFiddleWssCallingExample::_onWssConnectionOpen(): Sending this to the callee side: " + msg + ".") */
  /* websocketConnection.send(msg) */
}


websocketConnection.onmessage = function(evt) {
	
	var obj = JSON.parse(evt.data);
	onAnswerReceived(obj.sdp);
}

websocketConnection.onclose = function(evt) {
  console.log("JsFiddleWssCallingExample::_onWssConnectionClose(): Code: " + evt.code + " Reason: " + evt.reason + " Clean?: " + evt.wasClean);
}

websocketConnection.onerror = function(evt) {
  console.log("JsFiddleWssCallingExample::_onWssConnectionError(): " + evt);
}



var pc = null;
var localMediaStreams = null;

var remoteAudioStream = null;
var remoteVideoStream1 = null;
var remoteVideoStream2 = null;
var remoteVideoStream3 = null;

async function getLocalMediaStreams() {
        localMediaStreams = await navigator.mediaDevices.getUserMedia({audio: true, video: false});
}


getLocalMediaStreams();





function onStartPressed() {


	//const configuration = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}], 'bundlePolicy': 'max-bundle' };
	const configuration = {'iceServers': [{'urls': 'stun:stun.bluepepper.us:3478'}], 'bundlePolicy': 'max-bundle' };

	pc = new RTCPeerConnection(configuration);

	pc.ontrack = function(ev) {

		console.log("onStartPressed(): Got a track! Id: <<" + ev.track.id + ">> Kind: <<" + ev.track.kind + ">> Mid: <<" + ev.transceiver.mid + ">> Label: <<" + ev.track.label + ">> " );
		//console.log("onStartPressed(): Got a track! Id: <<" + ev.track.id + ">> Kind: <<" + ev.track.kind + ">> Mid: <<" + ev.transceiver.mid + ">> Label: <<" + ev.track.label + ">> Streams length: <<" + ev.streams.length + ">> Stream Id: <<" + ev.streams[0].id + ">> #Tracks in stream: <<" + ev.streams[0].getTracks().length + ">>" );

		if ( ev.transceiver.mid == "0" ) {
			if ( remoteVideoStream1 == null ) {
                        	remoteVideoStream1 = new MediaStream([ev.track]);
                        	console.log("New stream id: <<" + remoteVideoStream1.id + ">> " + remoteVideoStream1.getTracks().length);
			} else {
				remoteVideoStream1.addTrack(ev.track);
				pc.addTrack(ev.track, remoteVideoStream1);
                        	console.log("Previous stream id: <<" + remoteVideoStream1.id + ">> " + remoteVideoStream1.getTracks().length);
			}
                        //document.getElementById("videoStream1").srcObject = remoteVideoStream1;

		} else if ( ev.transceiver.mid == "1" ) {
                        //remoteVideoStream = new MediaStream([ev.streams[0].getAudioTracks()[0], ev.track]);
			if ( remoteVideoStream1 == null ) {
                        	remoteVideoStream1 = new MediaStream([ev.track]);
                        	console.log("New stream id: <<" + remoteVideoStream1.id + ">> " + remoteVideoStream1.getTracks().length);
			} else {
				remoteVideoStream1.addTrack(ev.track);
				pc.addTrack(ev.track, remoteVideoStream1);
                        	console.log("Previous stream id: <<" + remoteVideoStream1.id + ">> " + remoteVideoStream1.getTracks().length);
			}
                        document.getElementById("videoStream1").srcObject = remoteVideoStream1;
                } 

		else if ( ev.transceiver.mid == "2" ) {
                        remoteVideoStream2 = new MediaStream([ ev.track ]);
                        console.log("New stream id: <<" + remoteVideoStream2.id + ">> " + remoteVideoStream2.getTracks().length);
                        document.getElementById("videoStream2").srcObject = remoteVideoStream2;
		}

		else if ( ev.transceiver.mid == "3" ) {
                        remoteVideoStream3 = new MediaStream([ ev.track ]);
                        console.log("New stream id: <<" + remoteVideoStream3.id + ">> " + remoteVideoStream3.getTracks().length);
                        document.getElementById("videoStream3").srcObject = remoteVideoStream3;
		}
	}


	localMediaStreams.getTracks().forEach(track => pc.addTransceiver(track, { direction: "sendrecv" }));
        pc.addTransceiver("video", { direction: "recvonly" } );
        pc.addTransceiver("video", { direction: "recvonly" } );
        pc.addTransceiver("video", { direction: "recvonly" } );


	pc.onicecandidate = function(iceevt) {
		if ( iceevt.candidate == null ) {
			console.log("onStartPressed():pc.onicecandidate(): Completed!");
			sendOfferToCallee();
		} else {
			console.log("onStartPressed():pc.onicecandidate(): Got an ice candidate: <<" + iceevt.candidate.candidate + ">>");
		}
	};


	pc.createOffer().then(function(description) {
		console.log("onStartPressed(): Offer SDP has been created. Setting it as local descript tio the PC.");
		pc.setLocalDescription(description);
	})

}




function sendOfferToCallee() {

	console.log("sendOfferToCallee(): OFFER: <<" + JSON.stringify(pc.localDescription) + ">>");

	var msg = { sdp: pc.localDescription };

	websocketConnection.send(JSON.stringify(msg));

}



function onAnswerReceived(answer) {

	console.log("onAnswerRecieved(): Setting the received answer toremote description.");

	console.log("onAnswerReceived(): <<" + JSON.stringify(answer) + ">>.");
	pc.setRemoteDescription(answer).then(function() {
		console.log("OK, done!");
	});

}



