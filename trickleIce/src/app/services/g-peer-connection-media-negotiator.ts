import { GuidentLogger } from "./guident-logger";
import { endpoint } from "./endpoint";
import { GuidentMessageType, GuidentCameraPositions, GuidentMsgEventType } from "./vehicle-locator-api";

export class GPeerConnectionMediaNegotiator {

    myEndpoint: any = null;
    webrtcPeerConfiguration: RTCConfiguration = { iceServers: [] };
    private pcMediaNegotiatorType: string = "";
    webrtcPeerConnection: RTCPeerConnection | null = null;
    protected remoteControlDataChannel: RTCDataChannel | null = null;

    connectionId: string | null = null;
    endpointId: string | null = null;
    endpointType: string | null = null;
    username: string | null = null;
    password: string | null = null;
    authUsername: string | null = null;
    authToken: string | null = null;
    localMessageSequence: number = 1;

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

    /**
     * Function to update the ice servers that the connection will use
     * @param newServers The new ice servers to set on the call
     */
    public setIceServer(newServers: RTCIceServer[]){
      this.webrtcPeerConfiguration.iceServers = newServers;
      GuidentLogger.logDebug("GPeerConnectionMediaNegotiator","setIceServer(): Workstation will use the following ice servers: ", this.webrtcPeerConfiguration.iceServers);
    }

    /**
     * Function to update the endpoint.
     * @param ep The new endpoint
     */
    public setEndpoint(ep: endpoint) {
        this.myEndpoint = ep;
    }


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

    /**
     * Returns the type of the media negotiator
     */
    getMediaNegotiatorType(): string {
        return(this.pcMediaNegotiatorType);
    }

    getWebRTCConnection(){
      if(this.webrtcPeerConnection) return this.webrtcPeerConnection;
      else return null;
    }

    /**
     * Function which will be overridden by the device's media negotiator
     */
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

    setLocalVideoId(id: string) {
      console.log("GuidentPeerConnectionMediaNegotiator::setLocalVideoId: not implemented.");
    }

    startPeerEngagementOffer (peerId:string): boolean {
      console.log("GuidentPeerConnectionMediaNegotiator::startPeerEngagementOffer(): not implemented.");
      return false;
    }

    processPeerEngagementAnswer(msg: any): boolean {
      console.log("GuidentPeerConnectionMediaNegotiator::processPeerEngagementAnswer(): not implemented");
      return false;
    }

    _sendDisengagement(peerId: string): boolean{
      console.log("GuidentPeerConnectionMediaNegotiator::processPeerEngagementAnswer(): not implemented");
      return false;
    }


    /**
     * Function to link the video tag with the remote id of the video
     * @param cameraIndex The index of the camera
     * @param videoTagId The tag id to link to
     */
    setRemoteVideoId(cameraIndex: GuidentCameraPositions, videoTagId: string){

      //Make sure that the index of the camera is within correct parameters
      if (cameraIndex < 0 || cameraIndex >= GuidentCameraPositions.CAMERA_POSITIONS_LENGTH) {
        console.log("GuidentPeerConnectionMediaNegotiator::setRemoteVideoId(): Invalid video tag index passed to the function.");
      }

      if ( this.remoteVideoId == null ) {
        console.log("GuidentPeerConnectionMediaNegotiator::setRemoteVideoId(): The array which should contain the id's is null")
      }

      //Grab the current tag for the camera that we want to change
      const videoId = this.remoteVideoId[cameraIndex];

      //Check if the old video reference needs to be nulled
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
      if ((videoTagId == null) || (document.getElementById(videoTagId) == null)) {
        console.error("GuidentPeerConnectionMediaNegotiator::setRemoteVideoId(): Oops, this id is not a valid tag to a video object in the DOM.");
        this.remoteVideoId[cameraIndex] = null;
      }
      //Update the video's tag
      this.remoteVideoId[cameraIndex] = videoTagId;
    }

    /**
     * Function to set the src property for each video tag to null
     */
    nullVideoStreams() {
      console.log("GPeerConnectionMediaNegotiator::nullVideoStreams(): Will set all the video streams to null srcObject.");
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

    sendRemoteControlMessage(msg: string) {
        console.debug('WebsocketConnectionStateMachine::sendRemoteControlMessage', msg);
        // console.table(this.remoteControlDataChannel)

        if (msg != null && this.remoteControlDataChannel != null && this.remoteControlDataChannel.readyState === "open") {
          this.remoteControlDataChannel.send(msg);
        } else if (this.remoteControlDataChannel!.readyState === "connecting"){
          GuidentLogger.logInfo("GPeerConnectionMediaNegotiator", "sendRemoteControlMessage(): Attempting to send message but the data channel is in the connecting state...")
        } else {
          console.error("GPeerConnectionMediaNegotiator::sendRemoteControlMessage(): Error sending remote control message on data channel.");
        }
    }

    _sendMessage(messageType: GuidentMessageType, destinationId?: string, eventType?: GuidentMsgEventType, eventData?: any, iceServers?: any, sdpPayload?: any) {
        if ( this.myEndpoint == null ) {
            console.error("GuidentPeerConnectionMediaNegotiator::_sendMessage(): not implemented.");
            return;
        }
        return(this.myEndpoint._sendMessage(messageType, destinationId, eventType, eventData, iceServers, sdpPayload));
    }


    /* Statemachine Control */
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
