import { GuidentPeerConnectionMediaNegotiator } from "./guident-peer-connection-media-negotiator";



export class GuidentPcsPeerConnectionMediaNegotiator extends GuidentPeerConnectionMediaNegotiator {

    constructor() {
        super("PCS");
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

}