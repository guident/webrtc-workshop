import { GuidentPeerConnectionMediaNegotiator } from "./guident-peer-connection-media-negotiator";



export class GuidentVtuPeerConnectionMediaNegotiator extends GuidentPeerConnectionMediaNegotiator {

    constructor() {
        super("VTU");
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

    override _startPeerEngagementOffer (){
        console.log("GuidentVtuPeerConnectionMediaNegotiator::_startPeerEngagementOffer(): OK!")
    }
}