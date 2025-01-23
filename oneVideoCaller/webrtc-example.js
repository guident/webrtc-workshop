// ====================================================WebSocket_Connection=======================================================================================
var websocketConnection = new WebSocket("wss://guident.bluepepper.us:8850");
websocketConnection.onopen = function(evt) {
  console.log("CallerWebRTC::_onWssConnectionOpen(): CONNECTED!");
}

websocketConnection.onmessage = function(evt) {	
	//var obj = JSON.parse(evt.data);
	//onAnswerReceived(obj.sdp);
	onAnswerReceived(evt.data);
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


var audioIsTurnedOn = false;


var remoteControlDataChannel = null;


async function getLocalMediaStreams() {
        localMediaStreams = await navigator.mediaDevices.getUserMedia({audio: true, video: false});
}

//Async Function Call
getLocalMediaStreams();

// Start Connection to the Callee
function onStartPressed() {

	//const configuration = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}], 'bundlePolicy': 'max-bundle' };
	//const configuration = {'iceServers': [{'urls': 'stun:stun.bluepepper.us:3478'}], 'bundlePolicy': 'max-bundle' };
	//const configuration = {'iceServers': [{'urls': 'stun:stun.bluepepper.us:3478'}], 'bundlePolicy': 'max-bundle' };
	const configuration = {'bundlePolicy': 'max-bundle' };

	pc = new RTCPeerConnection(configuration);

	// onTrack - One-to-One connection between the Caller and Callee
	pc.ontrack = function(ev) {
		console.log("onStartPressed()::onTrack(): Got a track! Id: <<" + ev.track.id + ">> Kind: <<" + ev.track.kind + ">> Mid: <<" + ev.transceiver.mid + ">> Label: <<" + ev.track.label + ">> " );
		//console.log("onStartPressed(): Got a track! Id: <<" + ev.track.id + ">> Kind: <<" + ev.track.kind + ">> Mid: <<" + ev.transceiver.mid + ">> Label: <<" + ev.track.label + ">> Streams length: <<" + ev.streams.length + ">> Stream Id: <<" + ev.streams[0].id + ">> #Tracks in stream: <<" + ev.streams[0].getTracks().length + ">>" );

		//remoteAudioStream::1
		if ( ev.transceiver.mid == "0" ) {
			if ( remoteVideoStream1 == null ) {
                        	remoteVideoStream1 = new MediaStream([ev.track]);
                        	console.log("New stream id: <<" + remoteVideoStream1.id + ">> " + remoteVideoStream1.getTracks().length);
			} else {
				remoteVideoStream1.addTrack(ev.track);
				//pc.addTrack(ev.track, remoteVideoStream1);
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
				//pc.addTrack(ev.track, remoteVideoStream1);
                        	console.log("Previous stream id: <<" + remoteVideoStream1.id + ">> " + remoteVideoStream1.getTracks().length);
			}
                        document.getElementById("videoStream1").srcObject = remoteVideoStream1;

			pc.getTransceivers().forEach( (t) => { console.log("onStartPressed()::onTrack(): Got a transceiver!!", t); });
			console.log("onStartPressed()::onTrack():.... stream has %d tracks.", remoteVideoStream1.getTracks().length);
			remoteVideoStream1.getTracks().forEach( (track) => {
				console.log("Track: Kind: %s, Id: %s, Label: %s", track.kind, track.id, track.label);
			});
                } 
	}

	// Adding Transceivers for All the Streams
	localMediaStreams.getTracks().forEach(track => pc.addTransceiver(track, { direction: "sendrecv" }));

        //pc.addTransceiver("audio", { direction: "inactive" } );
        pc.addTransceiver("video", { direction: "recvonly" } );


	// iceCandidate Discovery
	pc.onicecandidate = function(iceevt) {
		if ( iceevt.candidate == null ) {
			console.log("onStartPressed():pc.onicecandidate(): Completed!");
			sendOfferToCallee();
		} else {
			console.log("onStartPressed():pc.onicecandidate(): Got an ice candidate: <<" + iceevt.candidate.candidate + ">>");
		}
	};

	pc.getTransceivers().forEach( (t) => { console.log("Got a transceiver!!", t); });

	pc.createOffer().then(function(description) {
		console.log("onStartPressed(): Offer SDP has been created. Setting it as local descript tio the PC.");
		pc.getTransceivers().forEach( (t) => { console.log("Got a transceiver!!", t); });
		pc.setLocalDescription(description);
	})

	audioIsTurnedOn = true;

}

// Send OfferRequest to Callee
function sendOfferToCallee() {
	var msg = pc.localDescription.sdp;
	var tmp = msg;
	var lines = tmp.split("\r\n");
	var count = 0;
	lines.forEach( (v) => { if ( v.substring(0, 2) == "m=" ) count++; });
	console.log("sendOfferToCallee(): Offer has %d lines, %d m= sections", lines.length, count);
	//console.log("sendOfferToCallee(): OFFER: <<" + msg + ">>");
	websocketConnection.send(msg);
}


// onAnswer Recieved from the Callee
function onAnswerReceived(answer) {
	console.log("onAnswerRecieved(): Setting the received answer toremote description.");
	//console.log("onAnswerReceived(): <<" + JSON.stringify(answer) + ">>.");
	var tmp = answer;
	var lines = tmp.split("\r\n");
	var count = 0;
	lines.forEach( (v) => { if ( v.substring(0, 2) == "m=" ) count++; });
	var obj = new Object();
	obj.type = "answer";
	obj.sdp = answer;
	console.log("onAnswerReceived(): <<" + JSON.stringify(obj) + ">>.");
	//console.log("onAnswerReceived(): <<" + answer + ">>.");
	console.log("onAnswerReceived(): Answer has %d lines, %d m= sections", lines.length, count);
	pc.setRemoteDescription(obj).then(function() {
		console.log("OK, done!");
	});

}





function onRestartPressed() {
	websocketConnection.send("RESTART");
}




function onRenegotiatePressed() {

	console.log("Renegotiate pressed!!");

	pc.onnegotiationneeded = (ev) => {
		try {
			console.log("got the ONN event!!!!!!!! ");
			//pc.addTransceiver("video", { "direction": "recvonly" } );
			//pc.createOffer().then( (offer) => { console.log("renegotiate offer: <<%s>>.", offer.sdp); } ); 
			pc.getTransceivers().forEach( (t) => { console.log("GGot a transceiver!!", t); });
			pc.createOffer().then(function(description) {
				pc.setLocalDescription(description).then( () => { 
					console.log("done setting local description!!");
					pc.getTransceivers().forEach( (t) => { console.log("AFTER SET LOCAL DESCRIPTION: Got a transceiver!!", t); });
					sendOfferToCallee();
				});
			});
		} catch(err) {
			console.log("Oops!!!!");
		}
	}


	/*
	console.log("before removing sender.... stream has %d tracks.", remoteVideoStream1.getTracks().length);
	remoteVideoStream1.getTracks().forEach( (track) => {
		console.log("Track: Kind: %s, Id: %s, Label: %s", track.kind, track.id, track.label);
	});
	*/

	pc.getTransceivers().forEach( (t) => { console.log("BEFORE REMOVE SENDER: Got a transceiver!!", t); });

	if ( audioIsTurnedOn ) {
		console.log("removing senders");
		pc.getSenders().forEach( (sender) => { 
			if ( sender && sender.track && sender.track.kind == "audio" ) {
				console.log("removing a sending track! <<%s>> <<%s>>", sender.track.kind, sender.track.label);
				pc.removeTrack(sender);
				console.log("Done removing a sender track!!");
			}
		});
	} else {
		console.log("adding sender back in");
		//pc.getTransceivers().forEach( (t) => { t.stop(); });
		localMediaStreams.getTracks().forEach(track => pc.addTrack(track));
		if ( pc.getTransceivers() .length > 3 ) {
			pc.getTransceivers().forEach( (t) => { 
				if ( t.mid == "0" ) t.stop();
			});
		}
	}

	pc.getTransceivers().forEach( (t) => { console.log("AFTER REMOVE SENDER: Got a transceiver!!", t); });

	/*
	pc.getTransceivers().forEach( (t) => { 
		if ( t.mid == "0" ) {
			if ( audioIsTurnedOn ) {
				t.direction = "inactive";
				console.log("changing the direction of the track with mid 0 to be inactive.");
			} else {
				t.direction = "sendrecv";
				console.log("changing the direction of the track with mid 0 to be sendrecv.");
				//localMediaStreams.getTracks().forEach(track => pc.addTransceiver(track, { direction: "sendrecv" }));
			}
		} else if ( t.mid == "1" ) {
			t.direction = "recvonly";
		}
	});
	*/

	audioIsTurnedOn = !audioIsTurnedOn;

	pc.ontrack = function(ev) {
		console.log("onRenegotitatePressed(): Got a track! Id: <<" + ev.track.id + ">> Kind: <<" + ev.track.kind + ">> Mid: <<" + ev.transceiver.mid + ">> Label: <<" + ev.track.label + ">> " );

		pc.getTransceivers().forEach( (t) => { console.log("ONTRACK BEFORE ADDTRACK Got a transceiver!!", t); });
		console.log("before addtrack.... stream has %d tracks.", remoteVideoStream1.getTracks().length);
		remoteVideoStream1.getTracks().forEach( (track) => {
			console.log("Track: Kind: %s, Id: %s, Label: %s", track.kind, track.id, track.label);
		});

		if ( ev.transceiver.mid == "0" ) {
			remoteVideoStream1.addTrack(ev.track);
			//pc.addTrack(ev.track, remoteVideoStream1);
                        console.log("Previous stream id: <<" + remoteVideoStream1.id + ">> " + remoteVideoStream1.getTracks().length);
                        document.getElementById("videoStream1").srcObject = remoteVideoStream1;
                } 

		//pc.getTransceivers().forEach( (t) => { if ( t.mid == null ) { t.stop(); } });

		pc.getTransceivers().forEach( (t) => { console.log("ONTRACK AFTER ADDTRACK Got a transceiver!!", t); });
		console.log("after addtrack.... stream has %d tracks.", remoteVideoStream1.getTracks().length);
		remoteVideoStream1.getTracks().forEach( (track) => {
			console.log("Track: Kind: %s, Id: %s, Label: %s", track.kind, track.id, track.label);
		});
	}


	/*
	pc.createOffer().then(function(description) {
		//console.log("Here is the new offer: <<%s>>.", description.sdp);
		pc.setLocalDescription(description).then( () => { 
			console.log("done setting local description!!");
			pc.getTransceivers().forEach( (t) => { console.log("AFTER SET LOCAL DESCRIPTION: Got a transceiver!!", t); });
			sendOfferToCallee();
		});
	})
	*/

	console.log("Bye!");
}



function onNegotiationNeeded(ev) {
	console.log("HELLO!!!!!!!");
}

