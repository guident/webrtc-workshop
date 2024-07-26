



var myConnectionId = null;
var peerConnectionId = null;

var myUsername = "gabriel";
var myPassword = "whaddaya";
var myEndpointId = "21";

var defaultLatitude = 26.3834684;
var defaultLongitude = -80.1001748;

var currentLatitude = defaultLatitude;
var currentLongitude = defaultLongitude;

var randomLatLonCounter = 0;


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


var isAuthenticated = false;
var authUserEmail = "5ddabb13-4a1a-499e-b54f-b9baebefea88";
var authPassword = "Guident1!"
// var authAccessToken = "whaddaya";
authAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoiOCIsImZpcnN0X25hbWUiOiJEYXZpZCIsImxhc3RfbmFtZSI6IlZlZ2EgU290b2xvbmdvIiwiYXZhdGFyIjpudWxsLCJjcmVhdGVkX2F0IjoiMjAyMy0wMi0yM1QxNzoxNzo1NC44MDBaIn0sImdlbmVyYXRlZF9hdCI6IjIwMjQtMDctMjZUMTU6NTc6MjEuMDI2WiIsImlhdCI6MTcyMjAwOTQ0MSwiZXhwIjoxNzIyMDE2NjQxfQ.heFO9OYaQl00bwgFu8bKetpZO7j5GjOjFI0Phth9ZBo";


function  authenticate() {

    // Create a new instance of XMLHttpRequest, which is used to make HTTP requests in JavaScript.
    var xhr = new XMLHttpRequest();

    // Initialize the request as a POST request to the specified URL.
    xhr.open("POST", "http://dev.bluepepper.us:8081/handler");

    // Set the request header to specify that the request body will be JSON.
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Access-Control-Allow-Origin", "*");
    xhr.setRequestHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");

    // Create a JSON string from the email and password to be sent in the request body.
    const body = JSON.stringify({
	    action: 'auth',
      	    auth: {
		uniqueId: authUserEmail,
		password: authPassword
	    }
    });

    // Define what to do when the request's state changes and when it completes.
    xhr.onload = () => {
      // Check if the request has completed (readyState 4) and if it was successful (status 200).
      if (xhr.readyState == 4 && xhr.status == 200) {
        // Log the response text for debugging purposes.
        console.log("authenticate::onload(): <<%s>>", xhr.responseText);
        try {
          // Parse the JSON response.
          var jsonBlob = JSON.parse(xhr.responseText);
          // Extract the access token from the response.
          authAccessToken = jsonBlob.tokens.accessToken;
          // Check if the access token is defined and not null.
          if (authAccessToken != undefined && authAccessToken != null) {
            // Set the authentication state to true.
            isAuthenticated = true;
            // Log the access token for debugging purposes.
            console.log("Got this access token!! <<%s>>", authAccessToken);
	    connectWss();
          } else {
            // Log an error message if the access token is not found.
            console.log("authenticate::onload(): Oops!!");
          }
        } catch(err) {
            // Log an error message if parsing the JSON response fails.
            console.log("authenticate::onload(): Oops!!");
        }
      } else {
          // Log an error message if the request was not successful.
          console.log(`Error: ${xhr.status}`);
      }
    };

    // Log a message indicating that the authentication request is being sent.
    console.log("authenticate() Sending the authentication request!!");

    // Send the request with the JSON body.
    xhr.send(body);
}



var websocketConnection = null;

function connectWss() {

	websocketConnection = new WebSocket("wss://guident.bluepepper.us:8445");

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









function sendWssMessage(messageType, destinationId) {

        var msg = new Object();

        msg.messageType = messageType;

        msg.connectionId = myConnectionId;
        if ( destinationId != null ) {
                msg.peerConnectionId = destinationId;
        }

        if (myEndpointId != null ) msg.endpointId = myEndpointId;
        msg.endpointType = GuidentMsgEndpointTypes.VEHICLE;
        msg.name = myUsername;
        if ( messageType == "register" ) { 
		msg.credential = myPassword;
		msg.authenticationUsername = authUserEmail;
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
var localVideoStream = null;
var remoteVideoStream = null;


var remoteControlDataChannel = null;


async function mikemadethis() {
        localVideoStream = await navigator.mediaDevices.getUserMedia({audio: false, video: true});

	var tracks = localVideoStream.getTracks();

	tracks.forEach((track) => {
		var trackSettings = track.getSettings();
		console.log("ID: <<" + track.id + ">> Kind: <<" + track.kind + ">> Label: <<" + track.label + ">> DeviceId: <<" + trackSettings.deviceId + ">>");

	});
}

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
	console.log(JSON.stringify(localAudioVideo.getTracks()[0]));
	console.log(JSON.stringify(localVideo.getTracks()));
	console.log(JSON.stringify(localVideoSecond.getTracks()));
}





mikemadethis();

// authenticate();

connectWss();



const configuration = {'bundlePolicy': 'max-bundle'};
// const configuration = {'iceServers': [{'urls': 'stun:stun.bluepepper.us:3478'}], 'bundlePolicy': 'max-bundle'};



// onOfferRecieved from the Caller
function onOfferReceived(offer) {

	console.log("testing out console.log")

	pc = new RTCPeerConnection(configuration);

	pc.ontrack = function(ev) {
		console.log("pc.ontrack(): Got a track! Id: <<" + ev.track.id + ">> Kind: <<" + ev.track.kind + ">> Mid: <<" + ev.transceiver.mid + ">> Label: <<" + ev.track.label + ">> Streams Length: <<" + ev.streams.length + ">>" );
		if ( ev.transceiver.mid == "0" ) {
			if ( remoteVideoStream == null ) {
				remoteVideoStream = new MediaStream([ ev.track ]);
				pc.addTrack(ev.track, remoteVideoStream);
                		console.log("New stream id: <<" + remoteVideoStream.id + ">> # tracks: " + remoteVideoStream.getAudioTracks().length + " New stream.");
			} else {
				pc.addTrack(ev.track, remoteVideoStream);
                		console.log("New stream id: <<" + remoteVideoStream.id + ">> # tracks: " + remoteVideoStream.getTracks().length);
			}
			document.getElementById("videoStream").srcObject = remoteVideoStream;
		}
	}


	
	localVideoStream.getTracks().forEach(track => {
		pc.addTrack(track, localVideoStream);
		pc.addTransceiver(track,  { direction: "sendrecv" })
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






