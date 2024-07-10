"use strict";


/**
 * @file This the Guident Vehicle Locator/Engager API.
 * @copyright Guident Corp. 2020
 * @author Sanjay Kumar
 */



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
	COMMAND: "command",
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







const GuidentRmcwStateMachineDefinition = {

	initialState: 'start',

	start: {
		onEnter() { console.log("GuidentRmcwStateMachineDefinition::start: entering"); },
		onExit() { console.log("GuidentRmcwStateMachineDefinition::start: exiting"); },
		eventCallbacks: {
			startstopclicked: {
				action(endpoint, evtData) {
					endpoint._startConnection();
					endpoint._startTimer(10000);
					endpoint.onConnecting();
					return("waitingforconnection");
				}
			}
		}
	},

	idle: {
		onEnter() { console.log("GuidentRmcwStateMachineDefinition::idle: entering"); },
		onExit() { console.log("GuidentRmcwStateMachineDefinition::idle: exiting"); },
		eventCallbacks: {
			timeout: {
				action(endpoint, evtData) {
					endpoint._startConnection();
					endpoint._startTimer(10000);
					endpoint.onConnecting();
					return("waitingforconnection");
				}
			},
			startstopclicked: {
				action(endpoint, evtData) {
					endpoint._clearCurrentTimer();
					endpoint.onEndpointStopped();
					return("start");
				}
			}
		}
	},

	waitingforconnection: {
		onEnter() { console.log("GuidentRmcwStateMachineDefinition::waitingforconnection: entering"); },
		onExit() { console.log("GuidentRmcwStateMachineDefinition::waitingforconnection: exiting"); },
		eventCallbacks: {
			timeout: {
				action(endpoint, evtData) {
					endpoint._closeConnection();
					endpoint._startTimer(10000);
					endpoint.onConnectionFailed();
					return("disconnecting");
				}
			},
			connect: {
				action(endpoint, evtData) {
					endpoint._clearCurrentTimer();
					endpoint._startTimer(10000);
					return("connectedwaitingfornotification");
				}
			},
			connectionerror: {
				action(endpoint, evtData) {
					endpoint._clearCurrentTimer();
					endpoint._closeConnection();
					endpoint._startTimer(10000);
					endpoint.onConnectionFailed();
					return("disconnecting");
				}
			}
		}
	},

	connectedwaitingfornotification: {
		onEnter() { console.log("connectedwaitingfornotification: entering"); },
		onExit() { console.log("connectedwaitingfornotification: exiting"); },
		eventCallbacks: {
			timeout: {
				action(endpoint, evtData) {
					endpoint._clearCurrentTimer();
					endpoint._closeConnection();
					endpoint._startTimer(10000);
					endpoint.onConnectionFailed();
					return("disconnecting");
				}

			},
			disconnect: {
				action(endpoint, evtData) {
					console.log("WEBSOCKET HAS BEEN CLOSED FROM REMOTE SIDE");
					endpoint._clearCurrentTimer();
					endpoint._startTimer(10000);
					endpoint.onConnectionFailed();
					return("idle");
				}

			},
			connectednotification: {
				action(endpoint, evtData) {
					console.log("got the message.");
					endpoint._clearCurrentTimer();
					endpoint._sendMessage("register");
					endpoint._startTimer(10000);
					endpoint.onConnectionSuccessful();
					return("registeringwaitingfornotification");
				}
			}
		}
	},

	registeringwaitingfornotification: {
		onEnter() { console.log("registeringwaitingfornotification: entering"); },
		onExit() { console.log("registeringwaitingfornotification: exiting"); },
		eventCallbacks: {
			timeout: {
				action(endpoint, evtData) {
					endpoint._clearCurrentTimer();
					endpoint._closeConnection();
					endpoint._startTimer(10000);
					endpoint.onRegistrationFailed();
					return("disconnecting");
				}
			},
			rejectednotification: {
				action(endpoint, evtData) {
					endpoint._clearCurrentTimer();
					endpoint._closeConnection();
					endpoint._startTimer(10000);
					endpoint.onRegistrationFailed();
					return("disconnecting");
				}
			},
			registerednotification: {
				action(endpoint, evtData) {
					endpoint._clearCurrentTimer();
					endpoint.onRegistrationSuccessful();
					return("registered");
				}
			}
		}
	},

	registered: {
		onEnter() { console.log("registered: entering"); },
		onExit() { console.log("registered: exiting"); },
		eventCallbacks: {
			disconnect: {
				action(endpoint, evtData) {
					console.log("registered-disconnect(): WEBSOCKET HAS BEEN CLOSED FROM REMOTE SIDE");
					endpoint._clearCurrentTimer();
					endpoint._startTimer(10000);
					endpoint.onDisconnected("remote");
					return("idle");
				}
			},
			startstopclicked: {
                                action(endpoint, evtData) {
                                        endpoint._clearCurrentTimer();
					endpoint._closeConnection();
					endpoint._startTimer(10000);
					return("disconnectingstop");
                                }
                        },
			engagementoffer: {
				action(endpoint, evtData) {
                                        endpoint._clearCurrentTimer();
					if ( endpoint._startPeerEngagementAnswer(evtData) ) {
						endpoint._startTimer(67000);
						return("engagingwithanswer");
					} else {
						console.log("registered-vehiclebuttonclicked(): Oops, error starting offer request.");
						endpoint._resetEngagement();
						endpoint.onEngagementFailed("config");
						return("registered");
					}
				}
			},
			vehiclebuttonclicked: {
				action(endpoint, evtData) {
                                        endpoint._clearCurrentTimer();
					if ( endpoint._startPeerEngagementOffer(evtData) ) {
						endpoint._startTimer(67000);
						endpoint.onEngaging();
						return("engagingwithoffer");
					} else {
						console.log("registered-vehiclebuttonclicked(): Oops, error starting offer request.");
						endpoint._resetEngagement();
						endpoint.onEngagementFailed("config");
						return("registered");
					}
				}
			}
		}
	},

	engagingwithoffer: {
		onEnter() { console.log("engagingwithoffer: entering"); },
		onExit() { console.log("engagingwithoffer: exiting"); },
		eventCallbacks: {
			startstopclicked: {
				action(endpoint, evtData) {
					console.log("engagingwithoffer-startstopclicked(): Connection is being reset.")
					endpoint._clearCurrentTimer();
					endpoint._resetEngagement();
					endpoint._closeConnection();
					endpoint._startTimer(10000);
					return("disconnectingstop");
				}
			},
			engagementanswer: {
				action(endpoint, evtData) {
					endpoint._clearCurrentTimer();
					console.log("engagingwithoffer-engagementanswer(): will process answer sdp.");
					if ( ! endpoint._processPeerEngagementAnswer(evtData) ) {
						console.log("engagingwithoffer-engagementanswer(): Oops, error processing ansder sdp.");
						endpoint._resetEngagement();
						endpoint.onEngagementFailed("config");
						sendMessage("disengage", evtData.peerConnectionId);
						return("registered");
					}
					endpoint.onEngagementSuccessful();
					return("engaged");
				}
			},
			rejectednotification: {
				action(endpoint, evtData) {
					console.log("engagingwithoffer-rejectednotification(): Oops, attempted engagement has been rejected!");
					endpoint._clearCurrentTimer();
					endpoint._resetEngagement();
					endpoint.onEngagementFailed("rejected");
					return("registered");
				}
			},
			disengage: {
				action(endpoint, evtData) {
					console.log("engagingwithoffer-disengage(): Oops, attempted engagement has been rejected!");
					endpoint._clearCurrentTimer();
					endpoint._resetEngagement();
					endpoint.onEngagementFailed("rejected");
					return("registered");
				}
			},
			engagementerror: {
				action(endpoint, evtData) {
					console.log("engagingwithoffer-engagementerror(): Oops, error during attempted enagagement: <<" + evtData + ">>.");
					endpoint._clearCurrentTimer();
					endpoint._resetEngagement();
					endpoint.onEngagementFailed("rejected");
					return("registered");
				}
			},
			timeout: {
				action(endpoint, evtData) {
					console.log("engagingwithoffer-timeout(): Timeout waiting for engagement answer.");
					endpoint._clearCurrentTimer();
					endpoint._resetEngagement();
					endpoint.onEngagementFailed("timeout");
					return("registered");
				}
			},
			disconnect: {
				action(endpoint, evtData) {
					console.log("engagingwithoffer-disconnect(): WEBSOCKET HAS BEEN CLOSED FROM REMOTE SIDE");
					endpoint._clearCurrentTimer();
					endpoint._resetEngagement();
					endpoint._startTimer(10000);
					endpoint.onEngagementFailed("rejected");
					endpoint.onDisconnected("remote");
					return("idle");
				}
			}
		}
	},

	engagingwithanswer: {
		onEnter() { console.log("engagingwithanswer: entering"); },
		onExit() { console.log("engagingwithanswer: exiting"); },
		eventCallbacks: {
			engagementack: {
				action(endpoint, evtData) {
					endpoint._clearCurrentTimer();
					console.log("engagingwithanswer-engagementack(): Got the ack.");
					endpoint.onEngagementSuccessful();
					return("engaged");
				}
			},
			disengage: {
				action(endpoint, evtData) {
					console.log("engagingwithanswer-disengage(): Timeout waiting for engagement answer.");
					endpoint._clearCurrentTimer();
					endpoint._resetEngagement();
					endpoint.onEngagementFailed("rejected");
					return("registered");
				}
			},
			engagementerror: {
				action(endpoint, evtData) {
					console.log("engagingwithanswer-engagementerror(): Oops, error during attempted enagagement: <<" + evtData + ">>.");
					endpoint._clearCurrentTimer();
					endpoint._resetEngagement();
					endpoint.onEngagementFailed("rejected");
					return("registered");
				}
			},
			timeout: {
				action(endpoint, evtData) {
					console.log("engagingwithanswer-timeout(): Timeout waiting for engagement answer.");
					endpoint._clearCurrentTimer();
					endpoint._resetEngagement();
					endpoint.onEngagementFailed("timeout");
					return("registered");
				}
			},
			disconnect: {
				action(endpoint, evtData) {
					console.log("engagingwithanswer-disconnect(): WEBSOCKET HAS BEEN CLOSED FROM REMOTE SIDE");
					endpoint._clearCurrentTimer();
					endpoint._resetEngagement();
					endpoint._startTimer(10000);
					endpoint.onEngagementFailed("rejected");
					endpoint.onDisconnected("remote");
					return("idle");
				}
			}
		}
	},

	engaged: {
		onEnter() { console.log("engaged: entering"); },
		onExit() { console.log("engaged: exiting"); },
		eventCallbacks: {
			timeout: {
				action(endpoint, evtData) {
					console.log("engaged-timeout(): Timeout waiting for engagement answer???");
					endpoint._clearCurrentTimer();
					return("registered");
				}
			},
			disconnect: {
				action(endpoint, evtData) {
					console.log("engaged-disconnect(): WEBSOCKET HAS BEEN CLOSED FROM REMOTE SIDE");
					endpoint._clearCurrentTimer();
					endpoint._resetEngagement();
					endpoint._startTimer(10000);
					endpoint.onDisengagement();
					endpoint.onDisconnected("remote");
					return("idle");
				}
			},
			disengage: {
				action(endpoint, evtData) {
					console.log("engaged-disengagement(): received disengage message.");
                                        endpoint._clearCurrentTimer();
					endpoint._resetEngagement();
					endpoint.onDisengagement();
					return("registered");
				}
			},
			engagementerror: {
				action(endpoint, evtData) {
					console.log("engaged-engagementerror(): Oops, error during attempted enagagement: <<" + evtData + ">>.");
					endpoint._clearCurrentTimer();
					endpoint._resetEngagement();
					endpoint.onEngagementFailed("rejected");
					return("registered");
				}
			},
			startstopclicked: {
                                action(endpoint, evtData) {
					console.log("engaged-startstopclicked(): Disengage button clicked.");
                                        endpoint._clearCurrentTimer();
					endpoint._sendDisengagement(evtData);
					endpoint._resetEngagement();
					endpoint.onDisengagement();
					return("registered");
                                }
                        }
		}
	},

	disconnecting: {
		onEnter() { console.log("disconnecting: entering"); },
		onExit() { console.log("disconnecting: exiting"); },
		eventCallbacks: {
			disconnect: {
				action(endpoint, evtData) {
					endpoint._clearCurrentTimer();
					endpoint._startTimer(5000);
					endpoint.onDisconnected("remote");
					return("idle");
				}
			},
			timeout: {
				action(endpoint, evtData) {
					console.log("disconnecting-timeout(): Huh? Timeout when disconnecting websocket connection.");
					endpoint._clearCurrentTimer();
					endpoint._startTimer(5000);
					endpoint.onDisconnected("remote");
					return("idle");
				}
			}
		}
	},

	disconnectingstop: {
		onEnter() { console.log("disconnectingstop: entering"); },
		onExit() { console.log("disconnectingstop: exiting"); },
		eventCallbacks: {
			disconnect: {
				action(endpoint, evtData) {
					endpoint._clearCurrentTimer();
					endpoint.onDisconnected("user");
				//	endpoint.onEndpointStopped();
					return("start");
				}
			},
			timeout: {
				action(endpoint, evtData) {
					console.log("disconnectingstop-timeout(): Huh? Timeout when disconnecting websocket connection.");
					endpoint._clearCurrentTimer();
					endpoint.onDisconnected("user");
				//	endpoint.onEndpointStopped();
					return("start");
				}
			}
		}
	}

}








function createGuidentRmcwStateMachine(ep, stateMachineDefinition) {

  const machine = {

        value: stateMachineDefinition.initialState,

        transition(event, eventData) {

                console.log("GuidentRmcwStateMachine::transition(): Current state: <<" + this.value + ">>, Event: <<" + event + ">>.");

                const currentStateDefinition = stateMachineDefinition[this.value];

                const destinationTransition = currentStateDefinition.eventCallbacks[event];

                if (!destinationTransition) {
                        console.log("GuidentRmcwStateMachine::transition(): No transition for state: <<" + this.value + ">> Event: <<" + event + ">>.");
                        return;
                }

                const destinationState = destinationTransition.action(ep, eventData);

                currentStateDefinition.onExit();

                const destinationStateDefinition = stateMachineDefinition[destinationState];

                destinationStateDefinition.onEnter();

                machine.value = destinationState;

                return machine.value;
        }
  }

  return machine;

}









/**
 * Constructs a GuidentVLESMessage. This is the message format that is exchanged with the Guident Vehicle Locator/Engagement server across the WSS connection. The "onNotification(msg)" callback of the  GuidentRmccEndpoint class instance is called for each notification from the server with an instance of this message as a parameter.
 * @class GuidentVLESMessage
 * @classdesc This object represents a workstation endpoint which makes a WSS connection to the Guident Vehicle locator server, and which can facilitate an offer/answer transaction to construct a webrtc multimedia connection to individual vehicle nodes.
 * @param {string} destinationId - The connection ID of the vehicle to which the message is addressed.
 * @param {GuidentMessageTypes} messageType - One of "register", "notify", "engage-offer", "engage-answer", "engage-ack", "takeover", "release", "disengage".
 * @param {GuidentMsgEventTypes} eventType - One of "connected", "registered", "rejected", "engaged", "disengaged", "taken-over", "released", "status", "disconnected", "unknown".
 * @param {GuidentMsgEndpointTypes} endpointType - One of "vehicle", "monitor".
 * @param {GuidentMsgStatusTypes} statusType - One of "green-ok", "yellow-warning", "red-emergency", "unknown".
 * @param {GuidentRmccEndpoint} ep - Endpoint structure containing local variable values.
 * @author Sanjay Kumar
*/
const GuidentVLESMessage = function(destinationId, messageType, eventType, endpointType, statusType, ep) {


}











/**
 * Instantiates a new GuidentRmccEndpoint structure.
 * @class GuidentRmccEndpoint
 * @classdesc This object represents a workstation endpoint which makes a WSS connection to the Guident Vehicle locator server, and which can facilitate an offer/answer transaction to construct a webrtc multimedia connection to individual vehicle nodes.
 * @param {string} name - Authentication username for connection to vehicle locator server.
 * @param {string} pwd - Authentication password for connection to vehicle locator server.
 * @param {string} vehicleLocatorUrl - WSS url to the Guident vehicle locator server, leave null to use default value.
 * @param {RTCConfiguration} webrtcPeerConfig - RTCConfiguration structure, leave null to use default value.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/RTCPeerConnection#RTCConfiguration_dictionary|RTCConfiguration}
 * @author Sanjay Kumar
*/
const GuidentRmccEndpoint = function(name, pwd, vehicleLocatorUrl, iceServers, webrtcPeerConfig, authUsername, authToken) {

	this.vehicleLocatorServerUrl =  "wss://vex.bluepepper.us:8443";
	if ( vehicleLocatorUrl != null ) this.vehicleLocatorServerUrl = vehicleLocatorUrl;

	this.webrtcPeerConfiguration = {
		'iceServers': iceServers,
		'bundlePolicy': 'max-bundle'
	};

	/*
	this.webrtcPeerConfiguration = {
		'iceServers': [
			//{'urls': stunUrls },
			//{'urls': 'stun:stun.bluepepper.us:3478'},
			//{'urls': 'stun:stun.l.google.com:19302'},
			{'urls': "stun:guident.bluepepper.us:3478" },
			{'urls': "turn:guident.bluepepper.us:3478", 'username':  'ninefingers', 'credential': 'youhavetoberealistic' },
		],
		'bundlePolicy': 'max-bundle'
	};
	*/
/*
	this.webrtcPeerConfiguration = {
		'bundlePolicy': 'max-bundle'
	};
*/
	if ( webrtcPeerConfig != null ) this.webrtcPeerConfiguration = webrtcPeerConfig;

	this.stateMachine = createGuidentRmcwStateMachine(this, GuidentRmcwStateMachineDefinition);

	this.websocketConnection = null;
	this.webrtcPeerConnection = null;
	this.timerId = null;
	this.connectionId = null;
	this.endpointId = null;
	this.endpointType = 'monitor';
	this.username = name;
	this.password = pwd;
	this.authUsername = authUsername;
	this.authToken = authToken;
	this.localMessageSequence = 1;
	this.remoteMessageSequence = null;
	this.peerEngagementId = 0;
	this.localStream = null;
	this.localVideoId = null;
	this.remoteVideoId = [ null, null, null, null ];
	this.firstVideoMediaStream = null;
	this.secondVideoMediaStream = null;
	this.thirdVideoMediaStream = null;
	this.remoteControlDataChannel = null;

	this.exclusiveVideoPayloadTypeForMid1 = 0;
	this.exclusiveVideoPayloadTypeForMid2 = 0;
	this.exclusiveVideoPayloadTypeForMid3 = 0;
	this.changeVideoPayloadTypeForMid1 = 0;
	this.changeVideoPayloadTypeForMid2 = 0;
	this.changeVideoPayloadTypeForMid3 = 0;

	console.log("GuidentRmccEndpoint::constructor(): Endpoint structure created.");

}


/**
 * Initializes and starts the GuidentRmccEndpoint and state machine, and begins to attempt to establish a persistant WSS connection to the vehicle locator/engagement service. Note that if a disconnect from the service occurs, the GuidentRmccEndpoint object will continually attempt to reconnect and to maintain a connection persistently until the stop() method is executed. Progress in connecting and registering to the service can be monitored with the onConnecting(), onConnectionError() and onConnected() user-defined callback functions.
 * @method GuidentRmccEndpoint~start
 */
GuidentRmccEndpoint.prototype.start = function() {
	console.log("GuidentRmccEndpoint::start() called.");
	this.stateMachine.transition('startstopclicked');
}


/**
 * Disconnects the GuidentRmccEndpoint from the vehicle locator/engagement service, and will not re-attempt to connect until start() is called again.
 * @method GuidentRmccEndpoint~stop
 */
GuidentRmccEndpoint.prototype.stop = function() {
	console.log("GuidentRmccEndpoint::stop() called.");
	this.stateMachine.transition('startstopclicked');
}


/**
 * Starts the webrtc offer/answer process for engaging with a remote vehicle.
 * @method GuidentRmccEndpoint~engage
 * @param {string} connectionId - Connection ID string value of the remote vehicle. This ID string wil have been collected from notification messages that can be examined as they arrive from the Guident Vehicle Locator/Engagement service by the user-defined onNotify() callback.
 */
GuidentRmccEndpoint.prototype.engage = function(connectionId) {
	console.log("GuidentRmccEndpoint::engage() called with connection id: <<" + connectionId + ">>.");
	this.stateMachine.transition('vehiclebuttonclicked', connectionId);
}

/**
 * Ends the webrtc engagement peer connection with the remote vehicle.
 * @method GuidentRmccEndpoint~disengage
 */
GuidentRmccEndpoint.prototype.disengage = function(connectionId) {
	console.log("GuidentRmccEndpoint::disengage() called.");
	this.stateMachine.transition('startstopclicked', connectionId);
}

/**
 * Set the GuidentRmccEndpoint with the id value of an HTML video object tag, which will be used as a sink for the local camera video stream, once engaged.
 * @method GuidentRmccEndpoint~setLocalVideoId
 * @param {string} id - id parameter value of a video tag
 */
/*
GuidentRmccEndpoint.prototype.setLocalVideoId = function(id) {
	console.log("GuidentRmccEndpoint.setLocalVideoId): Attempting to set the local video tag to be <<" + id + ">>.");
	if ( (id == null ) || (document.getElementById(id) == null) || (document.getElementById(id).nodeName != "VIDEO") ) {
		console.error("GuidentRmccEndpoint.setLocalVideoId(): Oops, this id is not a valid tag to a video object in the DOM.");
		this.localVideoId = null;
	}
	this.localVideoId = id;
}
*/

/**
 * Updates the ice server used for the webRtc connection
 * @param {*} iceServer The ice server object which will be used for the webRtc connection
 */
GuidentRmccEndpoint.prototype.setIceServer = function(iceServer){

  this.webrtcPeerConfiguration = {
		'iceServers': iceServer,
		'bundlePolicy': 'max-bundle'
	};

}

/**
 * Set the GuidentRmccEndpoint with the id value of an HTML video object tag, which will be connected to the video stream arriving from a remote vehicle, once engaged.
 * All three camera positions must be set to a video element tag before calling the engage() function.
 * @method GuidentRmccEndpoint~setRemoteVideoId
 * @param {GuidentCameraPositions} cameraIndex - Indicates which camera stream from the vehicle, one of FRONT_CAMERA_LEFT, FRONT_CAMERA_RIGHT, REAR_CAMERA
 * @param {string}  - The "id" parameter of an HTML video element where the stream will be shown on the screen.
 */
GuidentRmccEndpoint.prototype.setRemoteVideoId = function(cameraIndex, videoTagId) {

	if ( cameraIndex < 0 || cameraIndex >= GuidentCameraPositions.CAMERA_POSITIONS_LENGTH ) {
		console.log("GuidentRmccEndpoint.setRemoteVideoId): Huh? Invalid video tag index.");
	}

	if ( this.remoteVideoId[cameraIndex] != null ) {
		if ( document.getElementById(this.remoteVideoId[cameraIndex]) != null && document.getElementById(this.remoteVideoId[cameraIndex]).nodeName == "VIDEO" ) {
			console.log("GuidentRmccEndpoint.setRemoteVideoId): Removing video feed from currently set video tag.");
			document.getElementById(this.remoteVideoId[cameraIndex]).srcObject = null;
		}
		this.remoteVideoId[cameraIndex] = null;
	}

	console.log("GuidentRmccEndpoint.setRemoteVideoId): Attempting to set the remote video tag for stream # " + cameraIndex + "  to be <<" + videoTagId + ">>.");
	if ( (videoTagId == null) || (document.getElementById(videoTagId) == null) ) { // || document.getElementById(id).nodeName != "VIDEO" ) {
		console.error("GuidentRmccEndpoint.setRemoteVideoId(): Oops, this id is not a valid tag to a video object in the DOM.");
		this.remoteVideoId[cameraIndex] = null;
	}

	this.remoteVideoId[cameraIndex] = videoTagId;
}



GuidentRmccEndpoint.prototype.nullVideoStreams = function() {
	console.log("GuidentRmccEndpoint.resetVideoStreams(): Will set all the video streams to null srcObject.");
	for ( var i = 0; i < GuidentCameraPositions.CAMERA_POSITIONS_LENGTH; i++ ) {
		if ( this.remoteVideoId[i] != null && document.getElementById(this.remoteVideoId[i]) != null && document.getElementById(this.remoteVideoId[i]).nodeName == "VIDEO" ) {
			document.getElementById(this.remoteVideoId[i]).srcObject = null;
		}
	}
}


GuidentRmccEndpoint.prototype.resetVideoStreams = function() {

	console.log("GuidentRmccEndpoint.resetVideoStreams(): Will set the video streams to the newly set video tag id's");

	for ( var i = 0; i < GuidentCameraPositions.CAMERA_POSITIONS_LENGTH; i++ ) {
		if ( this.remoteVideoId[i] != null && document.getElementById(this.remoteVideoId[i]) != null && document.getElementById(this.remoteVideoId[i]).nodeName == "VIDEO" ) {
			document.getElementById(this.remoteVideoId[i]).srcObject = null;
		}
	}

	if ( this.remoteVideoId[0] != null && document.getElementById(this.remoteVideoId[0]) != null && document.getElementById(this.remoteVideoId[0]).nodeName == "VIDEO" ) {
		document.getElementById(this.remoteVideoId[0]).srcObject = this.firstVideoMediaStream;
	}

	if ( this.remoteVideoId[1] != null && document.getElementById(this.remoteVideoId[1]) != null && document.getElementById(this.remoteVideoId[1]).nodeName == "VIDEO" ) {
		document.getElementById(this.remoteVideoId[1]).srcObject = this.secondVideoMediaStream;
	}

	if ( this.remoteVideoId[2] != null && document.getElementById(this.remoteVideoId[2]) != null && document.getElementById(this.remoteVideoId[2]).nodeName == "VIDEO" ) {
		document.getElementById(this.remoteVideoId[2]).srcObject = this.thirdVideoMediaStream;
	}

}




GuidentRmccEndpoint.prototype.swapVideos = function() {

	if ( this.firstVideoMediaStream == null || this.secondVideoMediaStream == null ) {
		console.error("GuidentRmccEndpoint::swapVideos(): Oops, the media streams aren't set up.");
	}

	document.getElementById(this.remoteVideoId[0]).srcObject = null;
	document.getElementById(this.remoteVideoId[1]).srcObject = null;

	var temp = this.firstVideoMediaStream;
	this.firstVideoMediaStream = this.secondVideoMediaStream;
	this.secondVideoMediaStream = temp;

	document.getElementById(this.remoteVideoId[0]).srcObject = this.firstVideoMediaStream;
	document.getElementById(this.remoteVideoId[1]).srcObject = this.secondVideoMediaStream;

	console.log("GuidentRmccEndpoint::swapVideos(): Swapped!");
}


GuidentRmccEndpoint.prototype.setVehicleCameraConfiguration = function(destinationId, cameraViewIndex) {

        var msg = new Object();

	if ( destinationId == null || cameraViewIndex == null || cameraViewIndex < 0 || cameraViewIndex > 2 ) {
		console.log("GuidentRmccEndpoint::setVehicleCameraConfiguration(): Parameter error!");
	}

        msg.messageType = "notify";

        msg.connectionId = this.connectionId;
        if ( destinationId != null ) {
                msg.peerConnectionId = destinationId;
        } else {
		return;
	}


	if ( cameraViewIndex == 0 ) {
		msg.name = "cameraView_0";
	} else if ( cameraViewIndex == 1 ) {
		msg.name = "cameraView_1";
	} else if ( cameraViewIndex == 2 ) {
		msg.name = "cameraView_2";
	} else {
		console.log("GuidentRmccEndpoint::setVehicleCameraConfiguration(): Parameter error!");
		return;
	}

        if ( msg.endpointId != null ) msg.endpointId = this.endpointId;
        msg.endpointType = this.endpointType;
        msg.eventType = "command";
        msg.sequence = this.localMessageSequence++;

        var str = JSON.stringify(msg);

        console.log("GuidentRmccEndpoint::setVehicleCameraConfiguration(): Sending: <<" +  str + ">>.");
        this.websocketConnection.send(str);

}



GuidentRmccEndpoint.prototype.sendRemoteControlMessage = function(msg) {
  	console.debug('GuidentRmccEndpoint::sendRemoteControlMessage', msg)
	if ( msg != null && this.remoteControlDataChannel != null && this.remoteControlDataChannel.readyState == "open" ) {
		this.remoteControlDataChannel.send(msg);
	} else {
		console.error("GuidentRmccEndpoint::sendRemoteControlMessage(): Error sending remote control message on data channel.");
	}

}


GuidentRmccEndpoint.prototype.setAuthenticationCredentials = function(authUsername, authToken) {
	this.authUsername = authUsername;
	this.authToken = authToken;
}


/**
 * User-defined callback which will be called when the endpoint is attempting to connect to the Guident vehicle locator service.
 * @name GuidentRmccEndpoint#onConnecting
 * @method GuidentRmccEndpoint#onConnecting
 */
GuidentRmccEndpoint.prototype.onConnecting = function() {
	console.log("GuidentRmccEndpoint::onConnecting(): not implemented.");
}

/**
 * User-defined callback which will be called when the endpoint is successfully connected to the Guident vehicle locator service.
 * @method GuidentRmccEndpoint~onConnectionSuccessful
 */
GuidentRmccEndpoint.prototype.onConnectionSuccessful = function() {
	console.log("GuidentRmccEndpoint::onConnectionSuccessful(): not implemented.");
}

/**
 * User-defined callback which will be called when the endpoint failed to connect to to the Guident vehicle locator service.
 * @method GuidentRmccEndpoint~onConnectionFailed
 * @param {string} err - Error type, "timeout", "refused", "config", "unknown"
 */
GuidentRmccEndpoint.prototype.onConnectionFailed = function(err) {
	console.log("GuidentRmccEndpoint::onConnectionFailed(): not implemented, called with err: " + err);
}

/**
 * User-defined callback which will be called when the endpoint becomes disconnected from the Guident vehicle locator service.
 * @method GuidentRmccEndpoint~onDisconnected
 * @param {string} reason - Reason for disconnection, "remote", "user"
 */
GuidentRmccEndpoint.prototype.onDisconnected = function(reason) {
	console.log("GuidentRmccEndpoint::onDisconnected(): not implemented, called with reason: " + reason);
}

/**
 * User-defined callback which will be called when the endpoint's registration attempt is rejected.
 * @method GuidentRmccEndpoint~onRegistrationFailed
 */
GuidentRmccEndpoint.prototype.onRegistrationFailed = function() {
	console.log("GuidentRmccEndpoint::onRegistrationFailed(): not implemented.");
}

/**
 * User-defined callback which will be called when the endpoint's registration attempt is successful.
 * @method GuidentRmccEndpoint~onRegistrationSuccessful
 */
GuidentRmccEndpoint.prototype.onRegistrationSuccessful = function() {
	console.log("GuidentRmccEndpoint::onRegistrationSuccessful(): not implemented.");
}



/**
 * User-defined callback which will be called when the endpoint is attempting to engage a vehicle.
 * @method GuidentRmccEndpoint~onEngaging
 */
GuidentRmccEndpoint.prototype.onEngaging = function() {
	console.log("GuidentRmccEndpoint::onEngaging(): not implemented.");
}

/**
 * User-defined callback which will be called when a vehicle engagement attempt fails.
 * @method GuidentRmccEndpoint~onEngagementFailed
 * @param {string} err - Error type, "timeout", "refused", "config", "unknown"
 */
GuidentRmccEndpoint.prototype.onEngagementFailed = function(err) {
	console.log("GuidentRmccEndpoint::onEngagementFailed(): not implemented, called with err: " + err);
}


/**
 * User-defined callback which will be called when the endpoint is attempting to engage a vehicle.
 * @method GuidentRmccEndpoint~onEngagementSuccessful
 */
GuidentRmccEndpoint.prototype.onEngagementSuccessful = function() {
	console.log("GuidentRmccEndpoint::onEngagementSuccessful(): not implemented.");
}

/**
 * User-defined callback which will be called when the endpoint becomes unengaged from a vehicle after a successful engagement.
 * @method GuidentRmccEndpoint~onDisengagement
 * @param {string} reason - Reason for disengagement, "remote", "user"
 */
GuidentRmccEndpoint.prototype.onDisengagement = function(evt) {
	console.log("GuidentRmccEndpoint::onDisengagement(): not implemented, called with reason: " + reason);
}


/**
 * User-defined callback which will be called when the endpoint recieves a GuidentVLESMessage from the server for a remote vehicle.
 * @method GuidentRmccEndpoint~onNotification
 * @param {GuidentVLESMessage} evtMessage - A GuidentVLESMessage message structure, from which the connection ID, endpoint ID, status, event type, etc can be retrieved and stored.
 */
GuidentRmccEndpoint.prototype.onNotification = function(msg) {
        console.log("GuidentRmccEndpoint::onNotification(): not implemented");
}


/**
 * User-defined callback which will be called when the endpoint wants the user interface to know about a status message
 * @method GuidentRmccEndpoint~onNotification
 * @param {LatLon} latlon - A latlon structure.
 */
GuidentRmccEndpoint.prototype.onNewLocation = function(latlon) {
        console.log("GuidentRmccEndpoint::onNewLocation(): not implemented");
}


/**
 * User-defined callback which will be called when a message is received on the data channel
 *
 */
GuidentRmccEndpoint.prototype.onDataChannelMessage = function(messageEvent) {
        console.log("GuidentRmccEndpoint::onDataChannelMessage(): not implemented");
}

GuidentRmccEndpoint.prototype.onDataChannelOpen = function(messageEvent) {
        console.log("GuidentRmccEndpoint::onDataChannelOpen(): not implemented");
}

GuidentRmccEndpoint.prototype.onDataChannelClose = function(messageEvent) {
        console.log("GuidentRmccEndpoint::onDataChannelClose(): not implemented");
}

GuidentRmccEndpoint.prototype.onDataChannelError = function(messageEvent) {
        console.log("GuidentRmccEndpoint::onDataChannelError(): not implemented");
}



// private functions
//
GuidentRmccEndpoint.prototype._checkIncomingMessageSequence = function(msg) {
	return(true);
}


GuidentRmccEndpoint.prototype._checkIncomingMessageConnectionId = function(msg) {

       	if ( msg != null && msg.connectionId != undefined ) {
                if ( this.connectionId == null ) {
                        this.connectionId = msg.connectionId;
			console.log("OK");
                        return(true);
                } else if ( msg.connectionId == this.connectionId ) {
			console.log("OKOK");
                        return(true);
                }
       	}
	// console.log("OKOKOK");
       	return(false);
}



GuidentRmccEndpoint.prototype._onWssConnectionOpen = function(evt) {
	console.log("GuidentRmccEndpoint::_onWssConnectionOpen(): " +  evt);
	this.guidentRmccEndpoint.stateMachine.transition('connect');
}


GuidentRmccEndpoint.prototype._onWssConnectionClose = function(evt) {
        console.log("GuidentRmccEndpoint::_onWssConnectionClose(): Code: " +  evt.code + " Reason: " + evt.reason + " Clean?: " + evt.wasClean);
	this.guidentRmccEndpoint.stateMachine.transition('disconnect');
}

GuidentRmccEndpoint.prototype._onWssConnectionError = function(evt) {
        console.log("GuidentRmccEndpoint::_onWssConnectionError(): " +  evt);
	this.guidentRmccEndpoint.stateMachine.transition('connectionerror');
}



GuidentRmccEndpoint.prototype._onWssConnectionMessage = function(evt) {
        //console.log("GuidentRmccEndpoint::_onWssConnectionMessage(): Got this: <<" + evt.data + ">>.");
		if (evt.data != undefined && evt.data != null) {

                var msg = JSON.parse(evt.data);

                var isMine = false;

                if ( msg == null ) {
                        console.log("GuidentRmccEndpoint::_onWssConnectionMessage(): can't parse the message.");
                        return;
                }


		if ( this.guidentRmccEndpoint == undefined || this.guidentRmccEndpoint == null ) {
                        console.log("GuidentRmccEndpoint::_onWssConnectionMessage(): can't retrieve the endpoint structure from the websocket.");
                        return;
		}


                if ( ! this.guidentRmccEndpoint._checkIncomingMessageSequence(msg) ) {
                        console.log("GuidentRmccEndpoint::_onWssConnectionMessage(): Invalid message sequence id.");
                        return;
                }


                isMine = this.guidentRmccEndpoint._checkIncomingMessageConnectionId(msg);

                if ( !isMine && (msg.messageType != "notify")) {
                        console.log("GuidentRmccEndpoint::_onWssConnectionMessage(): Invalid message.");
                        return;
                }

                if ( msg.messageType == "notify" ) {

                        if ( isMine ) {
                                if ( msg.eventType == "connected" ) {
                                        this.guidentRmccEndpoint.stateMachine.transition('connectednotification');
                                } else if ( msg.eventType == "registered" ) {
                                        this.guidentRmccEndpoint.endpointType = msg.endpointType;
                                        this.guidentRmccEndpoint.endpointId = msg.endpointId;
                                        this.guidentRmccEndpoint.stateMachine.transition('registerednotification');
                                } else if ( msg.eventType == "rejected" ) {
                                        this.guidentRmccEndpoint.stateMachine.transition('rejectednotification');
                                } else {
                                        console.log("GuidentRmccEndpoint::_onWssConnectionMessage(): No transition for this message.");
                                }
                        } else {
                                if ( msg.endpointType == "vehicle" ) {
                                        this.guidentRmccEndpoint.onNotification(msg);
                                }
                        }

                } else if ( msg.messageType == "engage-offer" ) {
                        this.guidentRmccEndpoint.stateMachine.transition('engagementoffer', msg);
                } else if ( msg.messageType == "engage-answer" ) {
                        this.guidentRmccEndpoint.stateMachine.transition('engagementanswer', msg);
                } else if ( msg.messageType == "engage-ack" ) {
                        this.guidentRmccEndpoint.stateMachine.transition('engagementack', msg);
                } else if ( msg.messageType == "takeover" ) {
                        this.guidentRmccEndpoint.stateMachine.transition('takeover', msg);
                } else if ( msg.messageType == "disengage" ) {
                        this.guidentRmccEndpoint.stateMachine.transition('disengage', msg);
                } else if ( msg.messageType == "release" ) {
                        this.guidentRmccEndpoint.stateMachine.transition('release', msg);
                } else {
                        console.log("GuidentRmccEndpoint::_onWssConnectionMessage(): huh?? Invalid message: <<" + msg + ">>.");
                }
        }
}







GuidentRmccEndpoint.prototype._startConnection = function() {
        console.log("GuidentRmccEndpoint::startConnection(): Opening connection to URL: <<" +  this.vehicleLocatorServerUrl + ">>.");

        this.localMessageSequence = 1;
        this.remoteMessageSequence = null;
        this.connectionId = null;

        this.websocketConnection = new WebSocket(this.vehicleLocatorServerUrl);
	this.websocketConnection.guidentRmccEndpoint = this;
        this.websocketConnection.onopen = this._onWssConnectionOpen;
        this.websocketConnection.onmessage = this._onWssConnectionMessage;
        this.websocketConnection.onclose = this._onWssConnectionClose;
        this.websocketConnection.onerror = this._onWssConnectionError;

}


GuidentRmccEndpoint.prototype._closeConnection = function() {
        console.log("GuidentRmccEndpoint::_closeConnection(): Closing server connection.");
        this.websocketConnection.close();
        this.localMessageSequence = 1;
        this.remoteMessageSequence = null;
        this.connectionId = null;
}


GuidentRmccEndpoint.prototype._startTimer =  function(timeout) {
	console.log("GuidentRmccEndpoint::_startTimer() with " + timeout + " ms.");
	if ( this.timerId != null ) {
		clearTimeout(this.timerId);
		this.timerId = null;
	}
	this.timerId = setTimeout(function(ep){ ep.stateMachine.transition('timeout'); }, timeout, this);
	return;
}


GuidentRmccEndpoint.prototype._clearCurrentTimer =  function() {
	console.log("GuidentRmccEndpoint::_clearCurrentTimer()");
	if (this.timerId == null ) return;
	clearTimeout(this.timerId);
	this.timerId = null;
	return;
}



GuidentRmccEndpoint.prototype._sendMessage = function(messageType, destinationId, eventType, eventData) {

  var msg = new Object();

  msg.messageType = messageType;
  msg.connectionId = this.connectionId;

  if ( destinationId != null ) {
          msg.peerConnectionId = destinationId;
  }

  if (msg.endpointId != null ) msg.endpointId = this.endpointId;

  msg.endpointType = this.endpointType;
  msg.name = this.username;

  if ( messageType == "register" ) {``
    msg.credential = this.password;
    msg.authenticationUsername = this.authUsername;
    msg.authenticationToken = this.authToken;
  }

  if ( messageType == "notify" ) {
    if ( eventType ) {
      msg.eventType = eventType;
      msg.status = GuidentMsgStatusTypes.UNKNOWN; // fix me
      if ( eventData ) {
        msg.eventData = eventData;
      }
    } else {
      msg.eventType = "status";
              msg.status = GuidentMsgStatusTypes.UNKNOWN; // fix me
    }
  }

  if ( messageType == "engage-offer" || messageType == "engage-answer" ) {
          if ( this.webrtcPeerConnection != null ) {
            msg.iceServers = this.webrtcPeerConfiguration.iceServers;
            msg.sessiondescription = this.webrtcPeerConnection.localDescription;
          }
  }

  msg.sequence = this.localMessageSequence++;

  var str = JSON.stringify(msg);

  console.log("GuidentRmccEndpoint::_sendMessage(): Sending: <<" +  str + ">>.");
  this.websocketConnection.send(str);

	return;
}


var localAudioStream = null;

async function getLocalAudioStream() {
	try{
		localAudioStream = await navigator.mediaDevices.getUserMedia({audio: true, video: false});
	} catch(e) { console.error("GuidentRmccEndpoint::localAudioStreams: Audio Device Not Fount. Make sure you microphone is connected and enabled");}
}


getLocalAudioStream();


GuidentRmccEndpoint.prototype._startPeerEngagementOffer = function(peerId) {

	console.log("GuidentRmccEndpoint._startPeerEngagementOffer(): Attempting engagement with peer id: <<" + peerId + ">>.");

	var constraints = {
		video: true,
		audio: true,
	};

/*
	if ( this.localVideoId == null || document.getElementById(this.localVideoId) == null || document.getElementById(this.localVideoId).nodeName != "VIDEO" ) {
		console.error("GuidentRmccEndpoint._startPeerEngagementOffer(): Need to set local video element.");
		return(false);
	}
*/

	if ( this.remoteVideoId[0] == null || document.getElementById(this.remoteVideoId[0]) == null || document.getElementById(this.remoteVideoId[0]).nodeName != "VIDEO" ) {
		console.error("GuidentRmccEndpoint._startPeerEngagementOffer(): Need to set remote video element for index 0.");
		return(false);
	}

	if ( this.remoteVideoId[1] == null || document.getElementById(this.remoteVideoId[1]) == null || document.getElementById(this.remoteVideoId[1]).nodeName != "VIDEO" ) {
		console.error("GuidentRmccEndpoint._startPeerEngagementOffer(): Need to set remote video element for index 1.");
		return(false);
	}

	if ( this.remoteVideoId[2] == null || document.getElementById(this.remoteVideoId[2]) == null || document.getElementById(this.remoteVideoId[2]).nodeName != "VIDEO" ) {
		console.error("GuidentRmccEndpoint._startPeerEngagementOffer(): Need to set remote video element for index 2.");
		return(false);
	}

	//document.getElementById('videoscreens').style.display = "block";
	//document.getElementById('localVideo').srcObject = stream;

	this.webrtcPeerConnection = new RTCPeerConnection(this.webrtcPeerConfiguration);

	this.webrtcPeerConnection.ontrack = function(ev) {

		console.log("Got a track! Id: <<" + ev.track.id + ">> Kind: <<" + ev.track.kind + ">> Mid: <<" + ev.transceiver.mid + ">> Label: <<" + ev.track.label + ">> Streams length: <<" + ev.streams.length + ">> Stream Id: <<" + ev.streams[0].id + ">> #Tracks in stream: <<" + ev.streams[0].getTracks().length + ">>" );

		/*
		if ( ev.transceiver.mid == "1" ) {
			this.firstVideoMediaStream = new MediaStream([ev.streams[0].getAudioTracks()[0], ev.track]);
			console.log("New stream id: <<" + this.firstVideoMediaStream.id + ">> " + this.firstVideoMediaStream.getTracks().length);
			document.getElementById(this.remoteVideoId[0]).srcObject = this.firstVideoMediaStream;
		*/
		if ( ev.transceiver.mid == "0" ) {
			if ( this.firstVideoMediaStream == null ) {
				this.firstVideoMediaStream = new MediaStream([ ev.track ]);
			} else {
				this.firstVideoMediaStream.addTrack(ev.track);
				this.webrtcPeerConnection.addTrack(ev.track, this.firstVideoMediaStream);
			}
		} else if ( ev.transceiver.mid == "1" ) {
			if ( this.firstVideoMediaStream == null ) {
				this.firstVideoMediaStream = new MediaStream([ ev.track ]);
			} else {
				this.firstVideoMediaStream.addTrack(ev.track);
				this.webrtcPeerConnection.addTrack(ev.track, this.firstVideoMediaStream);
			}
			document.getElementById(this.remoteVideoId[0]).srcObject = this.firstVideoMediaStream;
		} else if ( ev.transceiver.mid == "2" ) {
			this.secondVideoMediaStream = new MediaStream([ ev.track ]);
			console.log("New stream id: <<" + this.secondVideoMediaStream.id + ">> " + this.secondVideoMediaStream.getTracks().length);
			document.getElementById(this.remoteVideoId[1]).srcObject = this.secondVideoMediaStream;
		} else if( ev.transceiver.mid == "3" ) {
			this.thirdVideoMediaStream = new MediaStream([ ev.track ]);
			console.log("New stream id: <<" + this.thirdVideoMediaStream.id + ">> " + this.thirdVideoMediaStream.getTracks().length);
			document.getElementById(this.remoteVideoId[2]).srcObject = this.thirdVideoMediaStream;
		}

	}.bind(this);


	console.log("GuidentRmccEndpoint._startPeerEngagementOffer(): Adding transceivers.");
	//this.webrtcPeerConnection.addTransceiver("audio", { direction: "sendrecv" } );
	localAudioStream.getTracks().forEach(track => this.webrtcPeerConnection.addTransceiver(track, { direction: "sendrecv" }));
	this.webrtcPeerConnection.addTransceiver("video", { direction: "recvonly" } );
	this.webrtcPeerConnection.addTransceiver("video", { direction: "recvonly" } );
	this.webrtcPeerConnection.addTransceiver("video", { direction: "recvonly" } );

	console.log("GuidentRmccEndpoint._startPeerEngagementOffer(): Setting up data channel.");
	// data channel stuff
	this.remoteControlDataChannel = this.webrtcPeerConnection.createDataChannel("foo");
	if ( this.remoteControlDataChannel != null ) {
		this.remoteControlDataChannel.onopen = function(event) {
			console.log("GuidentRmccEndpoint.remoteControlDataChannel.onopen(): The data channel is now open.");
      		this.onDataChannelOpen()
			// this.sendRemoteControlMessage(JSON.stringify({engaged: true, transmitTimestamp: Date.now()}));
		}.bind(this);
		this.remoteControlDataChannel.onmessage = function(event) {
			//console.log("GuidentRmccEndpoint.remoteControlDataChannel.onmessage(): The data channel has received a message: <<" + event.data + ">>.");
			this.onDataChannelMessage(event);
		}.bind(this);
		this.remoteControlDataChannel.onclose = function(event) {
			console.log("GuidentRmccEndpoint.remoteControlDataChannel.onclose(): The data channel is now closed.");
      		this.onDataChannelClose();
      		this.remoteControlDataChannel = null;
		}.bind(this);
		this.remoteControlDataChannel.onerror = function(event) {
			console.error("GuidentRmccEndpoint.remoteControlDataChannel.onerror(): Oops, the data channel has generated an error.");
      		this.onDataChannelError();
			this.remoteControlDataChannel = null;
		}.bind(this);
	}

	console.log("GuidentRmccEndpoint._startPeerEngagementOffer(): Creating offer and sending engagement request.");
	this.webrtcPeerConnection.createOffer().then(function(description) {

		// fix me!!!
		var sdp = description.sdp;
		var newSdp = exclusivizeCodecInSdp(sdp, 1, this.exclusiveVideoPayloadTypeForMid1);  // 98?
		newSdp = exclusivizeCodecInSdp(newSdp, 2, this.exclusiveVideoPayloadTypeForMid2);  // 108??
		newSdp = exclusivizeCodecInSdp(newSdp, 3, this.exclusiveVideoPayloadTypeForMid3);  // 125?
		newSdp = changePayloadTypeForMid(newSdp, 1, this.changeVideoPayloadTypeForMid1);
		newSdp = changePayloadTypeForMid(newSdp, 2, this.changeVideoPayloadTypeForMid2);
		newSdp = changePayloadTypeForMid(newSdp, 3, this.changeVideoPayloadTypeForMid3);
		description.sdp = newSdp;
		return this.webrtcPeerConnection.setLocalDescription(description);

	}.bind(this)).then(function() {

		return new Promise(function(resolve, reject) {
			this.webrtcPeerConnection.onicecandidate = function(iceevt) {
				if ( iceevt.candidate == null ) {
					console.log("GuidentRmccEndpoint._startPeerEngagementOffer::oniceconnectionstatechange(): Completed!");
					resolve("gathering complete");
				} else {
					console.log("GuidentRmccEndpoint._startPeerEngagementOffer::oniceconnectionstatechange(): Got an ice candidate: <<" + iceevt.candidate.candidate + ">>");
				}
			}
			setTimeout(function(){reject("Timeout gathering candidates")}, 65000)
		}.bind(this));

	}.bind(this)).then(function(promiseResult) {
		console.log("GuidentRmccEndpoint._startPeerEngagementOffer(): the wait-for-ice-candidates promise result: <<" + promiseResult + ">>, Sending offer.");
		this._sendMessage("engage-offer", peerId);
	}.bind(this)).catch(function(err) {
		// console.error("GuidentRmccEndpoint._startPeerEngagementOffer(): error creating and sending offer: <<" + err + ">>.");
		this.stateMachine.transition('engagementerror', err);
	});

	this.peerConnectionId = peerId; // set global

	return(true);
}






GuidentRmccEndpoint.prototype._processPeerEngagementAnswer = function(msg) {

	console.log("GuidentRmccEndpoint._processPeerEngagementAnswer(): Attempting  to process answer SDP from remote vehicle with peer id: <<" + msg.peerConnectionId + ">>.");

        if ( msg.messageType != "engage-answer" ) {
                console.log("processPeerEngagementAnswer(): Huh?");
                return(false);
        }

        if ( msg == undefined || msg == null || msg.sessiondescription == undefined || msg.sessiondescription == null || msg.sessiondescription == "" ) {
                console.log("processPeerEngagementAnswer(): Huh? session description is invalid");
                return(false);
        }


        this.webrtcPeerConnection.setRemoteDescription(new RTCSessionDescription(msg.sessiondescription)).then(function() {
                console.log("GuidentRmccEndpoint._processPeerEngagementAnswer()::callBack(): remote answer sdp has been set.");
		this._sendMessage("engage-ack", msg.peerConnectionId);
        }.bind(this)).catch(function(err) {
                console.log("GuidentRmccEndpoint._processPeerEngagementAnswer()::callBack(): Error on setRemoteDescription() : <<" + err + ">>.");
                this.stateMachine.transition('engagementerror', err);
        }.bind(this));

	return(true);
}



GuidentRmccEndpoint.prototype._sendDisengagement = function(peerId) {

	console.log("GuidentRmccEndpoint._sendDisengagement(): Attempting  to send disengage message to peer id: <<" + peerId + ">>.");

	this.sendRemoteControlMessage(JSON.stringify({engaged: false, transmitTimestamp: Date.now()}));
	try {
		this._sendMessage("disengage", peerId);
	} catch(err) {
		console.warn("GuidentRmccEndpoint._sendDisengagement(): Exception thrown when sending the disengagement message, data channel might be closed.");
	}

}




GuidentRmccEndpoint.prototype._resetEngagement = function() {

	try {
		console.log("GuidentRmccEndpoint._resetEngagement(): Ressetting webrtc peer connection.");

		if ( this.localVideoId != null && document.getElementById(this.localVideoId) != null && document.getElementById(this.localVideoId).nodeName == "VIDEO" ) {
			document.getElementById(this.localVideoId).srcObject = null;
		}

		if ( this.remoteVideoId[0] != null || document.getElementById(this.remoteVideoId[0]) != null && document.getElementById(this.remoteVideoId[0]).nodeName == "VIDEO" ) {
			document.getElementById(this.remoteVideoId[0]).srcObject = null;
		}
		if ( this.remoteVideoId[1] != null || document.getElementById(this.remoteVideoId[1]) != null && document.getElementById(this.remoteVideoId[1]).nodeName == "VIDEO" ) {
			document.getElementById(this.remoteVideoId[1]).srcObject = null;
		}
		if ( this.remoteVideoId[2] != null || document.getElementById(this.remoteVideoId[2]) != null && document.getElementById(this.remoteVideoId[2]).nodeName == "VIDEO" ) {
			document.getElementById(this.remoteVideoId[2]).srcObject = null;
		}

		this.firstVideoMediaStream = null;
		this.secondVideoMediaStream = null;
		this.thirdVideoMediaStream = null;

		if ( this.webrtcPeerConnection != null ) this.webrtcPeerConnection.close();
		this.webrtcPeerConnection = null;

		this.remoteControlDataChannel = null;
		console.log("GuidentRmccEndpoint._resetEngagement(): Done");
	} catch(err) {
		console.warn("GuidentRmccEndpoint._resetEngagement(): Oops, exception thrown!");
	}

}




GuidentRmccEndpoint.prototype.setOfferVideoPayloadTypeManipulations = function(exclusivePtMid1, exclusivePtMid2, exclusivePtMid3, changePtMid1, changePtMid2, changePtMid3) {

	try {
		if ( exclusivePtMid1 != undefined && exclusivePtMid1 != null ) this.exclusiveVideoPayloadTypeForMid1 = exclusivePtMid1;
		if ( exclusivePtMid2 != undefined && exclusivePtMid2 != null ) this.exclusiveVideoPayloadTypeForMid2 = exclusivePtMid2;
		if ( exclusivePtMid3 != undefined && exclusivePtMid3 != null ) this.exclusiveVideoPayloadTypeForMid3 = exclusivePtMid3;
		if ( changePtMid1 != undefined && changePtMid1 != null ) this.changeVideoPayloadTypeForMid1 = changePtMid1;
		if ( changePtMid2 != undefined && changePtMid2 != null ) this.changeVideoPayloadTypeForMid2 = changePtMid2;
		if ( changePtMid3 != undefined && changePtMid3 != null ) this.changeVideoPayloadTypeForMid3 = changePtMid3;
	} catch(err) {
		console.warn("GuidentRmccEndpoint.prototype.setOfferVideoPayloadTypeManipulations")
	}
}




var exclusivizeCodecInSdp = function(sdp, mediaSectionIndex, payloadType) {

	var sdpLines = sdp.split('\r\n');

	var mLineIndices = [ ];
	for (var i = 0; i < sdpLines.length; i++) {
		if (sdpLines[i].search('m=audio') !== -1) {
			mLineIndices.push(i);
		}
		if (sdpLines[i].search('m=video') !== -1) {
			mLineIndices.push(i);
		}
	}
	mLineIndices.push(sdpLines.length);

	if ( ( mediaSectionIndex < 0 ) || ( mediaSectionIndex > (mLineIndices.length - 2) ) ) {
		console.log("exclusivizeCodecInSdp(): Oops, this SDP doesn't have a " + mediaSectionIndex + "th m= section.");
		return(sdp);
	}

	var startingLineIdx = mLineIndices[mediaSectionIndex];
	var endingLineIdx = mLineIndices[mediaSectionIndex+1];


	var payloadTypeStr = " " + payloadType;

	if ( sdpLines[startingLineIdx].search(payloadTypeStr) === -1 ) {
		console.log("exclusivizeCodecInSdp(): Oops, this SDP's m= section # " + mediaSectionIndex + " doesn't have a " + payloadTypeStr + " payload number.");
		return(sdp);
	}

	payloadTypeStr = "" + payloadType + "";

	var elements = sdpLines[startingLineIdx].split(' ');
	var replaceElements = [ elements[0], elements[1], elements[2], payloadTypeStr ];

	sdpLines[startingLineIdx] = replaceElements.join(' ');

	var returnSdpLines = [ ];

	for ( var j = 0; j < startingLineIdx; j++ ) {
		returnSdpLines.push(sdpLines[j]);
	}

	for ( var j = startingLineIdx; j < endingLineIdx; j++ ) {

		var lineIsOkToKeep = true;

		if ( sdpLines[j].search('a=extmap:4') !== -1 ) {
			lineIsOkToKeep = false;
		}

		if ( sdpLines[j].search('a=rtpmap:') !== -1 ) {
			if ( sdpLines[j].search('a=rtpmap:' + payloadTypeStr) === -1 ) {
				lineIsOkToKeep = false;
			}
		}
		if ( sdpLines[j].search('a=fmtp:') !== -1 ) {
			if ( sdpLines[j].search('a=fmtp:' + payloadTypeStr) === -1 ) {
				lineIsOkToKeep = false;
			}
		}
		if ( sdpLines[j].search('a=rtcp-fb:') !== -1 ) {
			if ( sdpLines[j].search('rtcp-fb:' + payloadTypeStr) === -1 ) {
				lineIsOkToKeep = false;
			}
		}
		if ( lineIsOkToKeep ) {
			returnSdpLines.push(sdpLines[j]);
		}
	}

	for ( var j = endingLineIdx; j < mLineIndices[mLineIndices.length-1]; j++ ) {
		returnSdpLines.push(sdpLines[j]);
	}


	var newSdp = returnSdpLines.join('\r\n');

	return newSdp;
}




function changePayloadTypeForMid(sdp, mid, newpt) {

	var sdpLines = sdp.split('\r\n');

	var mLineIndices = [ ];
	for (var i = 0; i < sdpLines.length; i++) {
		if (sdpLines[i].search('m=audio') !== -1) {
				mLineIndices.push(i);
		}
		if (sdpLines[i].search('m=video') !== -1) {
				mLineIndices.push(i);
		}
	}
	mLineIndices.push(sdpLines.length);

	var startingLineIdx = mLineIndices[mid];
	var endingLineIdx = mLineIndices[mid+1];

	var mlinePieces = sdpLines[startingLineIdx].split(' ');
	if ( mlinePieces.length != 4 ) {
		console.error("changePayloadTypeForMid() Oops, can't process mline: <<%s>>.", sdpLines[startingLineIdx]);
		return(sdp);
	}

	if ( parseInt(mlinePieces[mlinePieces.length-1]) == NaN ) {
		console.error("changePayloadTypeForMid() Oops, can't process mline: <<%s>>.", sdpLines[startingLineIdx]);
		return(sdp);
	}

	var oldpt = parseInt(mlinePieces[mlinePieces.length-1]);

	var newMline = "";
	for ( var i = 0; i < mlinePieces.length-1; i++ ) {
		newMline += mlinePieces[i];
		newMline += " ";
	}

	newMline += newpt;

	sdpLines[startingLineIdx] = newMline;

	for ( var i = startingLineIdx; i < endingLineIdx; i++ ) {
				if ( sdpLines[i].search('a=rtpmap:') !== -1 ) {
				let re = new RegExp("a=rtpmap:" + oldpt);
				sdpLines[i] = sdpLines[i].replace(re, "a=rtpmap:" + newpt);
				//console.log("replaced! %s ", sdpLines[i]);
		}
		if ( sdpLines[i].search('a=fmtp:') !== -1 ) {
				let re = new RegExp("a=fmtp:" + oldpt);
				sdpLines[i] = sdpLines[i].replace(re, "a=fmtp:" + newpt);
		}
		if ( sdpLines[i].search('a=rtcp-fb:') !== -1 ) {
				let re = new RegExp("a=rtcp-fb:" + oldpt);
				sdpLines[i] = sdpLines[i].replace(re, "a=rtcp-fb:" + newpt);
		}
	}

	var newSdp = sdpLines.join('\r\n');
	return newSdp;

}



