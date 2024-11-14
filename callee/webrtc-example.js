// ====================================================WebSocket_Connection=======================================================================================
var websocketConnection = new WebSocket("wss://guident.bluepepper.us:8848");
websocketConnection.onopen = function(evt) {
  console.log("JsFiddleWssCallingExample::_onWssConnectionOpen(): CONNECTED!");
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

// ====================================================WebSocket_Connection=======================================================================================
//




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

// const configuration = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}], 'bundlePolicy': 'max-bundle'};
// const configuration = {'iceServers': [{'urls': 'stun:stun.bluepepper.us:3478'}], 'bundlePolicy': 'max-bundle' };
const configuration = {'iceServers': [{'urls': 'stun:stun.tanveerjan.com:5349'}], 'bundlePolicy': 'max-bundle' };

pc = new RTCPeerConnection(configuration);

// onOfferRecieved from the Caller
function onOfferReceived(offer) {
	var constraints = {
                video: true,
                audio: true,
	};

	console.log("testing out console.log")
	pc.ontrack = function(ev) {
		console.log("pc.ontrack(): Got a track! Id: <<" + ev.track.id + ">> Kind: <<" + ev.track.kind + ">> Mid: <<" + ev.transceiver.mid + ">> Label: <<" + ev.track.label + ">> Streams Length: <<" + ev.streams.length + ">>" );
		//remoteAudioStream::1
		if ( ev.transceiver.mid == "0" ) {
			if ( remoteVideoStream == null ) {
				remoteVideoStream = new MediaStream([ ev.track ]);
				pc.addTrack(ev.track, remoteVideoStream);
                console.log("New stream id: <<" + remoteVideoStream.id + ">> # tracks: " + remoteVideoStream.getAudioTracks().length + " New stream.");
			} else {
				pc.addTrack(ev.track, remoteMediaStream);
                console.log("New stream id: <<" + remoteVideoStream.id + ">> # tracks: " + remoteVideoStream.getTracks().length);
			}
			document.getElementById("audioStream").srcObject = remoteVideoStream;
		}
		// remoteVideoStream::1  
		if ( ev.transceiver.mid == "1" ) {
			if ( remoteVideoStream == null ) {
				remoteVideoStream = new MediaStream([ ev.track ]);
                        	console.log("New stream id: <<" + remoteVideoStream.id + ">> # tracks: " + remoteVideoStream.getTracks().length + " New stream.");
			} else {
				remoteVideoStream.addTrack(ev.track);
                        	console.log("New stream id: <<" + remoteVideoStream.id + ">> # tracks: " + remoteVideoStream.getTracks().length);
			}
                        document.getElementById("audioStream").srcObject = remoteVideoStream;
                } 
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
	var msg = { sdp: pc.localDescription };
	websocketConnection.send(JSON.stringify(msg));
}






