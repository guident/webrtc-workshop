import { GuidentRmccEndpoint } from "./new-locator-api";
import { endpoint } from "./endpoint";


export class GuidentPeerConnectionMediaNegotiator {

    private pcMediaNegotiatorType: string = "";

    constructor(t: string) {
        this.pcMediaNegotiatorType = t;
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
    
}