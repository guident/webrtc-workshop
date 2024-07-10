



var myConnectionId = null;
var peerConnectionId = null;

var myUsername = "gabriel";
var myPassword = "whaddaya";
var myEndpointId = "0";

var defaultLatitude = 26.3834684;
var defaultLongitude = -80.1001748;

var currentLatitude = defaultLatitude;
var currentLongitude = defaultLongitude;

var randomLatLonCounter = 0;


var authXhr = null;
var authUsername = "dvega@guident.co";
var authPassword = "Guident1!";
var authAccessToken = null;



async function authenticate() {

	xhr = new XMLHttpRequest();
	xhr.open("POST", "https://dev.bluepepper.us/api/auth/login");
	xhr.setRequestHeader("Content-Type", "application/json");
	const body = JSON.stringify({
  		email: authUsername,
  		password: authPassword
	});

	xhr.onload = () => {
  		if (xhr.readyState == 4 && xhr.status == 200) {
			console.log("authenticate::onload(): <<%s>>", xhr.responseText);
			try {
    			var jsonBlob = JSON.parse(xhr.responseText);
				authAccessToken = jsonBlob.tokens.accessToken;
				if ( authAccessToken != undefined && authAccessToken != null) {
					startWebSocketConnection();
				} else {
					console.log("authenticate::onload(): Oops!!");
				}
			} catch(err) {
				console.log("authenticate::onload(): Oops!!");
			}

  		} else {
    		console.log(`Error: ${xhr.status}`);
  		}
	};

	console.log("authenticate() Sending the authentication request!!");
	xhr.send(body);
}

authenticate();



function getNextRandomLatLon() {

	if ( randomLatLonCounter >= 25 ) {
		currentLatitude = defaultLatitude;
		currentLongitude = defaultLongitude;
		randomLatLonCounter = 0;
	} else {
		currentLatitude += ( Math.random() * 0.002 ) - 0.001;
		currentLongitude += ( Math.random() * 0.001 ) - 0.0005;
		randomLatLonCounter++;
	}
	return( { lat: currentLatitude, lng: currentLongitude } );
}


var statusNotifyTimer = setTimeout(onStatusNotifyTimerTimeout, 5000);

var dataChannelObject = null;

function onStatusNotifyTimerTimeout() {
	console.log("every 5 seconds");
	console.log("statusNotifyTimer():: dataChannelObject: <<" + dataChannelObject+ " >>.");
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
        //msg.endpointType = GuidentMsgEndpointTypes.VEHICLE;
		msg.endpointType = GuidentMsgEndpointTypes.MONITOR;
        msg.name = myUsername;
        if ( messageType == "register" ) {
			msg.name = authUsername;
			msg.credential = myPassword;
			msg.authenticationUsername = authUsername;
			msg.authenticationToken = authAccessToken;
		}
        if ( messageType == "notify" ) {
                msg.eventType = "status";
				var location = new Object();
				msg.location = location;
               	//msg.location.lat = 26.3834684;
				//msg.location.lng = -80.1001748;
				msg.location = getNextRandomLatLon();
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


var websocketConnection = null;


function startWebSocketConnection() {

	websocketConnection = new WebSocket("wss://guident.bluepepper.us:8443");

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
		dataChannelObject.enabled = false;
		responseObject.enabled = false;
		responseObject.vehicleVelocity = 0.00;
		responseObject.state = "UNKNOWN"
	}
	remoteVideoStream = null;
	pc.close();
	console.log("onDisengageRecieved(): Disengaged from the remote vehicle successful.");
}










var pc = null;
var localMediaStream = null;
var remoteMediaStream = null;





//================================================================================================================================================================
// response Objdect via dataChannel for the vehicle
var responseObject = {
	"enabled":    false,                //true or false
	"override": false,                  //true or false;
	"steeringAngle": 0.00,              // -1.00 to +1.00
	"vehicleVelocity": 0.00,            // 0.00 to 60.00
	"transmitTimestamp": 121,       // 64 bit timestamp
	"state": "UNKNOWN"                  // either	"ENGAGED" or "ENGAGED_AND_ALARMED" or "REMOTE_CONTROL"

}
var statusNotifyTimer1second = setTimeout(onStatusNotifyTimerTimeout1second, 1000);
function onStatusNotifyTimerTimeout1second() {

	console.log("every 1 seconds");

	if ( remoteControlDataChannel == null) {
		statusNotifyTimer1second = setTimeout(onStatusNotifyTimerTimeout1second, 1000);
		return;
	}

	if ( dataChannelObject.engaged) responseObject.state = "ENGAGED";

	if ( dataChannelObject.enabled && !responseObject.enabled) {
		//responseObject.enabled = true;
		console.log("*******************************************************************************");
		
		responseObject.vehicleVelocity = 8.0
	}
	if ( !dataChannelObject.enabled && responseObject.enabled) {
		//responseObject.enabled = false;
		console.log("??????????????????????????????????????????????????????????????????");
		//responseObject.state = "ENGAGED";
		responseObject.vehicleVelocity = 0.0
	}

	if (dataChannelObject.enabled) {
		responseObject.enabled = true;
		responseObject.vehicleVelocity = responseObject.vehicleVelocity + (responseObject.vehicleVelocity * ((Math.floor(Math.random() * 200) - 100) / 500.00) );
		responseObject.state = "REMOTE_CONTROL";
	} else {
		responseObject.enabled = false;
		responseObject.vehicleVelocity = 0.0;
	}
	
	responseObject.steeringAngle = dataChannelObject.steering;
	responseObject.transmitTimestamp = Date.now();
	

	
	if (remoteControlDataChannel != null) {
		remoteControlDataChannel.send(JSON.stringify(responseObject));
	}
	
	// console.log("statusNotifyTimer():: dataChannelObject: <<" + dataChannelObject+ " >>.");
	// if ( currentState == "connected" || currentState == "engaged" ) {
		
	// 	sendWssMessage(GuidentMessageTypes.NOTIFY)
	// }

	statusNotifyTimer1second = setTimeout(onStatusNotifyTimerTimeout1second, 1000);
}
//================================================================================================================================================================

function showMediaStreams() {
	console.log(JSON.stringify(localMediaStreams.getTracks()[0]));
	console.log(JSON.stringify(localMediaStreams.getTracks()[1]));
}


async function getLocalMediaStream() {

        localMediaStream = await navigator.mediaDevices.getUserMedia({audio: true, video: true});

	var tracks = localMediaStream.getTracks();

	tracks.forEach((track) => {
		var trackSettings = track.getSettings();
		console.log("ID: <<" + track.id + ">> Kind: <<" + track.kind + ">> Label: <<" + track.label + ">> DeviceId: <<" + trackSettings.deviceId + ">>");

	});
}

// Async Function Call
getLocalMediaStream();

const configuration = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}], 'bundlePolicy': 'max-bundle'};
// const configuration = {'iceServers': [{'urls': 'stun:stun.bluepepper.us:3478'}], 'bundlePolicy': 'max-bundle'};



// onOfferRecieved from the Caller
function onOfferReceived(offer) {

	console.log("testing out console.log")

	pc = new RTCPeerConnection(configuration);

	pc.ontrack = function(ev) {

		console.log("pc.ontrack(): Got a track! Id: <<" + ev.track.id + ">> Kind: <<" + ev.track.kind + ">> Mid: <<" + ev.transceiver.mid + ">> Label: <<" + ev.track.label + ">> Streams Length: <<" + ev.streams.length + ">>" );
		if ( ev.transceiver.mid == "0" ) {
			if ( remoteMediaStream == null ) {
				remoteMediaStream = new MediaStream([ ev.track ]);
				pc.addTrack(ev.track, remoteVideoStream);
                		console.log("New stream id: <<" + remoteMediaStream.id + ">> # tracks: " + remoteMediaStream.getAudioTracks().length + " New stream.");
			} else {
				pc.addTrack(ev.track, remoteVideoStream);
                		console.log("New stream id: <<" + remoteMediaStream.id + ">> # tracks: " + remoteMediaStream.getTracks().length);
			}
			document.getElementById("audioStream").srcObject = remoteMediaStream;
		} else {
			if ( remoteMediaStream == null ) {
				remoteMediaStream = new MediaStream([ ev.track ]);
				pc.addTrack(ev.track, remoteMediaStream);
                		console.log("New stream id: <<" + remoteMediaStream.id + ">> # tracks: " + remoteMediaStream.getVideoTracks().length + " New stream.");
			} else {
				pc.addTrack(ev.track, remoteVideoStream);
                		console.log("New stream id: <<" + remoteMediaStream.id + ">> # tracks: " + remoteMediaStream.getTracks().length);
			}
			document.getElementById("audioStream").srcObject = remoteMediaStream;
		}
	}

	
    
	pc.onicecandidate = function(iceevt) {
		if ( iceevt.candidate == null ) {
			console.log("pc.onicecandidate(): Completed!");
			//sendAnswerToCaller();
			waitTwoSeconds();
		} else {
			console.log("pc.onicecandidate(): Got an ice candidate: <<" + iceevt.candidate.candidate + ">>");
		}
	};



	// Adding Transceivers for All the Streams
	console.log("Adding transceivers for the two streams.");
	localMediaStream.getTracks().forEach(track => {
		pc.addTransceiver(track, { direction: "sendrecv" });
		console.log("Adding track/transceiver to PC.");
	});


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






