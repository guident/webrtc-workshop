import { GuidentPeerConnectionMediaNegotiator } from "./guident-peer-connection-media-negotiator";
import { GuidentMessageType, GuidentCameraPositions, GuidentMsgEventType } from "./new-locator-api"

/* AA: Questions
1. How to decide how to instantiate pcnm and endpoint? Based on constructor ofuser service but why?
    - dependancy injection in user1 service automatically gets instantiated in constructor
    - current
2. Why does user1 remote videoId on Init?
 - user 2 (PCM) does not need to be instantiated on init but rather on an event like when a button
    is pressed or you recieve a call.
3. Do I need a new endpoint for a new media negotiator?
    - No, but need to specify connectionId in constructor of endpoint
4. Which javascript code do I need to run on another pc?
    - two way video port 8848
5. what is the vehicleId of the Gmobile?
    - 2
*/

export class GuidentTwvPeerConnectionMediaNegotiator extends GuidentPeerConnectionMediaNegotiator {

    localStream: MediaStream | null = null;
    firstVideoMediaStream: MediaStream | null = null;
    localVideoId: string | null = null;
    dataChannel: RTCDataChannel | null = null;
    // localVideoId: string | null = "user3LocalVideo";

    constructor() {
        super("TWV");

        this.webrtcPeerConfiguration = {
            iceServers: [{'urls': "stun:guident.bluepepper.us:3478" }],
            bundlePolicy: 'max-bundle'
        };

    }

    override launchWebRtcPeerConnection() {
        console.log("GuidentTwvPeerConnectionMediaNegotiator::launchWebRtcNegotiation(): OK!");
    }

    // callbacks

    override onWebRtcPeerConnectionOfferComplete() {
        console.log("GuidentTwvPeerConnectionMediaNegotiator::onWebRtcPeerConnectionOfferComplete(): OK!");
    }

    override onWebRtcPeerConnectionAnswerArrived() {
        console.log("GuidentTwvPeerConnectionMediaNegotiator::onWebRtcPeerConnectionAnswerArrived(): OK!");
    }

    override onWebRtcPeerConnectionNegotiationSuccessful() {
        console.log("GuidentTwvPeerConnectionMediaNegotiator::onWebRtcPeerConnectionNegotiationSuccessful(): OK!");
    }

    override onWebRtcPeerConnectionNegotiationError() {
        console.log("GuidentTwvPeerConnectionMediaNegotiator::onWebRtcPeerConnectionNegotiationError(): OK!");
    }

    protected override onTrack(ev: RTCTrackEvent) {
        super.onTrack(ev);
        const videoElement = document.getElementById(this.remoteVideoId![0]!);
        if (videoElement !== null && videoElement.nodeName === "VIDEO") {
            (videoElement as HTMLVideoElement).srcObject = ev.streams[0];
        }
    }

    nullVideoStreams() {
        console.log("GuidentTwvPeerConnectionMediaNegotiator::nullVideoStreams(): Will set all the video streams to null srcObject.");

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


        // console.log("MIKE", this.remoteVideoId[0]);

        // console.log(document.getElementById(this.remoteVideoId[0]));

        if (this.remoteVideoId[0] != null && document.getElementById(this.remoteVideoId[0]) != null && document.getElementById(this.remoteVideoId[0])!.nodeName === "VIDEO") {
            (document.getElementById(this.remoteVideoId[0]) as HTMLVideoElement).srcObject = this.firstVideoMediaStream;
        }
    }

    override _resetEngagement() {
        try {
            console.log("GuidentTwvPeerConnectionMediaNegotiator._resetEngagement(): Resetting webrtc peer connection.");

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


            this.firstVideoMediaStream = null;

            if (this.webrtcPeerConnection != null) this.webrtcPeerConnection.close();
            this.webrtcPeerConnection = null;

            this.remoteControlDataChannel = null;
            console.log("GuidentTwvPeerConnectionMediaNegotiator::_resetEngagement(): Done");
        } catch (err) {
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
            this.localStream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });  // AA: changed this to be video only
            console.log("GuidentTwvPeerConnectionMediaNegotiator::getlocalMediaStream(): ", this.localStream);
        } catch (e) {
            console.error("GuidentTwvPeerConnectionMediaNegotiator::getlocalMediaStream(): Audio Device Not Found. Make sure your microphone is connected and enabled");
        }
    }

    override startPeerEngagementOffer(peerId: string): boolean {

        console.log("GuidentTwvPeerConnectionMediaNegotiator::startPeerEngagementOffer(): guident vtu starting peer");
        console.log(`GuidentTwvPeerConnectionMediaNegotiator::startPeerEngagementOffer(): Attempting engagement with peer id: <<${peerId}>>.`);

        const constraints = {
        video: true,
        audio: true,
        };

        console.log("MIKE", this.remoteVideoId[0]);
        if (this.remoteVideoId[0] == null || document.getElementById(this.remoteVideoId[0]) == null || document.getElementById(this.remoteVideoId[0])!.nodeName !== "VIDEO") {
        console.error("GuidentTwvPeerConnectionMediaNegotiator::startPeerEngagementOffer(): Need to set remote video element for index 0.");
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
                updateVideoElement(this.firstVideoMediaStream, this.remoteVideoId[0]);
            }
        };

        if (this.localVideoId != null && document.getElementById(this.localVideoId) != null) {
            (document.getElementById(this.localVideoId) as HTMLVideoElement).srcObject = this.localStream;
        }

        console.log("GuidentTwvPeerConnectionMediaNegotiator::startPeerEngagementOffer(): Adding transceivers.");
        this.localStream!.getTracks().forEach(track => this.webrtcPeerConnection!.addTransceiver(track, { direction: "sendrecv" }));
        this.webrtcPeerConnection!.addTransceiver("video", { direction: "sendrecv" });

        console.log("GuidentTwvPeerConnectionMediaNegotiator::startPeerEngagementOffer(): Setting up data channel.");
        this.remoteControlDataChannel = this.webrtcPeerConnection!.createDataChannel("foo");
        if (this.remoteControlDataChannel != null) {
        this.remoteControlDataChannel.onopen = (event: Event) => {
            console.log("GuidentTwvPeerConnectionMediaNegotiator::remoteControlDataChannel.onopen(): The data channel is now open.");
            this.onDataChannelOpen(event);
        };
        this.remoteControlDataChannel.onmessage = (event: MessageEvent) => {
            this.onDataChannelMessage(event);
        };
        this.remoteControlDataChannel.onclose = (event: Event) => {
            console.log("GuidentTwvPeerConnectionMediaNegotiator::remoteControlDataChannel.onclose(): The data channel is now closed.");
            this.onDataChannelClose(event);
            this.remoteControlDataChannel = null;
        };
        this.remoteControlDataChannel.onerror = (event: Event) => {
            console.error("GuidentTwvPeerConnectionMediaNegotiator::remoteControlDataChannel.onerror(): Oops, the data channel has generated an error.");
            this.onDataChannelError(event);
            this.remoteControlDataChannel = null;
        };
        }

        console.log("GuidentTwvPeerConnectionMediaNegotiator::startPeerEngagementOffer(): Creating offer and sending engagement request.");
        this.webrtcPeerConnection.createOffer().then((description) => {
        let sdp = description.sdp;
        if(sdp) {
            let newSdp = this.exclusivizeCodecInSdp(sdp, 1, this.exclusiveVideoPayloadTypeForMid1);
            newSdp = this.changePayloadTypeForMid(newSdp, 1, this.changeVideoPayloadTypeForMid1);
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
                console.log("GuidentTwvPeerConnectionMediaNegotiator::startPeerEngagementOffer::oniceconnectionstatechange(): Completed!");
                resolve("gathering complete");
            } else {
                console.log(`GuidentTwvPeerConnectionMediaNegotiator::startPeerEngagementOffer::oniceconnectionstatechange(): Got an ice candidate: <<${iceevt.candidate.candidate}>>`);
            }
            };
            setTimeout(() => { reject("Timeout gathering candidates"); }, 65000);
        });
        }).then((promiseResult) => {
        console.log(`GuidentTwvPeerConnectionMediaNegotiator::startPeerEngagementOffer(): the wait-for-ice-candidates promise result: <<${promiseResult}>>, Sending offer.`);
        this._sendMessage(GuidentMessageType.ENGAGE_OFFER, peerId, GuidentMsgEventType.UNKNOWN, null, this.webrtcPeerConfiguration.iceServers, this.webrtcPeerConnection?.localDescription);
        // this.
        }).catch((err) => {
            console.log("I am an error", err);
        this.myEndpoint.stateMachine.transition('engagementerror', err)
        });

        this.createDataChannel();

        return true;
    }

    override processPeerEngagementAnswer(msg: any): boolean {
        console.log(msg)
        console.log(`GuidentTwvPeerConnectionMediaNegotiator::_processPeerEngagementAnswer(): Attempting to process answer SDP from remote vehicle with peer id: <<${msg.peerConnectionId}>>.`);

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

    createDataChannel(): RTCDataChannel | null{
      if(!this.webrtcPeerConnection){
        console.error("createDataChannel():: No PeerConnection object created, returning");
        return null;
      }
      this.dataChannel = this.webrtcPeerConnection.createDataChannel("test-channel");
      console.log("createDataChannel():: Creating the data channel: ", this.dataChannel);
      return this.dataChannel;
    }

    async sendMessageOnDataChannel(msg: any){

      if(!this.dataChannel){
        let channel = this.createDataChannel();
        if(channel) channel.send(msg);
      } else {
        this.dataChannel.send(msg);
      }

    }

    override setOfferVideoPayloadTypeManipulations(exclusivePtMid1?: number, exclusivePtMid2?: number, exclusivePtMid3?: number, changePtMid1?: number, changePtMid2?: number, changePtMid3?: number) {
        try {
          if (exclusivePtMid1 != undefined && exclusivePtMid1 != null) this.exclusiveVideoPayloadTypeForMid1 = exclusivePtMid1;
          if (changePtMid1 != undefined && changePtMid1 != null) this.changeVideoPayloadTypeForMid1 = changePtMid1;
        } catch (err) {
          console.warn("GuidentTwvPeerConnectionMediaNegotiator::setOfferVideoPayloadTypeManipulations");
        }
      }


} // end of class
