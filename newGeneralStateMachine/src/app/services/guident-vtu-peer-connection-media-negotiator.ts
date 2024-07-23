import { GuidentPeerConnectionMediaNegotiator } from "./guident-peer-connection-media-negotiator";
import { GuidentMessageType, GuidentCameraPositions } from "./new-locator-api"


export class GuidentVtuPeerConnectionMediaNegotiator extends GuidentPeerConnectionMediaNegotiator {

    private localStream: MediaStream | null = null;
    // private remoteVideoId: (string | null)[] = [null, null, null];
    firstVideoMediaStream: MediaStream | null = null; 
    secondVideoMediaStream: MediaStream | null = null;
    thirdVideoMediaStream: MediaStream | null = null;
    localVideoId: string | null = null;

    constructor() {
        super("VTU");

        this.webrtcPeerConfiguration = {
            iceServers: [{'urls': "stun:guident.bluepepper.us:3478" }],
            bundlePolicy: 'max-bundle'
        };

    }

    override launchWebRtcPeerConnection() {
        console.log("GuidentVtuPeerConnectionMediaNegotiator::launchWebRtcNegotiation(): OK!");
    }

    // callbacks

    override onWebRtcPeerConnectionOfferComplete() {
        console.log("GuidentVtuPeerConnectionMediaNegotiator::onWebRtcPeerConnectionOfferComplete(): OK!");
    }
    
    override onWebRtcPeerConnectionAnswerArrived() {
        console.log("GuidentVtuPeerConnectionMediaNegotiator::onWebRtcPeerConnectionAnswerArrived(): OK!");
    }

    override onWebRtcPeerConnectionNegotiationSuccessful() {
        console.log("GuidentVtuPeerConnectionMediaNegotiator::onWebRtcPeerConnectionNegotiationSuccessful(): OK!");
    }

    override onWebRtcPeerConnectionNegotiationError() {
        console.log("GuidentVtuPeerConnectionMediaNegotiator::onWebRtcPeerConnectionNegotiationError(): OK!");     
    }

    protected override onTrack(ev: RTCTrackEvent) {
        super.onTrack(ev);
        const videoElement = document.getElementById(this.remoteVideoId![0]!);
        if (videoElement !== null && videoElement.nodeName === "VIDEO") {
            (videoElement as HTMLVideoElement).srcObject = ev.streams[0];
        }
    }

    // private _sendMessage(messageType: GuidentMessageType, peerId: string) {
    //     console.log(`Sending message: ${messageType} to peerId: ${peerId}`);
    //     // Implement the logic to send a message here
        
    // }

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
      
    /* AA: Not being called anywhere*/
    // setVehicleCameraConfiguration(destinationId: string, cameraViewIndex: number) {
    //     let msg: any = new Object();
    
    //     if (destinationId == null || cameraViewIndex == null || cameraViewIndex < 0 || cameraViewIndex > 2) {
    //       console.log("GuidentRmccEndpoint::setVehicleCameraConfiguration(): Parameter error!");
    //     }
    
    //     msg.messageType = "notify";
    //     msg.connectionId = this.connectionId;
    //     if (destinationId != null) {
    //       msg.peerConnectionId = destinationId;
    //     } else {
    //       return;
    //     }
    
    //     if (cameraViewIndex === 0) {
    //       msg.name = "cameraView_0";
    //     } else if (cameraViewIndex === 1) {
    //       msg.name = "cameraView_1";
    //     } else if (cameraViewIndex === 2) {
    //       msg.name = "cameraView_2";
    //     } else {
    //       console.log("GuidentRmccEndpoint::setVehicleCameraConfiguration(): Parameter error!");
    //       return;
    //     }
    
    //     if (msg.endpointId != null) msg.endpointId = this.endpointId;
    //     msg.endpointType = this.endpointType;
    //     msg.eventType = "command";
    //     msg.sequence = this.localMessageSequence++;
    
    //     let str = JSON.stringify(msg);
    
    //     console.log(`GuidentRmccEndpoint::setVehicleCameraConfiguration(): Sending: <<${str}>>.`);
    //     // this.websocketConnection!.send(str); // AA: what do I do with this?
    //     this.myEndpoint.websocketConnection
    // }



    override async getLocalMediaStream() { // AA: Called in user service
        try {
          this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          console.log("getLocalMediaStream()");
          console.log(this.localStream);
        } catch (e) {
          console.error("GuidentRmccEndpoint::localMediaStream(): Audio Device Not Found. Make sure your microphone is connected and enabled");
        }
    }

    // override setRemoteVideoId(cameraIndex: GuidentCameraPositions, videoTagId: string){
    //     if (cameraIndex < 0 || cameraIndex >= GuidentCameraPositions.CAMERA_POSITIONS_LENGTH) {
    //       console.log("GuidentPeerConnectionMediaNegotiator::setRemoteVideoId(): Huh? Invalid video tag index.");
    //     }

    //     if ( this.remoteVideoId == null ) {
    //         console.log("ANDY HEEELLLPPP MEEEE!!!!");
    //     }
    
    //     const videoId = this.remoteVideoId[cameraIndex];
    
    //     if (videoId !== null) {
    //         const videoElement = document.getElementById(videoId);
    
    //         if (videoElement !== null && videoElement.nodeName === "VIDEO") {
    //             console.log("GuidentPeerConnectionMediaNegotiator::setRemoteVideoId(): Removing video feed from currently set video tag.");
    //             (videoElement as HTMLVideoElement).srcObject = null;
    //         }
    
    //         this.remoteVideoId[cameraIndex] = null;
    //     } else {
    //         console.log("GuidentPeerConnectionMediaNegotiator::setRemoteVideoId(): videoId is <<NULL>>");
    //     }
    
    //     console.log(`GuidentPeerConnectionMediaNegotiator::setRemoteVideoId(): Attempting to set the remote video tag for stream # ${cameraIndex}  to be <<${videoTagId}>>.`);
    //     if ((videoTagId == null) || (document.getElementById(videoTagId) == null)) {
    //       console.error("GuidentPeerConnectionMediaNegotiator::setRemoteVideoId(): Oops, this id is not a valid tag to a video object in the DOM.");
    //       this.remoteVideoId[cameraIndex] = null;
    //     }
    
    //     this.remoteVideoId[cameraIndex] = videoTagId;
    //     // console.log(this.remoteVideoId[cameraIndex]);
    // }

    override startPeerEngagementOffer(peerId: string): boolean {
        console.log("GuidentVtuPeerConnectionMediaNegotiator::startPeerEngagementOffer(): guident vtu starting peer");

        console.log("remoteVideoId:", this.remoteVideoId);
        console.log(`GuidentVtuPeerConnectionMediaNegotiator::startPeerEngagementOffer(): Attempting engagement with peer id: <<${peerId}>>.`);

        const constraints = {
        video: true,
        audio: true,
        };
        
        if (this.remoteVideoId[0] == null || document.getElementById(this.remoteVideoId[0]) == null || document.getElementById(this.remoteVideoId[0])!.nodeName !== "VIDEO") {
        console.error("GuidentVtuPeerConnectionMediaNegotiator::startPeerEngagementOffer(): Need to set remote video element for index 0.");
        return false;
        }

        if (this.remoteVideoId[1] == null || document.getElementById(this.remoteVideoId[1]) == null || document.getElementById(this.remoteVideoId[1])!.nodeName !== "VIDEO") {
        console.error("GuidentVtuPeerConnectionMediaNegotiator::startPeerEngagementOffer(): Need to set remote video element for index 1.");
        return false;
        }

        if (this.remoteVideoId[2] == null || document.getElementById(this.remoteVideoId[2]) == null || document.getElementById(this.remoteVideoId[2])!.nodeName !== "VIDEO") {
        console.error("GuidentVtuPeerConnectionMediaNegotiator::startPeerEngagementOffer(): Need to set remote video element for index 2.");
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

        console.log("WebsocketConnectionStateMachine.startPeerEngagementOffer(): Adding transceivers.");
        this.localStream!.getTracks().forEach(track => this.webrtcPeerConnection!.addTransceiver(track, { direction: "sendrecv" }));
        this.webrtcPeerConnection!.addTransceiver("video", { direction: "recvonly" });
        this.webrtcPeerConnection!.addTransceiver("video", { direction: "recvonly" });
        this.webrtcPeerConnection!.addTransceiver("video", { direction: "recvonly" });

        console.log("WebsocketConnectionStateMachine.startPeerEngagementOffer(): Setting up data channel.");
        this.remoteControlDataChannel = this.webrtcPeerConnection!.createDataChannel("foo");
        if (this.remoteControlDataChannel != null) {
        this.remoteControlDataChannel.onopen = (event: Event) => {
            console.log("WebsocketConnectionStateMachine.remoteControlDataChannel.onopen(): The data channel is now open.");
            this.onDataChannelOpen(event);
        };
        this.remoteControlDataChannel.onmessage = (event: MessageEvent) => {
            this.onDataChannelMessage(event);
        };
        this.remoteControlDataChannel.onclose = (event: Event) => {
            console.log("WebsocketConnectionStateMachine.remoteControlDataChannel.onclose(): The data channel is now closed.");
            this.onDataChannelClose(event);
            this.remoteControlDataChannel = null;
        };
        this.remoteControlDataChannel.onerror = (event: Event) => {
            console.error("WebsocketConnectionStateMachine.remoteControlDataChannel.onerror(): Oops, the data channel has generated an error.");
            this.onDataChannelError(event);
            this.remoteControlDataChannel = null;
        };
        }

        console.log("WebsocketConnectionStateMachine.startPeerEngagementOffer(): Creating offer and sending engagement request.");
        this.webrtcPeerConnection.createOffer().then((description) => {
        let sdp = description.sdp;
        if(sdp) {
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
                console.log("WebsocketConnectionStateMachine.startPeerEngagementOffer::oniceconnectionstatechange(): Completed!");
                resolve("gathering complete");
            } else {
                console.log(`WebsocketConnectionStateMachine.startPeerEngagementOffer::oniceconnectionstatechange(): Got an ice candidate: <<${iceevt.candidate.candidate}>>`);
            }
            };
            setTimeout(() => { reject("Timeout gathering candidates"); }, 65000);
        });
        }).then((promiseResult) => {
        console.log(`WebsocketConnectionStateMachine.startPeerEngagementOffer(): the wait-for-ice-candidates promise result: <<${promiseResult}>>, Sending offer.`);
        this._sendMessage(GuidentMessageType.ENGAGE_OFFER, peerId);
        }).catch((err) => {
        this.myEndpoint.transition('engagementerror', err);
        });

        // this.peerConnectionId = peerId;

        return true;
    }

    override processPeerEngagementAnswer(msg: any): boolean {
        console.log(`GuidentVtuPeerConnectionMediaNegotiator::_processPeerEngagementAnswer(): Attempting to process answer SDP from remote vehicle with peer id: <<${msg.peerConnectionId}>>.`);
    
        if (msg.messageType !== GuidentMessageType.ENGAGE_ANSWER) {
          console.log("GuidentVtuPeerConnectionMediaNegotiator::processPeerEngagementAnswer(): Huh?");
          return false;
        }
    
        if (msg == undefined || msg == null || msg.sessiondescription == undefined || msg.sessiondescription == null || msg.sessiondescription === "") {
          console.log("GuidentVtuPeerConnectionMediaNegotiator::processPeerEngagementAnswer(): Huh? session description is invalid");
          return false;
        }
    
        this.webrtcPeerConnection!.setRemoteDescription(new RTCSessionDescription(msg.sessiondescription)).then(() => {
          console.log("GuidentVtuPeerConnectionMediaNegotiator::processPeerEngagementAnswer()::callBack(): remote answer sdp has been set.");
          this._sendMessage(GuidentMessageType.ENGAGE_ACK, msg.peerConnectionId);
        }).catch((err) => {
          console.log(`GuidentVtuPeerConnectionMediaNegotiator::processPeerEngagementAnswer()::callBack(): Error on setRemoteDescription() : <<${err}>>.`);
          this.myEndpoint.transition('engagementerror', err);
        });
    
        return true;
      }

    // private exclusivizeCodecInSdp(sdp: string, mediaSectionIndex: number, payloadType: number): string {
    //     let sdpLines = sdp.split('\r\n');
    //     let mLineIndices = [];
    //     for (let i = 0; i < sdpLines.length; i++) {
    //       if (sdpLines[i].search('m=audio') !== -1) {
    //         mLineIndices.push(i);
    //       }
    //       if (sdpLines[i].search('m=video') !== -1) {
    //         mLineIndices.push(i);
    //       }
    //     }
    //     mLineIndices.push(sdpLines.length);
    
    //     if ((mediaSectionIndex < 0) || (mediaSectionIndex > (mLineIndices.length - 2))) {
    //       console.log(`exclusivizeCodecInSdp(): Oops, this SDP doesn't have a ${mediaSectionIndex}th m= section.`);
    //       return sdp;
    //     }
    
    //     let startingLineIdx = mLineIndices[mediaSectionIndex];
    //     let endingLineIdx = mLineIndices[mediaSectionIndex + 1];
    
    //     let payloadTypeStr = ` ${payloadType}`;
    
    //     if (sdpLines[startingLineIdx].search(payloadTypeStr) === -1) {
    //       console.log(`exclusivizeCodecInSdp(): Oops, this SDP's m= section # ${mediaSectionIndex} doesn't have a ${payloadTypeStr} payload number.`);
    //       return sdp;
    //     }
    
    //     payloadTypeStr = `${payloadType}`;
    
    //     let elements = sdpLines[startingLineIdx].split(' ');
    //     let replaceElements = [elements[0], elements[1], elements[2], payloadTypeStr];
    
    //     sdpLines[startingLineIdx] = replaceElements.join(' ');
    
    //     let returnSdpLines = [];
    
    //     for (let j = 0; j < startingLineIdx; j++) {
    //       returnSdpLines.push(sdpLines[j]);
    //     }
    
    //     for (let j = startingLineIdx; j < endingLineIdx; j++) {
    //       let lineIsOkToKeep = true;
    
    //       if (sdpLines[j].search('a=extmap:4') !== -1) {
    //         lineIsOkToKeep = false;
    //       }
    
    //       if (sdpLines[j].search('a=rtpmap:') !== -1) {
    //         if (sdpLines[j].search(`a=rtpmap:${payloadTypeStr}`) === -1) {
    //           lineIsOkToKeep = false;
    //         }
    //       }
    //       if (sdpLines[j].search('a=fmtp:') !== -1) {
    //         if (sdpLines[j].search(`a=fmtp:${payloadTypeStr}`) === -1) {
    //           lineIsOkToKeep = false;
    //         }
    //       }
    //       if (sdpLines[j].search('a=rtcp-fb:') !== -1) {
    //         if (sdpLines[j].search(`rtcp-fb:${payloadTypeStr}`) === -1) {
    //           lineIsOkToKeep = false;
    //         }
    //       }
    //       if (lineIsOkToKeep) {
    //         returnSdpLines.push(sdpLines[j]);
    //       }
    //     }
    
    //     for (let j = endingLineIdx; j < mLineIndices[mLineIndices.length - 1]; j++) {
    //       returnSdpLines.push(sdpLines[j]);
    //     }
    
    //     let newSdp = returnSdpLines.join('\r\n');
    //     return newSdp;
    //   }

      private _sendDisengagement(peerId: string) {
        console.log(`GuidentRmccEndpoint._sendDisengagement(): Attempting to send disengage message to peer id: <<${peerId}>>.`);
        this.sendRemoteControlMessage(JSON.stringify({ engaged: false, transmitTimestamp: Date.now() }));
        try {
          this._sendMessage(GuidentMessageType.DISENGAGE, peerId);
        } catch (err) {
          console.warn("GuidentRmccEndpoint._sendDisengagement(): Exception thrown when sending the disengagement message, data channel might be closed.");
        }
      }
    
      override _resetEngagement() {
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
    
      override setOfferVideoPayloadTypeManipulations(exclusivePtMid1?: number, exclusivePtMid2?: number, exclusivePtMid3?: number, changePtMid1?: number, changePtMid2?: number, changePtMid3?: number) {
        try {
          if (exclusivePtMid1 != undefined && exclusivePtMid1 != null) this.exclusiveVideoPayloadTypeForMid1 = exclusivePtMid1;
          if (exclusivePtMid2 != undefined && exclusivePtMid2 != null) this.exclusiveVideoPayloadTypeForMid2 = exclusivePtMid2;
          if (exclusivePtMid3 != undefined && exclusivePtMid3 != null) this.exclusiveVideoPayloadTypeForMid3 = exclusivePtMid3;
          if (changePtMid1 != undefined && changePtMid1 != null) this.changeVideoPayloadTypeForMid1 = changePtMid1;
          if (changePtMid2 != undefined && changePtMid2 != null) this.changeVideoPayloadTypeForMid2 = changePtMid2;
          if (changePtMid3 != undefined && changePtMid3 != null) this.changeVideoPayloadTypeForMid3 = changePtMid3;
        } catch (err) {
          console.warn("GuidentVtuPeerConnectionMediaNegotiator::setOfferVideoPayloadTypeManipulations");
        }
      }
    
      
    
    //   private changePayloadTypeForMid(sdp: string, mid: number, newpt: number): string {
    //     let sdpLines = sdp.split('\r\n');
    //     let mLineIndices = [];
    //     for (let i = 0; i < sdpLines.length; i++) {
    //       if (sdpLines[i].search('m=audio') !== -1) {
    //         mLineIndices.push(i);
    //       }
    //       if (sdpLines[i].search('m=video') !== -1) {
    //         mLineIndices.push(i);
    //       }
    //     }
    //     mLineIndices.push(sdpLines.length);
    
    //     let startingLineIdx = mLineIndices[mid];
    //     let endingLineIdx = mLineIndices[mid + 1];
    
    //     let mlinePieces = sdpLines[startingLineIdx].split(' ');
    //     if (mlinePieces.length !== 4) {
    //       console.error(`changePayloadTypeForMid() Oops, can't process mline: <<${sdpLines[startingLineIdx]}>>.`);
    //       return sdp;
    //     }
    
    //     if (isNaN(parseInt(mlinePieces[mlinePieces.length - 1]))) {
    //       console.error(`changePayloadTypeForMid() Oops, can't process mline: <<${sdpLines[startingLineIdx]}>>.`);
    //       return sdp;
    //     }
    
    //     let oldpt = parseInt(mlinePieces[mlinePieces.length - 1]);
    
    //     let newMline = "";
    //     for (let i = 0; i < mlinePieces.length - 1; i++) {
    //       newMline += mlinePieces[i];
    //       newMline += " ";
    //     }
    
    //     newMline += newpt;
    //     sdpLines[startingLineIdx] = newMline;
    
    //     for (let i = startingLineIdx; i < endingLineIdx; i++) {
    //       if (sdpLines[i].search('a=rtpmap:') !== -1) {
    //         let re = new RegExp(`a=rtpmap:${oldpt}`);
    //         sdpLines[i] = sdpLines[i].replace(re, `a=rtpmap:${newpt}`);
    //       }
    //       if (sdpLines[i].search('a=fmtp:') !== -1) {
    //         let re = new RegExp(`a=fmtp:${oldpt}`);
    //         sdpLines[i] = sdpLines[i].replace(re, `a=fmtp:${newpt}`);
    //       }
    //       if (sdpLines[i].search('a=rtcp-fb:') !== -1) {
    //         let re = new RegExp(`a=rtcp-fb:${oldpt}`);
    //         sdpLines[i] = sdpLines[i].replace(re, `a=rtcp-fb:${newpt}`);
    //       }
    //     }
    
    //     let newSdp = sdpLines.join('\r\n');
    //     return newSdp;
    //   }
}
