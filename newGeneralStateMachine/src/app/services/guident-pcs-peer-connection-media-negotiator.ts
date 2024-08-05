import { GuidentPeerConnectionMediaNegotiator } from "./guident-peer-connection-media-negotiator";
import { GuidentMessageType, GuidentCameraPositions, GuidentMsgEventType } from "./new-locator-api"


export class GuidentPcsPeerConnectionMediaNegotiator extends GuidentPeerConnectionMediaNegotiator {

    localStream: MediaStream | null = null;
    firstVideoMediaStream: MediaStream | null = null; 
    secondVideoMediaStream: MediaStream | null = null;
    thirdVideoMediaStream: MediaStream | null = null;
    localVideoId: string | null = null;

    constructor() {
        super("PCS");
        // this.webrtcPeerConfiguration = {
        //     iceServers: [{
        //         urls: [ "stun:us-turn5.xirsys.com" ]
        //       }, {
        //           username: "_DYVz1xUZvXJHIlhLB1ucpO50HEc98R9fOMH4xm13sTFd-3lhmM5Wxjee4ulyvLrAAAAAGRZMGpndWlkZW50",
        //           credential: "41d94e58-edc5-11ed-8e3f-0242ac140004",
        //           urls: [
        //               "turn:us-turn5.xirsys.com:80?transport=udp",
        //               "turn:us-turn5.xirsys.com:3478?transport=udp",
        //               "turn:us-turn5.xirsys.com:80?transport=tcp",
        //               "turn:us-turn5.xirsys.com:3478?transport=tcp",
        //               "turns:us-turn5.xirsys.com:443?transport=tcp",
        //               "turns:us-turn5.xirsys.com:5349?transport=tcp"
        //         ]
        //       }],
        //     bundlePolicy: 'max-bundle'
        // }

        // AA: delete
        this.webrtcPeerConfiguration = {
            iceServers: [{'urls': "stun:guident.bluepepper.us:3478" }],
            bundlePolicy: 'max-bundle'
        };
    }

    override launchWebRtcPeerConnection() {
        console.log("GuidentPcsPeerConnectionMediaNegotiator::launchWebRtcNegotiation(): OK!");
    }

    // callbacks

    override onWebRtcPeerConnectionOfferComplete() {
        console.log("GuidentPcsPeerConnectionMediaNegotiator::onWebRtcPeerConnectionOfferComplete(): OK!");
    }
    
    override onWebRtcPeerConnectionAnswerArrived() {
        console.log("GuidentPcsPeerConnectionMediaNegotiator::onWebRtcPeerConnectionAnswerArrived(): OK!");
    }

    override onWebRtcPeerConnectionNegotiationSuccessful() {
        console.log("GuidentPcsPeerConnectionMediaNegotiator::onWebRtcPeerConnectionNegotiationSuccessful(): OK!");
    }

    override onWebRtcPeerConnectionNegotiationError() {
        console.log("GuidentPcsPeerConnectionMediaNegotiator::onWebRtcPeerConnectionNegotiationError(): OK!");     
    }
    
    protected override onTrack(ev: RTCTrackEvent) {
        super.onTrack(ev);
        const videoElement = document.getElementById(this.remoteVideoId![0]!);
        if (videoElement !== null && videoElement.nodeName === "VIDEO") {
            (videoElement as HTMLVideoElement).srcObject = ev.streams[0];
        }
    }

    swapVideos() {
        if (this.firstVideoMediaStream == null || this.secondVideoMediaStream == null) {
            console.error("GuidentPcsPeerConnectionMediaNegotiator::swapVideos(): Oops, the media streams aren't set up.");
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
        
        console.log("GuidentPcsPeerConnectionMediaNegotiator::swapVideos(): Swapped!");
    }

    nullVideoStreams() {
        console.log("GuidentPcsPeerConnectionMediaNegotiator::nullVideoStreams(): Will set all the video streams to null srcObject.");
        
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
        console.log("GuidentPcsPeerConnectionMediaNegotiator::resetVideoStreams(): Will set the video streams to the newly set video tag id's");

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

    override async getLocalMediaStream() { // AA: Called in user service
        try {
          this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          console.log("GuidentRmccEndpoint::getlocalMediaStream(): ", this.localStream);
        } catch (e) {
          console.error("GuidentRmccEndpoint::getlocalMediaStream(): Audio Device Not Found. Make sure your microphone is connected and enabled");
        }
    }

    override startPeerEngagementOffer(peerId: string): boolean {

        console.log("GuidentPcsPeerConnectionMediaNegotiator::startPeerEngagementOffer(): guident vtu starting peer");
        console.log(`GuidentPcsPeerConnectionMediaNegotiator::startPeerEngagementOffer(): Attempting engagement with peer id: <<${peerId}>>.`);

        const constraints = {
        video: true,
        audio: true,
        };

        if (this.remoteVideoId[0] == null || document.getElementById(this.remoteVideoId[0]) == null || document.getElementById(this.remoteVideoId[0])!.nodeName !== "VIDEO") {
        console.error("GuidentPcsPeerConnectionMediaNegotiator::startPeerEngagementOffer(): Need to set remote video element for index 0.");
        return false;
        }

        if (this.remoteVideoId[1] == null || document.getElementById(this.remoteVideoId[1]) == null || document.getElementById(this.remoteVideoId[1])!.nodeName !== "VIDEO") {
        console.error("GuidentPcsPeerConnectionMediaNegotiator::startPeerEngagementOffer(): Need to set remote video element for index 1.");
        return false;
        }

        if (this.remoteVideoId[2] == null || document.getElementById(this.remoteVideoId[2]) == null || document.getElementById(this.remoteVideoId[2])!.nodeName !== "VIDEO") {
        console.error("GuidentPcsPeerConnectionMediaNegotiator::startPeerEngagementOffer(): Need to set remote video element for index 2.");
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
            console.log("GuidentPcsPeerConnectionMediaNegotiator::startPeerEngagementOffer(): SDP constructed ", newSdp);
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
        this._sendMessage(GuidentMessageType.ENGAGE_OFFER, peerId, GuidentMsgEventType.UNKNOWN, null, this.webrtcPeerConfiguration.iceServers, this.webrtcPeerConnection?.localDescription);
        }).catch((err) => {
        this.myEndpoint.stateMachine.transition('engagementerror', err)
        });

        // this.peerConnectionId = peerId;

        return true;
    }

    override processPeerEngagementAnswer(msg: any): boolean {
        console.log(`GuidentPcsPeerConnectionMediaNegotiator::_processPeerEngagementAnswer(): Attempting to process answer SDP from remote vehicle with peer id: <<${msg.peerConnectionId}>>.`);
    
        if (msg.messageType !== GuidentMessageType.ENGAGE_ANSWER) {
          console.log("GuidentPcsPeerConnectionMediaNegotiator::processPeerEngagementAnswer(): Huh?");
          return false;
        }
    
        if (msg == undefined || msg == null || msg.sessiondescription == undefined || msg.sessiondescription == null || msg.sessiondescription === "") {
          console.log("GuidentPcsPeerConnectionMediaNegotiator::processPeerEngagementAnswer(): Huh? session description is invalid");
          return false;
        }
    
        this.webrtcPeerConnection!.setRemoteDescription(new RTCSessionDescription(msg.sessiondescription)).then(() => {
          console.log("GuidentPcsPeerConnectionMediaNegotiator::processPeerEngagementAnswer()::callBack(): remote answer sdp has been set.");
          this._sendMessage(GuidentMessageType.ENGAGE_ACK, msg.peerConnectionId);
        }).catch((err) => {
          console.log(`GuidentPcsPeerConnectionMediaNegotiator::processPeerEngagementAnswer()::callBack(): Error on setRemoteDescription() : <<${err}>>.`);
          this.myEndpoint.transition('engagementerror', err);
        });
    
        return true;
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
}
