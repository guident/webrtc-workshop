



var myConnectionId = null;
var peerConnectionId = null;

var myUsername = "gabriel";
var myPassword = "whaddaya";
var myEndpointId = "0";



var statusNotifyTimer = setTimeout(onStatusNotifyTimerTimeout, 5000);


function onStatusNotifyTimerTimeout() {
	console.log("every 5 seconds");
	if ( currentState == "connected" || currentState == "engaged" ) {
		sendWssMessage(GuidentMessageTypes.NOTIFY)
	}
	statusNotifyTimer = setTimeout(onStatusNotifyTimerTimeout, 5000);
}


var  localMessageSequence = 0;

/**
 * Enum for guident Vehicle Locator server protocol message types.
 * @readonly
 * @enum {string}
 */
const GuidentMessageTypes = {
	REGISTER: "register",
	NOTIFY:	"notify",
	ENGAGE_OFFER: "engage-offer",
	ENGAGE_ANSWER: "engage-answer",
	ENGAGE_ACK: "engage-ack",
	TAKEOVER: "takeover",
	RELEASE: "release",
	DISENGAGE: "disengage",
	UNKNOWN: "unknown"
};





/**
 * Enum for guident Vehicle Locator server protocol message event types.
 * @readonly
 * @enum {string}
 * @author Sanjay Kumar
 */
const GuidentMsgEventTypes = {
	CONNECTED: "connected",
	REGISTERED: "registered",
	REJECTED: "rejected",
	ENGAGED: "engaged",
	DISENGAGED: "disengaged",
	TAKEN_OVER: "taken-over",
	RELEASED: "released",
	STATUS: "status",
	DISCONNECTED: "disconnected",
	UNKNOWN: "unknown"
};

/**
 * Enum for guident Vehicle Locator server protocol message endpoint types.
 * @readonly
 * @enum {string}
 * @author Sanjay Kumar
 */
const GuidentMsgEndpointTypes = {
	VEHICLE: "vehicle",
	MONITOR: "monitor",
	UNKNOWN: "unknown"
};


/**
 * Enum for guident Vehicle Locator server protocol message status types.
 * @readonly
 * @enum {string}
 * @author Sanjay Kumar
 */
const GuidentMsgStatusTypes = {
	GREEN_OK: "green-ok",
	YELLOW_WARNNG: "yellow-warning",
	RED_EMERGENCY: "red-emergency",
	UNKNOWN: "unknown"
};




/**
 * Enum for Guident Vehicle cameras.
 * @readonly
 * @enum {int}
 * @author Sanjay Kumar
 */
const GuidentCameraPositions = {
	FRONT_CAMERA_LEFT: 0,
	FRONT_CAMERA_RIGHT: 1,
	REAR_CAMERA: 2,
	CAMERA_POSITIONS_LENGTH: 3
};




var currentState = "disconnected"




function sendWssMessage(messageType, destinationId) {

        var msg = new Object();

        msg.messageType = messageType;

        msg.connectionId = myConnectionId;
        if ( destinationId != null ) {
                msg.peerConnectionId = destinationId;
        }

        if (msg.endpointId != null ) msg.endpointId = myEndpointId;
        msg.endpointType = GuidentMsgEndpointTypes.VEHICLE;
        msg.name = myUsername;
        if ( messageType == "register" ) msg.credential = myPassword;
        if ( messageType == "notify" ) {
                msg.eventType = "status";
				var location = new Object();
				msg.location = location;
                msg.location.lat = 26.3834684;
				msg.location.lng = -80.1001748;
				msg.location.speed = 23.1;
				msg.location.heading = 45.0;
        }
        if ( messageType == "engage-offer" || messageType == "engage-answer" ) {
                if ( pc != null ) {
                        msg.sessiondescription = pc.localDescription;
                }
        }
        msg.sequence = localMessageSequence++;

        var str = JSON.stringify(msg);

        console.log("sendWssMessage(): Sending: <<" +  str + ">>.");
        websocketConnection.send(str);

	return;
}









// ====================================================WebSocket_Connection=======================================================================================
var websocketConnection = new WebSocket("wss://guident.bluepepper.us:8443");
websocketConnection.onopen = function(evt) {
  console.log("JsFiddleWssCallingExample::_onWssConnectionOpen(): CONNECTED!");
}

websocketConnection.onmessage = function(evt) {
	var obj = JSON.parse(evt.data);
	//onOfferReceived(obj.sdp);
	onWssMessageReceived(obj);
}


websocketConnection.onclose = function(evt) {
  console.log("JsFiddleWssCallingExample::_onWssConnectionClose(): Code: " + evt.code + " Reason: " + evt.reason + " Clean?: " + evt.wasClean);
}

websocketConnection.onerror = function(evt) {
  console.log("JsFiddleWssCallingExample::_onWssConnectionError(): " + evt);
}

// ====================================================WebSocket_Connection=======================================================================================
//





function onWssMessageReceived(msg) {

	console.log("Received a message: <<" + JSON.stringify(msg) + ">>.");

	if ( msg.messageType == GuidentMessageTypes.NOTIFY && msg.eventType == GuidentMsgEventTypes.CONNECTED ) {
		console.log("Connected to the server!!.");
		myConnectionId = msg.connectionId;
		currentState = "connected"
		sendWssMessage(GuidentMessageTypes.REGISTER, null);
	} else if ( msg.messageType == GuidentMessageTypes.ENGAGE_OFFER ) {
		peerConnectionId = msg.peerConnectionId;
		currentState = "engaging"
		onOfferReceived(msg.sessiondescription);
	} else if ( msg.messageType == GuidentMessageTypes.ENGAGE_ACK ) {
		currentState = "engaged";
		console.log("Got the ENGAGE ACK!!!!!");
	} else if (msg.messageType == GuidentMessageTypes.DISENGAGE ) {
		console.log("Got the DISENGAGE!!!!!");
		currentState = "connected";
		onDisengageRecieved();
	}

}

function onDisengageRecieved() {
	console.log("onDisengageRecieved()");
	document.getElementById('audioStream').srcObject = null;
	document.getElementById('videoStream').srcObject = null;

	// remoteControlDataChannel.close();
	if ( remoteControlDataChannel != null ) {	
		remoteControlDataChannel = null;
	}
	
	pc.close();
	console.log("onDisengageRecieved(): Disengaged from the remote vehicle successful.");
}










var pc = null;
var localVideoStreams = [ ];
var streamIdx = 0;
var localAudioStream = null
var remoteVideoStream = null;


var remoteControlDataChannel = null;


async function mikemadethis() {
        localMediaStreams = await navigator.mediaDevices.getUserMedia({audio: true, video: true});

	var tracks = localMediaStreams.getTracks();

	tracks.forEach((track) => {
		var trackSettings = track.getSettings();
		console.log("ID: <<" + track.id + ">> Kind: <<" + track.kind + ">> Label: <<" + track.label + ">> DeviceId: <<" + trackSettings.deviceId + ">>");

	});
}


function showMediaStreams() {
	console.log(JSON.stringify(localAudioVideo.getTracks()[0]));
	console.log(JSON.stringify(localVideo.getTracks()));
	console.log(JSON.stringify(localVideoSecond.getTracks()));
}


// Get Multiple Streams and add to list
async function getLocalMediaStreams() {
	localAudioStream = await navigator.mediaDevices.getUserMedia({audio:true, video:false})
	await navigator.mediaDevices.getUserMedia({audio: false, video: true}).then(()=>{
		navigator.mediaDevices.enumerateDevices().then((devices)=>{
		devices.forEach((device)=>{
			if(device.kind == "videoinput"){
				console.log(device)
				navigator.mediaDevices.getUserMedia({
												video: {
												deviceId: {
													exact: device.deviceId
													}
												}
											}).then( (data) => {
												localVideoStreams[streamIdx++] = data;
												console.log(data);
												console.log(data.getTracks().length);
											})
				  
				console.log("<< Devide ID: "+device.deviceId+" << label: "+device.label)
				}
			})
		})
	})
}

// Async Function Call
getLocalMediaStreams();
//mikemadethis();

//const configuration = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}], 'bundlePolicy': 'max-bundle'};
const configuration = {'iceServers': [{'urls': 'stun:stun.bluepepper.us:3478'}], 'bundlePolicy': 'max-bundle'};



// onOfferRecieved from the Caller
function onOfferReceived(offer) {

	console.log("testing out console.log")

	pc = new RTCPeerConnection(configuration);

	pc.ontrack = function(ev) {
		console.log("pc.ontrack(): Got a track! Id: <<" + ev.track.id + ">> Kind: <<" + ev.track.kind + ">> Mid: <<" + ev.transceiver.mid + ">> Label: <<" + ev.track.label + ">> Streams Length: <<" + ev.streams.length + ">>" );
		//remoteAudioStream::1
		if ( ev.transceiver.mid == "0" ) {
			if ( remoteVideoStream == null ) {
				remoteVideoStream = new MediaStream([ ev.track ]);
				pc.addTrack(ev.track, remoteVideoStream);
                console.log("New stream id: <<" + remoteVideoStream.id + ">> # tracks: " + remoteVideoStream.getAudioTracks().length + " New stream.");
			} else {
				pc.addTrack(ev.track, remoteVideoStream);
                console.log("New stream id: <<" + remoteVideoStream.id + ">> # tracks: " + remoteVideoStream.getTracks().length);
			}
			document.getElementById("audioStream").srcObject = remoteVideoStream;
		}
		// remoteVideoStream::1  
	// 	if ( ev.transceiver.mid == "1" ) {
	// 		if ( remoteVideoStream == null ) {
	// 			remoteVideoStream = new MediaStream([ ev.track ]);
    //                     	console.log("New stream id: <<" + remoteVideoStream.id + ">> # tracks: " + remoteVideoStream.getTracks().length + " New stream.");
	// 		} else {
	// 			remoteVideoStream.addTrack(ev.track);
    //                     	console.log("New stream id: <<" + remoteVideoStream.id + ">> # tracks: " + remoteVideoStream.getTracks().length);
	// 		}
    //                     document.getElementById("audioStream").srcObject = remoteVideoStream;
    //             } 
	}


	pc.ondatachannel = function(ev) {

		remoteControlDataChannel = ev.channel;

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

	};


	
	// Adding Transceivers for All the Streams
	localAudioStream.getTracks().forEach(track => {
		pc.addTransceiver(track, { direction: "sendrecv" });
		console.log("Adding track/transceiver to PC.");
	});
	
	localVideoStreams[0].getTracks().forEach(track => {
		pc.addTrack(track, localVideoStreams[0]);
		pc.addTransceiver(track,  { direction: "sendonly" })
	});
	localVideoStreams[1].getTracks().forEach(track => {
		pc.addTrack(track, localVideoStreams[1]);
		pc.addTransceiver(track,  { direction: "sendonly" })
	});
	localVideoStreams[2].getTracks().forEach(track => {
		pc.addTrack(track, localVideoStreams[2]);
		pc.addTransceiver(track,  { direction: "sendonly" })
	});
    
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
			console.log(JSON.stringify(description.sdp));
			pc.setLocalDescription(description);
		});
	});

}

// waitFunction
function waitTwoSeconds() {
	setTimeout(sendAnswerToCaller, 2000);
}

// Aswer After Offer recieved
function sendAnswerToCaller() {
	sendWssMessage(GuidentMessageTypes.ENGAGE_ANSWER, peerConnectionId);
}






