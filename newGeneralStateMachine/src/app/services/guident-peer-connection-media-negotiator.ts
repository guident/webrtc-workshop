import { endpoint } from "./endpoint";
import { WebsocketConnectionStateMachine } from "./new-locator-api";
import { GuidentMessageType, GuidentCameraPositions, GuidentMsgEventType } from "./new-locator-api";

export class GuidentPeerConnectionMediaNegotiator {
    
    myEndpoint: any = null;
    webrtcPeerConfiguration: RTCConfiguration = { iceServers: [] };
    private pcMediaNegotiatorType: string = "";
    protected webrtcPeerConnection: RTCPeerConnection | null = null;
    protected remoteControlDataChannel: RTCDataChannel | null = null;

    connectionId: string | null = null;
    endpointId: string | null = null;
    endpointType: string | null = null;
    username: string | null = null;
    password: string | null = null;
    authUsername: string | null = null;
    authToken: string | null = null;
    localMessageSequence: number = 1;
    // websocketConnection: WebSocket | null = null;

    protected remoteVideoId: (string | null)[] = [null, null, null];

    protected exclusiveVideoPayloadTypeForMid1: number = -1;
    protected exclusiveVideoPayloadTypeForMid2: number = -1;
    protected exclusiveVideoPayloadTypeForMid3: number = -1;
    protected changeVideoPayloadTypeForMid1: number = -1;
    protected changeVideoPayloadTypeForMid2: number = -1;
    protected changeVideoPayloadTypeForMid3: number = -1;
    
    constructor(t: string) {
      this.pcMediaNegotiatorType = t;
    }


    public setEndpoint(ep: endpoint) {
        this.myEndpoint = ep;
    }

    // protected setupPeerConnection() {
    //     this.webrtcPeerConnection = new RTCPeerConnection(this.webrtcPeerConfiguration);

    //     this.webrtcPeerConnection.ontrack = (ev: RTCTrackEvent) => this.onTrack(ev);
    //     this.webrtcPeerConnection.onicecandidate = (iceevt) => this.onIceCandidate(iceevt);

    //     this.remoteControlDataChannel = this.webrtcPeerConnection.createDataChannel("foo");
    //     if (this.remoteControlDataChannel != null) {
    //         this.remoteControlDataChannel.onopen = (event: Event) => this.onDataChannelOpen(event);
    //         this.remoteControlDataChannel.onmessage = (event: MessageEvent) => this.onDataChannelMessage(event);
    //         this.remoteControlDataChannel.onclose = (event: Event) => this.onDataChannelClose(event);
    //         this.remoteControlDataChannel.onerror = (event: Event) => this.onDataChannelError(event);
    //     }
    // }

    protected onTrack(ev: RTCTrackEvent) {
        console.log(`Got a track! Id: <<${ev.track.id}>> Kind: <<${ev.track.kind}>> Mid: <<${ev.transceiver.mid}>> Label: <<${ev.track.label}>> Streams length: <<${ev.streams.length}>> Stream Id: <<${ev.streams[0].id}>> #Tracks in stream: <<${ev.streams[0].getTracks().length}>>`);
    }

    protected onIceCandidate(iceevt: RTCPeerConnectionIceEvent) {
        if (iceevt.candidate == null) {
            console.log("ICE gathering complete");
        } else {
            console.log(`Got an ice candidate: <<${iceevt.candidate.candidate}>>`);
        }
    }

    protected onDataChannelOpen(event: Event) {
        console.log("The data channel is now open.");
    }

    protected onDataChannelMessage(event: MessageEvent) {
        console.log("Data channel message:", event.data);
    }

    protected onDataChannelClose(event: Event) {
        console.log("The data channel is now closed.");
        this.remoteControlDataChannel = null;
    }

    protected onDataChannelError(event: Event) {
        console.error("The data channel has generated an error.");
        this.remoteControlDataChannel = null;
    }
  
    setAudioFlag(af: boolean) {
        console.log("GuidentPeerConnectionMediaNegotiator::setAudioFlag(): not implemented.");
    }

    getMediaNegotiatorType(): string {
        return(this.pcMediaNegotiatorType);
    }

    launchWebRtcPeerConnection() {
        console.log("GuidentPeerConnectionMediaNegotiator::launchWebRtcNegotiation(): not implemented.");
    }

    // callbacks

    onWebRtcPeerConnectionOfferComplete() {
        console.log("GuidentPeerConnectionMediaNegotiator::onWebRtcPeerConnectionOfferComplete(): not implemented.");
    }
    
    onWebRtcPeerConnectionAnswerArrived() {
        console.log("GuidentPeerConnectionMediaNegotiator::onWebRtcPeerConnectionAnswerArrived(): not implemented.");
    }

    onWebRtcPeerConnectionNegotiationSuccessful() {
        console.log("GuidentPeerConnectionMediaNegotiator::onWebRtcPeerConnectionNegotiationSuccessful(): not implemented.");
    }

    onWebRtcPeerConnectionNegotiationError() {
        console.log("GuidentPeerConnectionMediaNegotiator::onWebRtcPeerConnectionNegotiationError(): not implemented.");     
    }

    async getLocalMediaStream() {
        console.log("GuidentPeerConnectionMediaNegotiator::getLocalMediaStream(): Not implemented.");
    }

    // AA: Can be removed if send message uses the one from the locator api
    // _sendMessage(messageType: GuidentMessageType, destinationId?: string, eventType?: GuidentMsgEventType, eventData?: any) {
    //     let msg: any = new Object();
    
    //     msg.messageType = messageType;
    //     msg.connectionId = this.connectionId;
    
    //     if (destinationId != null) {
    //       msg.peerConnectionId = destinationId;
    //     }
    
    //     if (msg.endpointId != null) msg.endpointId = this.endpointId;
    
    //     msg.endpointType = this.endpointType;
    //     msg.name = this.username;
    
    //     if (messageType === GuidentMessageType.REGISTER) {
    //       msg.credential = this.password;
    //       msg.authenticationUsername = this.authUsername;
    //       msg.authenticationToken = this.authToken;
    //     }
    
    //     if (messageType === GuidentMessageType.NOTIFY) {
    //       if (eventType) {
    //         msg.eventType = eventType;
    //         msg.status = GuidentMsgStatusType.UNKNOWN;
    //         if (eventData) {
    //           msg.eventData = eventData;
    //         }
    //       } else {
    //         msg.eventType = "status";
    //         msg.status = GuidentMsgStatusType.UNKNOWN;
    //       }
    //     }
    
    //     if (messageType === GuidentMessageType.ENGAGE_OFFER || messageType === GuidentMessageType.ENGAGE_ANSWER) {
    //       if (this.webrtcPeerConnection != null) {
    //         msg.iceServers = this.webrtcPeerConfiguration.iceServers;
    //         msg.sessiondescription = this.webrtcPeerConnection.localDescription;
    //       }
    //     }
    
    //     msg.sequence = this.localMessageSequence++;
    
    //     let str = JSON.stringify(msg);
    
    //     console.log(`GuidentPeerConnectionMediaNegotiator::_sendMessage(): Sending: <<${str}>>.`);
    //     this.websocketConnection!.send(str);
    //   }

    // setRemoteVideoId(cameraIndex: GuidentCameraPositions, videoTagId: string) {
    //     console.log("not implemented.");

    // }
     
    setLocalVideoId(id: string) {
      console.log("GuidentPeerConnectionMediaNegotiator::setLocalVideoId: not implemented.");
    }  
  
    setRemoteVideoId(cameraIndex: GuidentCameraPositions, videoTagId: string){
        console.log("ANDY: ", videoTagId);
        console.log("ANDY2: ", this.remoteVideoId);
        if (cameraIndex < 0 || cameraIndex >= GuidentCameraPositions.CAMERA_POSITIONS_LENGTH) {
          console.log("GuidentPeerConnectionMediaNegotiator::setRemoteVideoId(): Huh? Invalid video tag index.");
        }

        if ( this.remoteVideoId == null ) {
            console.log("ANDY HEEELLLPPP MEEEE!!!!");
        }
    
        const videoId = this.remoteVideoId[cameraIndex];
    
        if (videoId !== null) {
            const videoElement = document.getElementById(videoId);
    
            if (videoElement !== null && videoElement.nodeName === "VIDEO") {
                console.log("GuidentPeerConnectionMediaNegotiator::setRemoteVideoId(): Removing video feed from currently set video tag.");
                (videoElement as HTMLVideoElement).srcObject = null;
            }
    
            this.remoteVideoId[cameraIndex] = null;
        } else {
            console.log("GuidentPeerConnectionMediaNegotiator::setRemoteVideoId(): videoId is <<NULL>>");
        }
    
        console.log(`GuidentPeerConnectionMediaNegotiator::setRemoteVideoId(): Attempting to set the remote video tag for stream # ${cameraIndex}  to be <<${videoTagId}>>.`);
      console.log(videoTagId, document.getElementById(videoTagId));
      if ((videoTagId == null) || (document.getElementById(videoTagId) == null)) {
          console.error("GuidentPeerConnectionMediaNegotiator::setRemoteVideoId(): Oops, this id is not a valid tag to a video object in the DOM.");
          this.remoteVideoId[cameraIndex] = null;
        }
    
        this.remoteVideoId[cameraIndex] = videoTagId;
    }

    sendRemoteControlMessage(msg: string) {
        console.debug('WebsocketConnectionStateMachine::sendRemoteControlMessage', msg);
        if (msg != null && this.remoteControlDataChannel != null && this.remoteControlDataChannel.readyState === "open") {
          this.remoteControlDataChannel.send(msg);
        } else {
          console.error("WebsocketConnectionStateMachine::sendRemoteControlMessage(): Error sending remote control message on data channel.");
        }
    }

    _sendMessage(messageType: GuidentMessageType, destinationId?: string, eventType?: GuidentMsgEventType, eventData?: any, iceServers?: any, sdpPayload?: any) {
        if ( this.myEndpoint == null ) {
            console.error("GuidentPeerConnectionMediaNegotiator::_sendMessage(): not implemented.");
            return;
        }
        return(this.myEndpoint._sendMessage(messageType, destinationId, eventType, eventData, iceServers, sdpPayload));
    }
    

    startPeerEngagementOffer (peerId:string): boolean {
        console.log("GuidentPeerConnectionMediaNegotiator::startPeerEngagementOffer(): not implemented.");
        // PARENT: should contain the peer connection
        // CHILD: , local video stream, local audio stream, etc

      // should lock onto camera and audio. Both are going to try to take control of audio
      // AA: UPDATE: for now two way video will not use audio
        return false;
    }

    processPeerEngagementAnswer(msg: any): boolean {
        console.log("GuidentPeerConnectionMediaNegotiator::processPeerEngagementAnswer(): not implemented");
        // if ( this.myEndpoint ) { 

        // }
        return false;
    }

    /* Statemachine Control */

    engage(connectionId: string) {
        if ( this.myEndpoint == null ) {
            console.error("GuidentPeerConnectionMediaNegotiator::_sendMessage(): not implemented.");
            return;
        }
        console.log(`GuidentPeerConnectionMediaNegotiator::engage(): called with connection id: <<${connectionId}>>.`);
        this.myEndpoint.stateMachine.transition('vehiclebuttonclicked', connectionId);
    }

    setOfferVideoPayloadTypeManipulations(exclusivePtMid1?: number, exclusivePtMid2?: number, exclusivePtMid3?: number, changePtMid1?: number, changePtMid2?: number, changePtMid3?: number) {
        console.log("GuidentPeerConnectionMediaNegotiator::setOfferVideoPayloadTypeManipulations(): not implemented.")
    }

    _resetEngagement() {
        console.log("GuidentPeerConnectionMediaNegotiator::_resetEngagement(): not implemented.");
    }

    protected exclusivizeCodecInSdp(sdp: string, mediaSectionIndex: number, payloadType: number): string {
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



    protected changePayloadTypeForMid(sdp: string, mid: number, newpt: number): string {
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