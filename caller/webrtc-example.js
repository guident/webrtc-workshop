// ====================================================WebSocket_Connection=======================================================================================
var websocketConnection = new WebSocket("wss://guident.bluepepper.us:8848");
websocketConnection.onopen = function(evt) {
  console.log("CallerWebRTC::_onWssConnectionOpen(): CONNECTED!");
}

websocketConnection.onmessage = function(evt) {	
	var obj = JSON.parse(evt.data);
	onAnswerReceived(obj.sdp);
}

websocketConnection.onclose = function(evt) {
  console.log("CallerWebRTC::_onWssConnectionClose(): Code: " + evt.code + " Reason: " + evt.reason + " Clean?: " + evt.wasClean);
}

websocketConnection.onerror = function(evt) {
  console.log("CallerWebRTC::_onWssConnectionError(): " + evt);
}

// ====================================================WebSocket_Connection=======================================================================================


var pc = null;
var localMediaStreams = null;
var remoteAudioStream = null;
var remoteVideoStream1 = null;
var remoteVideoStream2 = null;
var remoteVideoStream3 = null;


var remoteControlDataChannel = null;


async function getLocalMediaStreams() {
        localMediaStreams = await navigator.mediaDevices.getUserMedia({audio: true, video: false});
}

//Async Function Call
getLocalMediaStreams();

// Start Connection to the Callee
function onStartPressed() {

	//const configuration = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}], 'bundlePolicy': 'max-bundle' };
	const configuration = {'iceServers': [{'urls': 'stun:stun.bluepepper.us:3478'}], 'bundlePolicy': 'max-bundle' };

	pc = new RTCPeerConnection(configuration);

	// onTrack - One-to-One connection between the Caller and Callee
	pc.ontrack = function(ev) {
		console.log("onStartPressed(): Got a track! Id: <<" + ev.track.id + ">> Kind: <<" + ev.track.kind + ">> Mid: <<" + ev.transceiver.mid + ">> Label: <<" + ev.track.label + ">> " );
		//console.log("onStartPressed(): Got a track! Id: <<" + ev.track.id + ">> Kind: <<" + ev.track.kind + ">> Mid: <<" + ev.transceiver.mid + ">> Label: <<" + ev.track.label + ">> Streams length: <<" + ev.streams.length + ">> Stream Id: <<" + ev.streams[0].id + ">> #Tracks in stream: <<" + ev.streams[0].getTracks().length + ">>" );

		//remoteAudioStream::1
		if ( ev.transceiver.mid == "0" ) {
			if ( remoteVideoStream1 == null ) {
                        	remoteVideoStream1 = new MediaStream([ev.track]);
                        	console.log("New stream id: <<" + remoteVideoStream1.id + ">> " + remoteVideoStream1.getTracks().length);
			} else {
				remoteVideoStream1.addTrack(ev.track);
				pc.addTrack(ev.track, remoteVideoStream1);
                        	console.log("Previous stream id: <<" + remoteVideoStream1.id + ">> " + remoteVideoStream1.getTracks().length);
				}
			}
		// remoteVideoStream::1  
		else if ( ev.transceiver.mid == "1" ) {
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
		// remoteVideoStream::2
		else if ( ev.transceiver.mid == "2" ) {
                        remoteVideoStream2 = new MediaStream([ ev.track ]);
                        console.log("New stream id: <<" + remoteVideoStream2.id + ">> " + remoteVideoStream2.getTracks().length);
                        document.getElementById("videoStream2").srcObject = remoteVideoStream2;
		}
		// remoteVideoStream::3
		else if ( ev.transceiver.mid == "3" ) {
                        remoteVideoStream3 = new MediaStream([ ev.track ]);
                        console.log("New stream id: <<" + remoteVideoStream3.id + ">> " + remoteVideoStream3.getTracks().length);
                        document.getElementById("videoStream3").srcObject = remoteVideoStream3;
		}
	}

	// Adding Transceivers for All the Streams
	localMediaStreams.getTracks().forEach(track => pc.addTransceiver(track, { direction: "sendrecv" }));
        pc.addTransceiver("video", { direction: "recvonly" } );
        pc.addTransceiver("video", { direction: "recvonly" } );
        pc.addTransceiver("video", { direction: "recvonly" } );




	// data channel stuff
	remoteControlDataChannel = pc.createDataChannel("foo");
	if ( remoteControlDataChannel != null ) {
		remoteControlDataChannel.onopen = function(event) {
			console.log("dataChannel.onopen(): The data channel is now open.");
		};
		remoteControlDataChannel.onmessage = function(event) {
			console.log("dataChannel.onmessage(): The data channel has received a message: <<" + event.data + ">>.");
		};
		remoteControlDataChannel.onclose = function(event) {
			console.log("dataChannel.onclose(): The data channel is now closed.");
			remoteControlDataChannel = null;
		};
		remoteControlDataChannel.onerror = function(event) {
			console.error("dataChannel.onerror(): Oops, the data channel has generated an error.");
			event.channel.onopen = null;
			event.channel.onmessage = null;
			event.channel.onclose = null;
			event.channel.onerror = null;
			remoteControlDataChannel = null;
		};
	}




	// iceCandidate Discovery
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

// Send OfferRequest to Callee
function sendOfferToCallee() {
	console.log("sendOfferToCallee(): OFFER: <<" + JSON.stringify(pc.localDescription) + ">>");
	var msg = { sdp: pc.localDescription };
	websocketConnection.send(JSON.stringify(msg));
}

// onAnswer Recieved from the Callee
function onAnswerReceived(answer) {
	console.log("onAnswerRecieved(): Setting the received answer toremote description.");
	console.log("onAnswerReceived(): <<" + JSON.stringify(answer) + ">>.");
	pc.setRemoteDescription(answer).then(function() {
		console.log("OK, done!");
	});
}
