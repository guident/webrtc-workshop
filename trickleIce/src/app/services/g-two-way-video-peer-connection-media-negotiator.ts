import { GPeerConnectionMediaNegotiator } from "./g-peer-connection-media-negotiator";
import { GuidentMessageType, GuidentCameraPositions, GuidentMsgEventType } from "./vehicle-locator-api"
import { GuidentLogger } from "./guident-logger";

export class GTwvPeerConnectionMediaNegotiator extends GPeerConnectionMediaNegotiator {

    localStream: MediaStream | null = null;
    firstVideoMediaStream: MediaStream | null = null;
    localVideoId: string | null = null;

    errorTimeout: any;
    private EndpointSessionId: string = "";

    constructor() {
      super("GTwvPeerConnectionMediaNegotiator");

      this.webrtcPeerConfiguration = {
        iceServers: [{'urls': "stun:guident.bluepepper.us:3478" }],
        bundlePolicy: 'max-bundle'
      };
    }

    resetVideoStreams() {
      console.log("GuidentTwvPeerConnectionMediaNegotiator::resetVideoStreams(): Will set the video streams to the newly set video tag id's");

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
    }

    override _resetEngagement() {
        try {
            console.log("GuidentTwvPeerConnectionMediaNegotiator._resetEngagement(): Resetting webrtc peer connection.");

            if (this.localVideoId != null && document.getElementById(this.localVideoId) != null && document.getElementById(this.localVideoId)!.nodeName === "VIDEO") {
              this.nullVideoStreams();
            }

            this.firstVideoMediaStream = null;
            if (this.webrtcPeerConnection != null){
              GuidentLogger.logDebug("GuidentTwvPeerConnectionMediaNegotiator", "_resetEngagement(): Clearing out the webrtc connection");
              //Clear out the webrtc connection
              this.webrtcPeerConnection.close();
              this.webrtcPeerConnection.onicecandidate = null;
              this.webrtcPeerConnection.ontrack = null;
              this.webrtcPeerConnection.onconnectionstatechange = null;
              this.webrtcPeerConnection = null;
            }


            this.remoteControlDataChannel = null;
            console.log("GuidentTwvPeerConnectionMediaNegotiator::_resetEngagement(): Done");
        } catch (err) {
          console.error(err);
          console.warn("GuidentTwvPeerConnectionMediaNegotiator::_resetEngagement(): Oops, exception thrown!");
        }
    }

    override setLocalVideoId(id: string): void {
        console.log("GuidentTwvPeerConnection::setLocalVideoId()): Attempting to set the local video tag to be <<" + id + ">>.");

        if (id !== null) {
            this.localVideoId = id;
        }
    }

    override async getLocalMediaStream() {
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({
              audio: false,
              video: true
            });
        } catch (e) {
            console.error("GuidentTwvPeerConnectionMediaNegotiator::getlocalMediaStream(): Audio Device Not Found. Make sure your microphone is connected and enabled");
        }
    }

    override startPeerEngagementOffer(peerId: string): boolean {

      console.log(`GuidentTwvPeerConnectionMediaNegotiator::startPeerEngagementOffer(): Attempting engagement with peer id: <<${peerId}>>.`);

      if (this.remoteVideoId[0] == null || document.getElementById(this.remoteVideoId[0]) == null || document.getElementById(this.remoteVideoId[0])!.nodeName !== "VIDEO") {
        console.error("GuidentTwvPeerConnectionMediaNegotiator::startPeerEngagementOffer(): Need to set remote video element for index 0.");
        return false;
      }

      this.webrtcPeerConnection = new RTCPeerConnection(this.webrtcPeerConfiguration);

      this.webrtcPeerConnection.onconnectionstatechange = (event: any) =>{
        if(this.webrtcPeerConnection && (this.webrtcPeerConnection.connectionState == "disconnected")){
          console.log("onconnectionstatechanged():: The connection has been disconnected/failed");
          this.nullVideoStreams();
          this.myEndpoint.onUserPressedEndCall();
        }
      }

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
            this.firstVideoMediaStream = ev.streams[0];
            updateVideoElement(this.firstVideoMediaStream, this.remoteVideoId[0]);
          }
      };

      if (this.localVideoId != null && document.getElementById(this.localVideoId) != null) {

        (document.getElementById(this.localVideoId) as HTMLVideoElement).srcObject = this.localStream;

      }

      console.log("GuidentTwvPeerConnectionMediaNegotiator::startPeerEngagementOffer(): Adding transceivers.");
      this.localStream!.getTracks().forEach(track => this.webrtcPeerConnection!.addTransceiver(track, { direction: "sendrecv" }));

      console.log("GuidentTwvPeerConnectionMediaNegotiator::startPeerEngagementOffer(): Creating offer and sending engagement request.");
      this.webrtcPeerConnection.createOffer().then((description) => {
        let sdp = description.sdp;
        if(sdp) {
          let newSdp = this.exclusivizeCodecInSdp(sdp, 0, this.exclusiveVideoPayloadTypeForMid1);
          newSdp = this.changePayloadTypeForMid(newSdp, 0, this.changeVideoPayloadTypeForMid1);
          description.sdp = newSdp;
          console.log("GuidentTwvPeerConnectionMediaNegotiator::startPeerEngagementOffer(): SDP constructed ", newSdp);
          return this.webrtcPeerConnection!.setLocalDescription(description);
        } else{
            return null;
        }
      }).then(() => {
      return new Promise((resolve, reject) => {
          this.webrtcPeerConnection!.onicecandidate = (iceevt) => {
          if (iceevt.candidate == null) {
              console.log("GuidentTwvPeerConnectionMediaNegotiator::startPeerEngagementOffer::onicecandidate(): Completed!");
              resolve("gathering complete");
          } else {
              console.log(`GuidentTwvPeerConnectionMediaNegotiator::startPeerEngagementOffer::onicecandidate(): Got an ice candidate: <<${iceevt.candidate.candidate}>>`);
          }
          };
          this.errorTimeout = setTimeout(() => { reject("Timeout gathering candidates"); }, 65000);
      });
      }).then((promiseResult) => {
        console.log(`GuidentTwvPeerConnectionMediaNegotiator::startPeerEngagementOffer(): the wait-for-ice-candidates promise result: <<${promiseResult}>>, Sending offer.`);
        this._sendMessage(GuidentMessageType.ENGAGE_OFFER, peerId, GuidentMsgEventType.UNKNOWN, null, this.webrtcPeerConfiguration.iceServers, this.webrtcPeerConnection?.localDescription);
      }).catch((err) => {
        console.log("I am an error", err);
        this.myEndpoint.stateMachine.transition('engagementerror', err)
      });

      return true;
    }

    override _sendDisengagement(peerId: string): boolean {
      console.log(`GuidentTwvPeerConnectionMediaNegotiator._sendDisengagement(): Attempting to send disengage message to peer id: <<${peerId}>>.`);
      // this.sendRemoteControlMessage(JSON.stringify({ engaged: false, transmitTimestamp: Date.now() })); ------------------------------------ TODO Why does this work???????
      try {
        this._sendMessage(GuidentMessageType.DISENGAGE, peerId);
      } catch (err) {
        console.warn("GuidentTwvPeerConnectionMediaNegotiator._sendDisengagement(): Exception thrown when sending the disengagement message, data channel might be closed.");
        return false;
      }
      return true;
    }

    override nullVideoStreams(): void {
      GuidentLogger.logDebug("GuidentTwvPeerConnectionMediaNegotiator", "nullVideoStream(): Nullifying the local and remote video stream")
      //Reset the remote video
      const remoteVideoId = this.remoteVideoId[0];
      if (remoteVideoId !== null) {
        const videoElement = document.getElementById(remoteVideoId);

        const videoMediaSrc = ((videoElement as HTMLVideoElement).srcObject as MediaStream);
        if(videoMediaSrc){
          videoMediaSrc.getTracks().forEach(track => track.stop());
        }

        if (videoElement !== null && videoElement.nodeName === "VIDEO") {
          (videoElement as HTMLVideoElement).srcObject = null;
        }
      }
      //Reset the local video
      const localVideoId = this.localVideoId;
      if (localVideoId !== null) {
        const videoElement = document.getElementById(localVideoId);

        const videoMediaSrc = ((videoElement as HTMLVideoElement).srcObject as MediaStream);
        if(videoMediaSrc){
          videoMediaSrc.getTracks().forEach(track => track.stop());
        }
        videoMediaSrc.getTracks().forEach(track => track.stop());

        if (videoElement !== null && videoElement.nodeName === "VIDEO") {
          (videoElement as HTMLVideoElement).srcObject = null;
        }
      }

      if(this.localStream){
        GuidentLogger.logDebug("GuidentTwvPeerConnectionMediaNegotiator", "nullVideoStream(): Stopping the tracks from the localStream");
        this.localStream.getTracks().forEach( track => track.stop());
        this.localStream = null;
      }

      if(this.firstVideoMediaStream){
        GuidentLogger.logDebug("GuidentTwvPeerConnectionMediaNegotiator", "nullVideoStream(): Stopping the tracks from the firstVideoStream");
        this.firstVideoMediaStream.getTracks().forEach( track => track.stop());
        this.firstVideoMediaStream = null;
      }

      if(this.webrtcPeerConnection){
        this.webrtcPeerConnection.getTransceivers().forEach( transceiver =>{
          transceiver.stop();
        })
      }

    }

    override processPeerEngagementAnswer(msg: any): boolean {
        console.log(msg)
        console.log(`GuidentTwvPeerConnectionMediaNegotiator::_processPeerEngagementAnswer(): Attempting to process answer SDP from remote vehicle with peer id: <<${msg.peerConnectionId}>>.`);
        this.EndpointSessionId = msg.connectionId;

        if (msg.messageType !== GuidentMessageType.ENGAGE_ANSWER) {
          console.log("GuidentTwvPeerConnectionMediaNegotiator::processPeerEngagementAnswer(): Huh?");
          return false;
        }

        if (msg == undefined || msg == null || msg.sessiondescription == undefined || msg.sessiondescription == null || msg.sessiondescription === "") {
          console.log("GuidentTwvPeerConnectionMediaNegotiator::processPeerEngagementAnswer(): Huh? session description is invalid");
          return false;
        }

        this.webrtcPeerConnection!.setRemoteDescription(new RTCSessionDescription(msg.sessiondescription)).then(() => {
          console.log("GuidentTwvPeerConnectionMediaNegotiator::processPeerEngagementAnswer()::callBack(): remote answer sdp has been set.");
          this._sendMessage(GuidentMessageType.ENGAGE_ACK, msg.peerConnectionId);
        }).catch((err) => {
          console.log(`GuidentTwvPeerConnectionMediaNegotiator::processPeerEngagementAnswer()::callBack(): Error on setRemoteDescription() : <<${err}>>.`);
          this.myEndpoint.transition('engagementerror', err);
        });

        return true;
    }

    override setOfferVideoPayloadTypeManipulations(exclusivePtMid1?: number, exclusivePtMid2?: number, exclusivePtMid3?: number, changePtMid1?: number, changePtMid2?: number, changePtMid3?: number) {
      try {
        if (exclusivePtMid1 != undefined && exclusivePtMid1 != null) this.exclusiveVideoPayloadTypeForMid1 = exclusivePtMid1;
        if (changePtMid1 != undefined && changePtMid1 != null) this.changeVideoPayloadTypeForMid1 = changePtMid1;
      } catch (err) {
        console.warn("GuidentTwvPeerConnectionMediaNegotiator::setOfferVideoPayloadTypeManipulations");
      }
    }

}
