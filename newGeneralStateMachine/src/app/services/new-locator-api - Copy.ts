import { Injectable } from '@angular/core';
import { endpoint } from './endpoint';

enum GuidentMessageType {
  REGISTER = "register",
  NOTIFY = "notify",
  ENGAGE_OFFER = "engage-offer",
  ENGAGE_ANSWER = "engage-answer",
  ENGAGE_ACK = "engage-ack",
  TAKEOVER = "takeover",
  RELEASE = "release",
  DISENGAGE = "disengage",
  UNKNOWN = "unknown"
}

enum GuidentMsgEventType {
  CONNECTED = "connected",
  REGISTERED = "registered",
  REJECTED = "rejected",
  ENGAGED = "engaged",
  DISENGAGED = "disengaged",
  TAKEN_OVER = "taken-over",
  RELEASED = "released",
  STATUS = "status",
  COMMAND = "command",
  DISCONNECTED = "disconnected",
  UNKNOWN = "unknown"
}

enum GuidentMsgEndpointType {
  VEHICLE = "vehicle",
  MONITOR = "monitor",
  UNKNOWN = "unknown"
}

enum GuidentMsgStatusType {
  GREEN_OK = "green-ok",
  YELLOW_WARNING = "yellow-warning",
  RED_EMERGENCY = "red-emergency",
  UNKNOWN = "unknown"
}

enum GuidentCameraPositions {
  FRONT_CAMERA_LEFT = 0,
  FRONT_CAMERA_RIGHT,
  REAR_CAMERA,
  CAMERA_POSITIONS_LENGTH
}

interface GuidentVLESMessage {
  destinationId: string;
  messageType: GuidentMessageType;
  eventType: GuidentMsgEventType;
  endpointType: GuidentMsgEndpointType;
  statusType: GuidentMsgStatusType;
  ep: GuidentRmccEndpoint;
}

interface StateMachineDefinition {
  initialState: string;
  [state: string]: any;
}

export class GuidentRmccEndpoint {
  private vehicleLocatorServerUrl: string;
  private webrtcPeerConfiguration: RTCConfiguration;
  private stateMachine: any;
  private websocketConnection: WebSocket | null = null;
  private webrtcPeerConnection: RTCPeerConnection | null = null;
  private timerId: any | null = null;
  private connectionId: string | null = null;
  private peerConnectionId: any;
  private endpointId: string | null = null;
  private endpointType: string = 'monitor';
  private username: string;
  private password: string;
  private authUsername: string;
  private authToken: string;
  private localMessageSequence: number = 1;
  private remoteMessageSequence: number | null = null;
  private peerEngagementId: number = 0;
  private localStream: MediaStream | null = null;
  private localVideoId: string | null = null;
  private remoteVideoId: (string | null)[] = [null, null, null];
  private firstVideoMediaStream: MediaStream | null = null;
  private secondVideoMediaStream: MediaStream | null = null;
  private thirdVideoMediaStream: MediaStream | null = null;
  private remoteControlDataChannel: RTCDataChannel | null = null;

  private exclusiveVideoPayloadTypeForMid1: number = 0;
  private exclusiveVideoPayloadTypeForMid2: number = 0;
  private exclusiveVideoPayloadTypeForMid3: number = 0;
  private changeVideoPayloadTypeForMid1: number = 0;
  private changeVideoPayloadTypeForMid2: number = 0;
  private changeVideoPayloadTypeForMid3: number = 0;
   // guidentRmccEndpoint: any;

  constructor(
    name: string, 
    pwd: string, 
    vehicleLocatorUrl: string | null, 
    iceServers: RTCIceServer[], 
    webrtcPeerConfig: RTCConfiguration | null, 
    authUsername: string, 
    authToken: string
  ) {


    this.username = name;
    this.password = pwd;
    this.authUsername = authUsername;
    this.authToken = authToken;

    this.vehicleLocatorServerUrl = vehicleLocatorUrl || "wss://vex.bluepepper.us:8443";
    
    this.webrtcPeerConfiguration = {
      iceServers: iceServers,
      bundlePolicy: 'max-bundle'
    };

    if (webrtcPeerConfig) {
      this.webrtcPeerConfiguration = webrtcPeerConfig;
    }

    this.stateMachine = this.createGuidentRmcwStateMachine(this, GuidentRmcwStateMachineDefinition);
    console.log("this is the stateMachine checker", this.stateMachine);
  }

  private createGuidentRmcwStateMachine(ep: GuidentRmccEndpoint, stateMachineDefinition: StateMachineDefinition) {
    const machine = {
      value: stateMachineDefinition.initialState,
      transition(event: string, eventData?: any) {
        console.log(`GuidentRmcwStateMachine::transition(): Current state: <<${this.value}>>, Event: <<${event}>>.`);
        const currentStateDefinition = stateMachineDefinition[this.value];
        console.log(currentStateDefinition);
        const destinationTransition = currentStateDefinition.eventCallbacks[event];
        if (!destinationTransition) {
          console.log(`GuidentRmcwStateMachine::transition(): No transition for state: <<${this.value}>> Event: <<${event}>>.`);
          return;
        }
        const destinationState = destinationTransition.action(ep, eventData);
        currentStateDefinition.onExit();
        const destinationStateDefinition = stateMachineDefinition[destinationState];
        destinationStateDefinition.onEnter();
        machine.value = destinationState;
        return machine.value;
      }
    };
    return machine;
  }

  start() {
    console.log("GuidentRmccEndpoint::start() called.");
    this.stateMachine.transition('startstopclicked');
  }

  stop() {
    console.log("GuidentRmccEndpoint::stop() called.");
    this.stateMachine.transition('startstopclicked');
  }

  engage(connectionId: string) {
    console.log(`GuidentRmccEndpoint::engage() called with connection id: <<${connectionId}>>.`);
    this.stateMachine.transition('vehiclebuttonclicked', connectionId);
  }

  disengage(connectionId: string) {
    console.log("GuidentRmccEndpoint::disengage() called.");
    this.stateMachine.transition('startstopclicked', connectionId);
  }

  setIceServer(iceServer: RTCIceServer[]) {
    this.webrtcPeerConfiguration = {
      iceServers: iceServer,
      bundlePolicy: 'max-bundle'
    };
  }

  setRemoteVideoId(cameraIndex: GuidentCameraPositions, videoTagId: string) {
    if (cameraIndex < 0 || cameraIndex >= GuidentCameraPositions.CAMERA_POSITIONS_LENGTH) {
      console.log("GuidentRmccEndpoint.setRemoteVideoId): Huh? Invalid video tag index.");
    }

    const videoId = this.remoteVideoId[cameraIndex];

    if (videoId !== null) {
        const videoElement = document.getElementById(videoId);

        if (videoElement !== null && videoElement.nodeName === "VIDEO") {
            console.log("GuidentRmccEndpoint.setRemoteVideoId): Removing video feed from currently set video tag.");
            (videoElement as HTMLVideoElement).srcObject = null;
        }

    this.remoteVideoId[cameraIndex] = null;
    }

    console.log(`GuidentRmccEndpoint.setRemoteVideoId): Attempting to set the remote video tag for stream # ${cameraIndex}  to be <<${videoTagId}>>.`);
    if ((videoTagId == null) || (document.getElementById(videoTagId) == null)) {
      console.error("GuidentRmccEndpoint.setRemoteVideoId(): Oops, this id is not a valid tag to a video object in the DOM.");
      this.remoteVideoId[cameraIndex] = null;
    }

    this.remoteVideoId[cameraIndex] = videoTagId;
  }

  nullVideoStreams() {
    console.log("GuidentRmccEndpoint.resetVideoStreams(): Will set all the video streams to null srcObject.");
    
        for (let i = 0; i < GuidentCameraPositions.CAMERA_POSITIONS_LENGTH; i++) {
        const videoId = this.remoteVideoId[i];
    
        if (videoId !== null) {
            const videoElement = document.getElementById(videoId);
    
            if (videoElement !== null && videoElement.nodeName === "VIDEO") {
            (videoElement as HTMLVideoElement).srcObject = null;
            }
        }
        }
    }
  

  resetVideoStreams() {
    console.log("GuidentRmccEndpoint.resetVideoStreams(): Will set the video streams to the newly set video tag id's");

    for (let i = 0; i < GuidentCameraPositions.CAMERA_POSITIONS_LENGTH; i++) {
        const videoId = this.remoteVideoId[i];
      
        if (videoId !== null) {
            const videoElement = document.getElementById(videoId);
        
            if (videoElement !== null && videoElement.nodeName === "VIDEO") {
            (videoElement as HTMLVideoElement).srcObject = null;
            }
        }
    }
      

    if (this.remoteVideoId[0] != null && document.getElementById(this.remoteVideoId[0]) != null && document.getElementById(this.remoteVideoId[0])!.nodeName === "VIDEO") {
      (document.getElementById(this.remoteVideoId[0]) as HTMLVideoElement).srcObject = this.firstVideoMediaStream;
    }

    if (this.remoteVideoId[1] != null && document.getElementById(this.remoteVideoId[1]) != null && document.getElementById(this.remoteVideoId[1])!.nodeName === "VIDEO") {
      (document.getElementById(this.remoteVideoId[1]) as HTMLVideoElement).srcObject = this.secondVideoMediaStream;
    }

    if (this.remoteVideoId[2] != null && document.getElementById(this.remoteVideoId[2]) != null && document.getElementById(this.remoteVideoId[2])!.nodeName === "VIDEO") {
      (document.getElementById(this.remoteVideoId[2]) as HTMLVideoElement).srcObject = this.thirdVideoMediaStream;
    }
  }

  swapVideos() {
    if (this.firstVideoMediaStream == null || this.secondVideoMediaStream == null) {
      console.error("GuidentRmccEndpoint::swapVideos(): Oops, the media streams aren't set up.");
      return;
    }
  
    const firstVideoId = this.remoteVideoId[0];
    const secondVideoId = this.remoteVideoId[1];
  
    if (firstVideoId !== null) {
      const firstVideoElement = document.getElementById(firstVideoId);
      if (firstVideoElement !== null && firstVideoElement.nodeName === "VIDEO") {
        (firstVideoElement as HTMLVideoElement).srcObject = null;
      }
    }
  
    if (secondVideoId !== null) {
      const secondVideoElement = document.getElementById(secondVideoId);
      if (secondVideoElement !== null && secondVideoElement.nodeName === "VIDEO") {
        (secondVideoElement as HTMLVideoElement).srcObject = null;
      }
    }
  
    let temp = this.firstVideoMediaStream;
    this.firstVideoMediaStream = this.secondVideoMediaStream;
    this.secondVideoMediaStream = temp;
  
    if (firstVideoId !== null) {
      const firstVideoElement = document.getElementById(firstVideoId);
      if (firstVideoElement !== null && firstVideoElement.nodeName === "VIDEO") {
        (firstVideoElement as HTMLVideoElement).srcObject = this.firstVideoMediaStream;
      }
    }
  
    if (secondVideoId !== null) {
      const secondVideoElement = document.getElementById(secondVideoId);
      if (secondVideoElement !== null && secondVideoElement.nodeName === "VIDEO") {
        (secondVideoElement as HTMLVideoElement).srcObject = this.secondVideoMediaStream;
      }
    }
  
    console.log("GuidentRmccEndpoint::swapVideos(): Swapped!");
  }
  

  setVehicleCameraConfiguration(destinationId: string, cameraViewIndex: number) {
    let msg: any = new Object();

    if (destinationId == null || cameraViewIndex == null || cameraViewIndex < 0 || cameraViewIndex > 2) {
      console.log("GuidentRmccEndpoint::setVehicleCameraConfiguration(): Parameter error!");
    }

    msg.messageType = "notify";
    msg.connectionId = this.connectionId;
    if (destinationId != null) {
      msg.peerConnectionId = destinationId;
    } else {
      return;
    }

    if (cameraViewIndex === 0) {
      msg.name = "cameraView_0";
    } else if (cameraViewIndex === 1) {
      msg.name = "cameraView_1";
    } else if (cameraViewIndex === 2) {
      msg.name = "cameraView_2";
    } else {
      console.log("GuidentRmccEndpoint::setVehicleCameraConfiguration(): Parameter error!");
      return;
    }

    if (msg.endpointId != null) msg.endpointId = this.endpointId;
    msg.endpointType = this.endpointType;
    msg.eventType = "command";
    msg.sequence = this.localMessageSequence++;

    let str = JSON.stringify(msg);

    console.log(`GuidentRmccEndpoint::setVehicleCameraConfiguration(): Sending: <<${str}>>.`);
    this.websocketConnection!.send(str);
  }

  sendRemoteControlMessage(msg: string) {
    console.debug('GuidentRmccEndpoint::sendRemoteControlMessage', msg);
    if (msg != null && this.remoteControlDataChannel != null && this.remoteControlDataChannel.readyState === "open") {
      this.remoteControlDataChannel.send(msg);
    } else {
      console.error("GuidentRmccEndpoint::sendRemoteControlMessage(): Error sending remote control message on data channel.");
    }
  }

  setAuthenticationCredentials(authUsername: string, authToken: string) {
    this.authUsername = authUsername;
    this.authToken = authToken;
  }

   onConnecting() {
    console.log("GuidentRmccEndpoint::onConnecting(): not implemented.");
  }

   onConnectionSuccessful() {
    console.log("GuidentRmccEndpoint::onConnectionSuccessful(): not implemented.");
  }

   onConnectionFailed(err: string) {
    console.log("GuidentRmccEndpoint::onConnectionFailed(): not implemented, called with err: " + err);
  }

   onDisconnected(reason: string) {
    console.log("GuidentRmccEndpoint::onDisconnected(): not implemented, called with reason: " + reason);
  }

   onRegistrationFailed() {
    console.log("GuidentRmccEndpoint::onRegistrationFailed(): not implemented.");
  }

   onRegistrationSuccessful() {
    console.log("GuidentRmccEndpoint::onRegistrationSuccessful(): not implemented.");
  }

   onEngaging() {
    console.log("GuidentRmccEndpoint::onEngaging(): not implemented.");
  }

   onEngagementFailed(err: string) {
    console.log("GuidentRmccEndpoint::onEngagementFailed(): not implemented, called with err: " + err);
  }

   onEngagementSuccessful() {
    console.log("GuidentRmccEndpoint::onEngagementSuccessful(): not implemented.");
  }

   onDisengagement(reason: any) {
    console.log("GuidentRmccEndpoint::onDisengagement(): not implemented, called with reason: " + reason);
  }

   onNotification(msg: GuidentVLESMessage) {
    console.log("GuidentRmccEndpoint::onNotification(): not implemented");
  }

   onNewLocation(latlon: any) {
    console.log("GuidentRmccEndpoint::onNewLocation(): not implemented");
  }

   onDataChannelMessage(messageEvent: MessageEvent) {
    console.log("GuidentRmccEndpoint::onDataChannelMessage(): not implemented");
  }

   onDataChannelOpen(messageEvent: Event) {
    console.log("GuidentRmccEndpoint::onDataChannelOpen(): not implemented");
  }

   onDataChannelClose(messageEvent: Event) {
    console.log("GuidentRmccEndpoint::onDataChannelClose(): not implemented");
  }

   onDataChannelError(messageEvent: Event) {
    console.log("GuidentRmccEndpoint::onDataChannelError(): not implemented");
  }

  private _checkIncomingMessageSequence(msg: any) {
    return true;
  }

  private _checkIncomingMessageConnectionId(msg: any) {
    if (msg != null && msg.connectionId != undefined) {
      if (this.connectionId == null) {
        this.connectionId = msg.connectionId;
        console.log("OK");
        return true;
      } else if (msg.connectionId === this.connectionId) {
        console.log("OKOK");
        return true;
      }
    }
    return false;
  }

  private _onWssConnectionOpen(evt: Event) {
    console.log(`GuidentRmccEndpoint::_onWssConnectionOpen(): ${evt}`,evt);
    console.log(this);
    this.stateMachine.transition('connect');
  }

  private _onWssConnectionClose(evt: CloseEvent) {
    console.log(`GuidentRmccEndpoint::_onWssConnectionClose(): Code: ${evt.code} Reason: ${evt.reason} Clean?: ${evt.wasClean}`);
    this.stateMachine.transition('disconnect');
  }

  private _onWssConnectionError(evt: Event) {
    console.log(`GuidentRmccEndpoint::_onWssConnectionError(): ${evt}`);
    this.stateMachine.transition('connectionerror');
  }

  private _onWssConnectionMessage(evt: MessageEvent) {
    if (evt.data != undefined && evt.data != null) {
      let msg = JSON.parse(evt.data);
      let isMine = false;

      if (msg == null) {
        console.log("GuidentRmccEndpoint::_onWssConnectionMessage(): can't parse the message.");
        return;
      }

      if (this == undefined || this == null) {
        console.log("GuidentRmccEndpoint::_onWssConnectionMessage(): can't retrieve the endpoint structure from the websocket.");
        return;
      }

      if (!this._checkIncomingMessageSequence(msg)) {
        console.log("GuidentRmccEndpoint::_onWssConnectionMessage(): Invalid message sequence id.");
        return;
      }

      isMine = this._checkIncomingMessageConnectionId(msg);

      if (!isMine && (msg.messageType !== "notify")) {
        console.log("GuidentRmccEndpoint::_onWssConnectionMessage(): Invalid message.");
        return;
      }

      if (msg.messageType === "notify") {
        if (isMine) {
          if (msg.eventType === "connected") {
            this.stateMachine.transition('connectednotification');
          } else if (msg.eventType === "registered") {
            this.endpointType = msg.endpointType;
            this.endpointId = msg.endpointId;
            this.stateMachine.transition('registerednotification');
          } else if (msg.eventType === "rejected") {
            this.stateMachine.transition('rejectednotification');
          } else {
            console.log("GuidentRmccEndpoint::_onWssConnectionMessage(): No transition for this message.");
          }
        } else {
          if (msg.endpointType === "vehicle") {
            this.onNotification(msg);
          }
        }
      } else if (msg.messageType === "engage-offer") {
        this.stateMachine.transition('engagementoffer', msg);
      } else if (msg.messageType === "engage-answer") {
        this.stateMachine.transition('engagementanswer', msg);
      } else if (msg.messageType === "engage-ack") {
        this.stateMachine.transition('engagementack', msg);
      } else if (msg.messageType === "takeover") {
        this.stateMachine.transition('takeover', msg);
      } else if (msg.messageType === "disengage") {
        this.stateMachine.transition('disengage', msg);
      } else if (msg.messageType === "release") {
        this.stateMachine.transition('release', msg);
      } else {
        console.log(`GuidentRmccEndpoint::_onWssConnectionMessage(): huh?? Invalid message: <<${msg}>>.`);
      }
    }
  }

  public _startConnection() {
    console.log(`GuidentRmccEndpoint::startConnection(): Opening connection to URL: <<${this.vehicleLocatorServerUrl}>>.`);

    this.localMessageSequence = 1;
    this.remoteMessageSequence = null;
    this.connectionId = null;

    this.websocketConnection = new WebSocket(this.vehicleLocatorServerUrl);
    // this is commented out because it is not being used and is causing an error.
	// this.websocketConnection = this;
    this.websocketConnection.onopen = this._onWssConnectionOpen.bind(this);
    this.websocketConnection.onmessage = this._onWssConnectionMessage.bind(this);
    this.websocketConnection.onclose = this._onWssConnectionClose.bind(this);
    this.websocketConnection.onerror = this._onWssConnectionError.bind(this);
  }

  private _closeConnection() {
    console.log("GuidentRmccEndpoint::_closeConnection(): Closing server connection.");
    this.websocketConnection!.close();
    this.localMessageSequence = 1;
    this.remoteMessageSequence = null;
    this.connectionId = null;
  }

  public _startTimer(timeout: number) {
    console.log(`GuidentRmccEndpoint::_startTimer() with ${timeout} ms.`);
    if (this.timerId != null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.timerId = setTimeout((ep: GuidentRmccEndpoint) => ep.stateMachine.transition('timeout'), timeout, this);
    return;
  }

  private _clearCurrentTimer() {
    console.log("GuidentRmccEndpoint::_clearCurrentTimer()");
    if (this.timerId == null) return;
    clearTimeout(this.timerId);
    this.timerId = null;
    return;
  }

  private _sendMessage(messageType: GuidentMessageType, destinationId?: string, eventType?: GuidentMsgEventType, eventData?: any) {
    let msg: any = new Object();

    msg.messageType = messageType;
    msg.connectionId = this.connectionId;

    if (destinationId != null) {
      msg.peerConnectionId = destinationId;
    }

    if (msg.endpointId != null) msg.endpointId = this.endpointId;

    msg.endpointType = this.endpointType;
    msg.name = this.username;

    if (messageType === GuidentMessageType.REGISTER) {
      msg.credential = this.password;
      msg.authenticationUsername = this.authUsername;
      msg.authenticationToken = this.authToken;
    }

    if (messageType === GuidentMessageType.NOTIFY) {
      if (eventType) {
        msg.eventType = eventType;
        msg.status = GuidentMsgStatusType.UNKNOWN;
        if (eventData) {
          msg.eventData = eventData;
        }
      } else {
        msg.eventType = "status";
        msg.status = GuidentMsgStatusType.UNKNOWN;
      }
    }

    if (messageType === GuidentMessageType.ENGAGE_OFFER || messageType === GuidentMessageType.ENGAGE_ANSWER) {
      if (this.webrtcPeerConnection != null) {
        msg.iceServers = this.webrtcPeerConfiguration.iceServers;
        msg.sessiondescription = this.webrtcPeerConnection.localDescription;
      }
    }

    msg.sequence = this.localMessageSequence++;

    let str = JSON.stringify(msg);

    console.log(`GuidentRmccEndpoint::_sendMessage(): Sending: <<${str}>>.`);
    this.websocketConnection!.send(str);
  }

  async getLocalAudioStream() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    } catch (e) {
      console.error("GuidentRmccEndpoint::localAudioStreams: Audio Device Not Found. Make sure your microphone is connected and enabled");
    }
  }

  private _startPeerEngagementOffer(peerId: string): boolean {
    
    console.log(`GuidentRmccEndpoint._startPeerEngagementOffer(): Attempting engagement with peer id: <<${peerId}>>.`);

    const constraints = {
      video: true,
      audio: true,
    };

    if (this.remoteVideoId[0] == null || document.getElementById(this.remoteVideoId[0]) == null || document.getElementById(this.remoteVideoId[0])!.nodeName !== "VIDEO") {
      console.error("GuidentRmccEndpoint._startPeerEngagementOffer(): Need to set remote video element for index 0.");
      return false;
    }

    if (this.remoteVideoId[1] == null || document.getElementById(this.remoteVideoId[1]) == null || document.getElementById(this.remoteVideoId[1])!.nodeName !== "VIDEO") {
      console.error("GuidentRmccEndpoint._startPeerEngagementOffer(): Need to set remote video element for index 1.");
      return false;
    }

    if (this.remoteVideoId[2] == null || document.getElementById(this.remoteVideoId[2]) == null || document.getElementById(this.remoteVideoId[2])!.nodeName !== "VIDEO") {
      console.error("GuidentRmccEndpoint._startPeerEngagementOffer(): Need to set remote video element for index 2.");
      return false;
    }

    this.webrtcPeerConnection = new RTCPeerConnection(this.webrtcPeerConfiguration);

    this.webrtcPeerConnection.ontrack = (ev: RTCTrackEvent) => {
        console.log(`Got a track! Id: <<${ev.track.id}>> Kind: <<${ev.track.kind}>> Mid: <<${ev.transceiver.mid}>> Label: <<${ev.track.label}>> Streams length: <<${ev.streams.length}>> Stream Id: <<${ev.streams[0].id}>> #Tracks in stream: <<${ev.streams[0].getTracks().length}>>`);
        
        const updateVideoElement = (mediaStream: MediaStream, videoId: string | null) => {
            if (videoId !== null) {
                const videoElement = document.getElementById(videoId);
                if (videoElement !== null && videoElement.nodeName === "VIDEO") {
                    (videoElement as HTMLVideoElement).srcObject = mediaStream;
                }
            }
        };
    
        if (ev.transceiver.mid === "0") {
            if (this.firstVideoMediaStream == null) {
                this.firstVideoMediaStream = new MediaStream([ev.track]);
            } else {
                this.firstVideoMediaStream.addTrack(ev.track);
                this.webrtcPeerConnection!.addTrack(ev.track, this.firstVideoMediaStream);
            }
        } else if (ev.transceiver.mid === "1") {
            if (this.firstVideoMediaStream == null) {
                this.firstVideoMediaStream = new MediaStream([ev.track]);
            } else {
                this.firstVideoMediaStream.addTrack(ev.track);
                this.webrtcPeerConnection!.addTrack(ev.track, this.firstVideoMediaStream);
            }
            updateVideoElement(this.firstVideoMediaStream, this.remoteVideoId[0]);
        } else if (ev.transceiver.mid === "2") {
            this.secondVideoMediaStream = new MediaStream([ev.track]);
            console.log(`New stream id: <<${this.secondVideoMediaStream.id}>> ${this.secondVideoMediaStream.getTracks().length}`);
            updateVideoElement(this.secondVideoMediaStream, this.remoteVideoId[1]);
        } else if (ev.transceiver.mid === "3") {
            this.thirdVideoMediaStream = new MediaStream([ev.track]);
            console.log(`New stream id: <<${this.thirdVideoMediaStream.id}>> ${this.thirdVideoMediaStream.getTracks().length}`);
            updateVideoElement(this.thirdVideoMediaStream, this.remoteVideoId[2]);
        }
    };  

    console.log("GuidentRmccEndpoint._startPeerEngagementOffer(): Adding transceivers.");
    this.localStream!.getTracks().forEach(track => this.webrtcPeerConnection!.addTransceiver(track, { direction: "sendrecv" }));
    this.webrtcPeerConnection!.addTransceiver("video", { direction: "recvonly" });
    this.webrtcPeerConnection!.addTransceiver("video", { direction: "recvonly" });
    this.webrtcPeerConnection!.addTransceiver("video", { direction: "recvonly" });

    console.log("GuidentRmccEndpoint._startPeerEngagementOffer(): Setting up data channel.");
    this.remoteControlDataChannel = this.webrtcPeerConnection!.createDataChannel("foo");
    if (this.remoteControlDataChannel != null) {
      this.remoteControlDataChannel.onopen = (event: Event) => {
        console.log("GuidentRmccEndpoint.remoteControlDataChannel.onopen(): The data channel is now open.");
        this.onDataChannelOpen(event);
      };
      this.remoteControlDataChannel.onmessage = (event: MessageEvent) => {
        this.onDataChannelMessage(event);
      };
      this.remoteControlDataChannel.onclose = (event: Event) => {
        console.log("GuidentRmccEndpoint.remoteControlDataChannel.onclose(): The data channel is now closed.");
        this.onDataChannelClose(event);
        this.remoteControlDataChannel = null;
      };
      this.remoteControlDataChannel.onerror = (event: Event) => {
        console.error("GuidentRmccEndpoint.remoteControlDataChannel.onerror(): Oops, the data channel has generated an error.");
        this.onDataChannelError(event);
        this.remoteControlDataChannel = null;
      };
    }

    console.log("GuidentRmccEndpoint._startPeerEngagementOffer(): Creating offer and sending engagement request.");
    this.webrtcPeerConnection.createOffer().then((description) => {
      let sdp = description.sdp;
      if(sdp){
        let newSdp = this.exclusivizeCodecInSdp(sdp, 1, this.exclusiveVideoPayloadTypeForMid1);
        newSdp = this.exclusivizeCodecInSdp(newSdp, 2, this.exclusiveVideoPayloadTypeForMid2);
        newSdp = this.exclusivizeCodecInSdp(newSdp, 3, this.exclusiveVideoPayloadTypeForMid3);
        newSdp = this.changePayloadTypeForMid(newSdp, 1, this.changeVideoPayloadTypeForMid1);
        newSdp = this.changePayloadTypeForMid(newSdp, 2, this.changeVideoPayloadTypeForMid2);
        newSdp = this.changePayloadTypeForMid(newSdp, 3, this.changeVideoPayloadTypeForMid3);
        description.sdp = newSdp;
        return this.webrtcPeerConnection!.setLocalDescription(description);
      } else{
        return null;
      }
    }).then(() => {
      return new Promise((resolve, reject) => {
        this.webrtcPeerConnection!.onicecandidate = (iceevt) => {
          if (iceevt.candidate == null) {
            console.log("GuidentRmccEndpoint._startPeerEngagementOffer::oniceconnectionstatechange(): Completed!");
            resolve("gathering complete");
          } else {
            console.log(`GuidentRmccEndpoint._startPeerEngagementOffer::oniceconnectionstatechange(): Got an ice candidate: <<${iceevt.candidate.candidate}>>`);
          }
        };
        setTimeout(() => { reject("Timeout gathering candidates"); }, 65000);
      });
    }).then((promiseResult) => {
      console.log(`GuidentRmccEndpoint._startPeerEngagementOffer(): the wait-for-ice-candidates promise result: <<${promiseResult}>>, Sending offer.`);
      this._sendMessage(GuidentMessageType.ENGAGE_OFFER, peerId);
    }).catch((err) => {
      this.stateMachine.transition('engagementerror', err);
    });

    this.peerConnectionId = peerId;

    return true;
  }

  private _processPeerEngagementAnswer(msg: any): boolean {
    console.log(`GuidentRmccEndpoint._processPeerEngagementAnswer(): Attempting to process answer SDP from remote vehicle with peer id: <<${msg.peerConnectionId}>>.`);

    if (msg.messageType !== GuidentMessageType.ENGAGE_ANSWER) {
      console.log("processPeerEngagementAnswer(): Huh?");
      return false;
    }

    if (msg == undefined || msg == null || msg.sessiondescription == undefined || msg.sessiondescription == null || msg.sessiondescription === "") {
      console.log("processPeerEngagementAnswer(): Huh? session description is invalid");
      return false;
    }

    this.webrtcPeerConnection!.setRemoteDescription(new RTCSessionDescription(msg.sessiondescription)).then(() => {
      console.log("GuidentRmccEndpoint._processPeerEngagementAnswer()::callBack(): remote answer sdp has been set.");
      this._sendMessage(GuidentMessageType.ENGAGE_ACK, msg.peerConnectionId);
    }).catch((err) => {
      console.log(`GuidentRmccEndpoint._processPeerEngagementAnswer()::callBack(): Error on setRemoteDescription() : <<${err}>>.`);
      this.stateMachine.transition('engagementerror', err);
    });

    return true;
  }

  private _sendDisengagement(peerId: string) {
    console.log(`GuidentRmccEndpoint._sendDisengagement(): Attempting to send disengage message to peer id: <<${peerId}>>.`);
    this.sendRemoteControlMessage(JSON.stringify({ engaged: false, transmitTimestamp: Date.now() }));
    try {
      this._sendMessage(GuidentMessageType.DISENGAGE, peerId);
    } catch (err) {
      console.warn("GuidentRmccEndpoint._sendDisengagement(): Exception thrown when sending the disengagement message, data channel might be closed.");
    }
  }

  private _resetEngagement() {
    try {
      console.log("GuidentRmccEndpoint._resetEngagement(): Resetting webrtc peer connection.");

      if (this.localVideoId != null && document.getElementById(this.localVideoId) != null && document.getElementById(this.localVideoId)!.nodeName === "VIDEO") {
        (document.getElementById(this.localVideoId) as HTMLVideoElement).srcObject = null;
      }

      const clearVideoElementSrc = (videoId: string | null) => {
        if (videoId !== null) {
          const videoElement = document.getElementById(videoId);
          if (videoElement !== null && videoElement.nodeName === "VIDEO") {
            (videoElement as HTMLVideoElement).srcObject = null;
          }
        }
      };
      
      clearVideoElementSrc(this.remoteVideoId[0]);
      clearVideoElementSrc(this.remoteVideoId[1]);
      clearVideoElementSrc(this.remoteVideoId[2]);
      

      this.firstVideoMediaStream = null;
      this.secondVideoMediaStream = null;
      this.thirdVideoMediaStream = null;

      if (this.webrtcPeerConnection != null) this.webrtcPeerConnection.close();
      this.webrtcPeerConnection = null;

      this.remoteControlDataChannel = null;
      console.log("GuidentRmccEndpoint._resetEngagement(): Done");
    } catch (err) {
      console.warn("GuidentRmccEndpoint._resetEngagement(): Oops, exception thrown!");
    }
  }

  setOfferVideoPayloadTypeManipulations(exclusivePtMid1?: number, exclusivePtMid2?: number, exclusivePtMid3?: number, changePtMid1?: number, changePtMid2?: number, changePtMid3?: number) {
    try {
      if (exclusivePtMid1 != undefined && exclusivePtMid1 != null) this.exclusiveVideoPayloadTypeForMid1 = exclusivePtMid1;
      if (exclusivePtMid2 != undefined && exclusivePtMid2 != null) this.exclusiveVideoPayloadTypeForMid2 = exclusivePtMid2;
      if (exclusivePtMid3 != undefined && exclusivePtMid3 != null) this.exclusiveVideoPayloadTypeForMid3 = exclusivePtMid3;
      if (changePtMid1 != undefined && changePtMid1 != null) this.changeVideoPayloadTypeForMid1 = changePtMid1;
      if (changePtMid2 != undefined && changePtMid2 != null) this.changeVideoPayloadTypeForMid2 = changePtMid2;
      if (changePtMid3 != undefined && changePtMid3 != null) this.changeVideoPayloadTypeForMid3 = changePtMid3;
    } catch (err) {
      console.warn("GuidentRmccEndpoint.prototype.setOfferVideoPayloadTypeManipulations");
    }
  }

  private exclusivizeCodecInSdp(sdp: string, mediaSectionIndex: number, payloadType: number): string {
    let sdpLines = sdp.split('\r\n');
    let mLineIndices = [];
    for (let i = 0; i < sdpLines.length; i++) {
      if (sdpLines[i].search('m=audio') !== -1) {
        mLineIndices.push(i);
      }
      if (sdpLines[i].search('m=video') !== -1) {
        mLineIndices.push(i);
      }
    }
    mLineIndices.push(sdpLines.length);

    if ((mediaSectionIndex < 0) || (mediaSectionIndex > (mLineIndices.length - 2))) {
      console.log(`exclusivizeCodecInSdp(): Oops, this SDP doesn't have a ${mediaSectionIndex}th m= section.`);
      return sdp;
    }

    let startingLineIdx = mLineIndices[mediaSectionIndex];
    let endingLineIdx = mLineIndices[mediaSectionIndex + 1];

    let payloadTypeStr = ` ${payloadType}`;

    if (sdpLines[startingLineIdx].search(payloadTypeStr) === -1) {
      console.log(`exclusivizeCodecInSdp(): Oops, this SDP's m= section # ${mediaSectionIndex} doesn't have a ${payloadTypeStr} payload number.`);
      return sdp;
    }

    payloadTypeStr = `${payloadType}`;

    let elements = sdpLines[startingLineIdx].split(' ');
    let replaceElements = [elements[0], elements[1], elements[2], payloadTypeStr];

    sdpLines[startingLineIdx] = replaceElements.join(' ');

    let returnSdpLines = [];

    for (let j = 0; j < startingLineIdx; j++) {
      returnSdpLines.push(sdpLines[j]);
    }

    for (let j = startingLineIdx; j < endingLineIdx; j++) {
      let lineIsOkToKeep = true;

      if (sdpLines[j].search('a=extmap:4') !== -1) {
        lineIsOkToKeep = false;
      }

      if (sdpLines[j].search('a=rtpmap:') !== -1) {
        if (sdpLines[j].search(`a=rtpmap:${payloadTypeStr}`) === -1) {
          lineIsOkToKeep = false;
        }
      }
      if (sdpLines[j].search('a=fmtp:') !== -1) {
        if (sdpLines[j].search(`a=fmtp:${payloadTypeStr}`) === -1) {
          lineIsOkToKeep = false;
        }
      }
      if (sdpLines[j].search('a=rtcp-fb:') !== -1) {
        if (sdpLines[j].search(`rtcp-fb:${payloadTypeStr}`) === -1) {
          lineIsOkToKeep = false;
        }
      }
      if (lineIsOkToKeep) {
        returnSdpLines.push(sdpLines[j]);
      }
    }

    for (let j = endingLineIdx; j < mLineIndices[mLineIndices.length - 1]; j++) {
      returnSdpLines.push(sdpLines[j]);
    }

    let newSdp = returnSdpLines.join('\r\n');
    return newSdp;
  }

  private changePayloadTypeForMid(sdp: string, mid: number, newpt: number): string {
    let sdpLines = sdp.split('\r\n');
    let mLineIndices = [];
    for (let i = 0; i < sdpLines.length; i++) {
      if (sdpLines[i].search('m=audio') !== -1) {
        mLineIndices.push(i);
      }
      if (sdpLines[i].search('m=video') !== -1) {
        mLineIndices.push(i);
      }
    }
    mLineIndices.push(sdpLines.length);

    let startingLineIdx = mLineIndices[mid];
    let endingLineIdx = mLineIndices[mid + 1];

    let mlinePieces = sdpLines[startingLineIdx].split(' ');
    if (mlinePieces.length !== 4) {
      console.error(`changePayloadTypeForMid() Oops, can't process mline: <<${sdpLines[startingLineIdx]}>>.`);
      return sdp;
    }

    if (isNaN(parseInt(mlinePieces[mlinePieces.length - 1]))) {
      console.error(`changePayloadTypeForMid() Oops, can't process mline: <<${sdpLines[startingLineIdx]}>>.`);
      return sdp;
    }

    let oldpt = parseInt(mlinePieces[mlinePieces.length - 1]);

    let newMline = "";
    for (let i = 0; i < mlinePieces.length - 1; i++) {
      newMline += mlinePieces[i];
      newMline += " ";
    }

    newMline += newpt;
    sdpLines[startingLineIdx] = newMline;

    for (let i = startingLineIdx; i < endingLineIdx; i++) {
      if (sdpLines[i].search('a=rtpmap:') !== -1) {
        let re = new RegExp(`a=rtpmap:${oldpt}`);
        sdpLines[i] = sdpLines[i].replace(re, `a=rtpmap:${newpt}`);
      }
      if (sdpLines[i].search('a=fmtp:') !== -1) {
        let re = new RegExp(`a=fmtp:${oldpt}`);
        sdpLines[i] = sdpLines[i].replace(re, `a=fmtp:${newpt}`);
      }
      if (sdpLines[i].search('a=rtcp-fb:') !== -1) {
        let re = new RegExp(`a=rtcp-fb:${oldpt}`);
        sdpLines[i] = sdpLines[i].replace(re, `a=rtcp-fb:${newpt}`);
      }
    }

    let newSdp = sdpLines.join('\r\n');
    return newSdp;
  }
}

  
const GuidentRmcwStateMachineDefinition: StateMachineDefinition = {
    initialState: 'start',
    start: {
        onEnter() { console.log("GuidentRmcwStateMachineDefinition::start: entering"); },
        onExit() { console.log("GuidentRmcwStateMachineDefinition::start: exiting"); },
        eventCallbacks: {
        startstopclicked: {
            action(endpoint: any, evtData: any) {
            endpoint._startConnection();
            endpoint._startTimer(10000);
            endpoint.onConnecting();
            return "waitingforconnection";
            }
        }
        }
    },
    idle: {
        onEnter() { console.log("GuidentRmcwStateMachineDefinition::idle: entering"); },
        onExit() { console.log("GuidentRmcwStateMachineDefinition::idle: exiting"); },
        eventCallbacks: {
        timeout: {
            action(endpoint: any, evtData: any) {
            endpoint._startConnection();
            endpoint._startTimer(10000);
            endpoint.onConnecting();
            return "waitingforconnection";
            }
        },
        startstopclicked: {
            action(endpoint: any, evtData: any) {
            endpoint._clearCurrentTimer();
            endpoint.onEndpointStopped();
            return "start";
            }
        }
        }
    },
    waitingforconnection: {
        onEnter() { console.log("GuidentRmcwStateMachineDefinition::waitingforconnection: entering"); },
        onExit() { console.log("GuidentRmcwStateMachineDefinition::waitingforconnection: exiting"); },
        eventCallbacks: {
        timeout: {
            action(endpoint: any, evtData: any) {
            endpoint._closeConnection();
            endpoint._startTimer(10000);
            endpoint.onConnectionFailed();
            return "disconnecting";
            }
        },
        connect: {
            action(endpoint: any, evtData: any) {
            endpoint._clearCurrentTimer();
            endpoint._startTimer(10000);
            return "connectedwaitingfornotification";
            }
        },
        connectionerror: {
            action(endpoint: any, evtData: any) {
            endpoint._clearCurrentTimer();
            endpoint._closeConnection();
            endpoint._startTimer(10000);
            endpoint.onConnectionFailed();
            return "disconnecting";
            }
        }
        }
    },
    connectedwaitingfornotification: {
        onEnter() { console.log("connectedwaitingfornotification: entering"); },
        onExit() { console.log("connectedwaitingfornotification: exiting"); },
        eventCallbacks: {
        timeout: {
            action(endpoint: any, evtData: any) {
            endpoint._clearCurrentTimer();
            endpoint._closeConnection();
            endpoint._startTimer(10000);
            endpoint.onConnectionFailed();
            return "disconnecting";
            }
        },
        disconnect: {
            action(endpoint: any, evtData: any) {
            console.log("WEBSOCKET HAS BEEN CLOSED FROM REMOTE SIDE");
            endpoint._clearCurrentTimer();
            endpoint._startTimer(10000);
            endpoint.onConnectionFailed();
            return "idle";
            }
        },
        connectednotification: {
            action(endpoint: any, evtData: any) {
            console.log("got the message.");
            endpoint._clearCurrentTimer();
            endpoint._sendMessage("register");
            endpoint._startTimer(10000);
            endpoint.onConnectionSuccessful();
            return "registeringwaitingfornotification";
            }
        }
        }
    },
    registeringwaitingfornotification: {
        onEnter() { console.log("registeringwaitingfornotification: entering"); },
        onExit() { console.log("registeringwaitingfornotification: exiting"); },
        eventCallbacks: {
        timeout: {
            action(endpoint: any, evtData: any) {
            endpoint._clearCurrentTimer();
            endpoint._closeConnection();
            endpoint._startTimer(10000);
            endpoint.onRegistrationFailed();
            return "disconnecting";
            }
        },
        rejectednotification: {
            action(endpoint: any, evtData: any) {
            endpoint._clearCurrentTimer();
            endpoint._closeConnection();
            endpoint._startTimer(10000);
            endpoint.onRegistrationFailed();
            return "disconnecting";
            }
        },
        registerednotification: {
            action(endpoint: any, evtData: any) {
            endpoint._clearCurrentTimer();
            endpoint.onRegistrationSuccessful();
            return "registered";
            }
        }
        }
    },
    registered: {
        onEnter() { console.log("registered: entering"); },
        onExit() { console.log("registered: exiting"); },
        eventCallbacks: {
        disconnect: {
            action(endpoint: any, evtData: any) {
            console.log("registered-disconnect(): WEBSOCKET HAS BEEN CLOSED FROM REMOTE SIDE");
            endpoint._clearCurrentTimer();
            endpoint._startTimer(10000);
            endpoint.onDisconnected("remote");
            return "idle";
            }
        },
        startstopclicked: {
            action(endpoint: any, evtData: any) {
            endpoint._clearCurrentTimer();
            endpoint._closeConnection();
            endpoint._startTimer(10000);
            return "disconnectingstop";
            }
        },
        engagementoffer: {
            action(endpoint: any, evtData: any) {
            endpoint._clearCurrentTimer();
            if (endpoint._startPeerEngagementAnswer(evtData)) {
                endpoint._startTimer(67000);
                return "engagingwithanswer";
            } else {
                console.log("registered-vehiclebuttonclicked(): Oops, error starting offer request.");
                endpoint._resetEngagement();
                endpoint.onEngagementFailed("config");
                return "registered";
            }
            }
        },
        vehiclebuttonclicked: {
            action(endpoint: any, evtData: any) {
            endpoint._clearCurrentTimer();
            if (endpoint._startPeerEngagementOffer(evtData)) {
                endpoint._startTimer(67000);
                endpoint.onEngaging();
                return "engagingwithoffer";
            } else {
                console.log("registered-vehiclebuttonclicked(): Oops, error starting offer request.");
                endpoint._resetEngagement();
                endpoint.onEngagementFailed("config");
                return "registered";
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
            action(endpoint: any, evtData: any) {
            console.log("engagingwithoffer-startstopclicked(): Connection is being reset.");
            endpoint._clearCurrentTimer();
            endpoint._resetEngagement();
            endpoint._closeConnection();
            endpoint._startTimer(10000);
            return "disconnectingstop";
            }
        },
        engagementanswer: {
            action(endpoint: any, evtData: any) {
            endpoint._clearCurrentTimer();
            console.log("engagingwithoffer-engagementanswer(): will process answer sdp.");
            if (!endpoint._processPeerEngagementAnswer(evtData)) {
                console.log("engagingwithoffer-engagementanswer(): Oops, error processing answer sdp.");
                endpoint._resetEngagement();
                endpoint.onEngagementFailed("config");
                endpoint.sendMessage("disengage", evtData.peerConnectionId);
                return "registered";
            }
            endpoint.onEngagementSuccessful();
            return "engaged";
            }
        },
        rejectednotification: {
            action(endpoint: any, evtData: any) {
            console.log("engagingwithoffer-rejectednotification(): Oops, attempted engagement has been rejected!");
            endpoint._clearCurrentTimer();
            endpoint._resetEngagement();
            endpoint.onEngagementFailed("rejected");
            return "registered";
            }
        },
        disengage: {
            action(endpoint: any, evtData: any) {
            console.log("engagingwithoffer-disengage(): Oops, attempted engagement has been rejected!");
            endpoint._clearCurrentTimer();
            endpoint._resetEngagement();
            endpoint.onEngagementFailed("rejected");
            return "registered";
            }
        },
        engagementerror: {
            action(endpoint: any, evtData: any) {
            console.log("engagingwithoffer-engagementerror(): Oops, error during attempted engagement: <<" + evtData + ">>.");
            endpoint._clearCurrentTimer();
            endpoint._resetEngagement();
            endpoint.onEngagementFailed("rejected");
            return "registered";
            }
        },
        timeout: {
            action(endpoint: any, evtData: any) {
            console.log("engagingwithoffer-timeout(): Timeout waiting for engagement answer.");
            endpoint._clearCurrentTimer();
            endpoint._resetEngagement();
            endpoint.onEngagementFailed("timeout");
            return "registered";
            }
        },
        disconnect: {
            action(endpoint: any, evtData: any) {
            console.log("engagingwithoffer-disconnect(): WEBSOCKET HAS BEEN CLOSED FROM REMOTE SIDE");
            endpoint._clearCurrentTimer();
            endpoint._resetEngagement();
            endpoint._startTimer(10000);
            endpoint.onEngagementFailed("rejected");
            endpoint.onDisconnected("remote");
            return "idle";
            }
        }
        }
    },
    engagingwithanswer: {
        onEnter() { console.log("engagingwithanswer: entering"); },
        onExit() { console.log("engagingwithanswer: exiting"); },
        eventCallbacks: {
        engagementack: {
            action(endpoint: any, evtData: any) {
            endpoint._clearCurrentTimer();
            console.log("engagingwithanswer-engagementack(): Got the ack.");
            endpoint.onEngagementSuccessful();
            return "engaged";
            }
        },
        disengage: {
            action(endpoint: any, evtData: any) {
            console.log("engagingwithanswer-disengage(): Timeout waiting for engagement answer.");
            endpoint._clearCurrentTimer();
            endpoint._resetEngagement();
            endpoint.onEngagementFailed("rejected");
            return "registered";
            }
        },
        engagementerror: {
            action(endpoint: any, evtData: any) {
            console.log("engagingwithanswer-engagementerror(): Oops, error during attempted engagement: <<" + evtData + ">>.");
            endpoint._clearCurrentTimer();
            endpoint._resetEngagement();
            endpoint.onEngagementFailed("rejected");
            return "registered";
            }
        },
        timeout: {
            action(endpoint: any, evtData: any) {
            console.log("engagingwithanswer-timeout(): Timeout waiting for engagement answer.");
            endpoint._clearCurrentTimer();
            endpoint._resetEngagement();
            endpoint.onEngagementFailed("timeout");
            return "registered";
            }
        },
        disconnect: {
            action(endpoint: any, evtData: any) {
            console.log("engagingwithanswer-disconnect(): WEBSOCKET HAS BEEN CLOSED FROM REMOTE SIDE");
            endpoint._clearCurrentTimer();
            endpoint._resetEngagement();
            endpoint._startTimer(10000);
            endpoint.onEngagementFailed("rejected");
            endpoint.onDisconnected("remote");
            return "idle";
            }
        }
        }
    },
    engaged: {
        onEnter() { console.log("engaged: entering"); },
        onExit() { console.log("engaged: exiting"); },
        eventCallbacks: {
        timeout: {
            action(endpoint: any, evtData: any) {
            console.log("engaged-timeout(): Timeout waiting for engagement answer???");
            endpoint._clearCurrentTimer();
            return "registered";
            }
        },
        disconnect: {
            action(endpoint: any, evtData: any) {
            console.log("engaged-disconnect(): WEBSOCKET HAS BEEN CLOSED FROM REMOTE SIDE");
            endpoint._clearCurrentTimer();
            endpoint._resetEngagement();
            endpoint._startTimer(10000);
            endpoint.onDisengagement();
            endpoint.onDisconnected("remote");
            return "idle";
            }
        },
        disengage: {
            action(endpoint: any, evtData: any) {
            console.log("engaged-disengagement(): received disengage message.");
            endpoint._clearCurrentTimer();
            endpoint._resetEngagement();
            endpoint.onDisengagement();
            return "registered";
            }
        },
        engagementerror: {
            action(endpoint: any, evtData: any) {
            console.log("engaged-engagementerror(): Oops, error during attempted engagement: <<" + evtData + ">>.");
            endpoint._clearCurrentTimer();
            endpoint._resetEngagement();
            endpoint.onEngagementFailed("rejected");
            return "registered";
            }
        },
        startstopclicked: {
            action(endpoint: any, evtData: any) {
            console.log("engaged-startstopclicked(): Disengage button clicked.");
            endpoint._clearCurrentTimer();
            endpoint._sendDisengagement(evtData);
            endpoint._resetEngagement();
            endpoint.onDisengagement();
            return "registered";
            }
        }
        }
    },
    disconnecting: {
        onEnter() { console.log("disconnecting: entering"); },
        onExit() { console.log("disconnecting: exiting"); },
        eventCallbacks: {
        disconnect: {
            action(endpoint: any, evtData: any) {
            endpoint._clearCurrentTimer();
            endpoint._startTimer(5000);
            endpoint.onDisconnected("remote");
            return "idle";
            }
        },
        timeout: {
            action(endpoint: any, evtData: any) {
            console.log("disconnecting-timeout(): Huh? Timeout when disconnecting websocket connection.");
            endpoint._clearCurrentTimer();
            endpoint._startTimer(5000);
            endpoint.onDisconnected("remote");
            return "idle";
            }
        }
        }
    },
    disconnectingstop: {
        onEnter() { console.log("disconnectingstop: entering"); },
        onExit() { console.log("disconnectingstop: exiting"); },
        eventCallbacks: {
        disconnect: {
            action(endpoint: any, evtData: any) {
            endpoint._clearCurrentTimer();
            endpoint.onDisconnected("user");
            return "start";
            }
        },
        timeout: {
            action(endpoint: any, evtData: any) {
            console.log("disconnectingstop-timeout(): Huh? Timeout when disconnecting websocket connection.");
            endpoint._clearCurrentTimer();
            endpoint.onDisconnected("user");
            return "start";
            }
        }
        }
    }
};

