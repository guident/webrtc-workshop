import { GuidentPeerConnectionMediaNegotiator } from "./guident-peer-connection-media-negotiator";
import { GuidentRmccEndpoint } from "./new-locator-api";



export class endpoint {

    myep: any = null;
    protected mypcnm: GuidentPeerConnectionMediaNegotiator;
    private endpointType: string = "";
    private bindingsHaveBeenSet: boolean = false; 

    constructor(t: string, uname: string, token: string, pcnm: GuidentPeerConnectionMediaNegotiator) {

        this.endpointType = t;

        this.myep = new GuidentRmccEndpoint("harald", 
            "whaddaya", 
            "wss://guident.bluepepper.us:8445", 
            [{'urls': "stun:guident.bluepepper.us:3478" }], 
            null, 
            uname, 
            token);

        this.mypcnm = pcnm;
    }

    getEndpointType(): string {
        return this.endpointType;
    }

    setCredentials(uname: string, token: string) {
        console.log("endpoint::setCredentials() Setting credentials for username: <<%s>>.", uname);
        this.myep.setCredentials(uname, token);
    }

    setBindings() : void {

        if ( this.bindingsHaveBeenSet) return;

        this.myep.onConnecting = this.onConnecting.bind(this);
        this.myep.onConnectionSuccessful = this.onConnectionSuccessful.bind(this);
        this.myep.onConnectionFailed = this.onConnectionFailed.bind(this);
        this.myep.onDisconnected = this.onDisconnected.bind(this);
        this.myep.onRegistrationFailed = this.onRegistrationFailed.bind(this);
        this.myep.onRegistrationSuccessful = this.onRegistrationSuccessful.bind(this);
        this.myep.onEngaging = this.onEngaging.bind(this);
        this.myep.onEngagementFailed = this.onEngagementFailed.bind(this);
        this.myep.onEngagementSuccessful = this.onEngagementSuccessful.bind(this);
        this.myep.onDisengagement = this.onDisengagement.bind(this);
        this.myep.onNotification = this.onNotification.bind(this);
        this.myep.onNewLocation = this.onNewLocation.bind(this);
        //this.myep.notifyNetworkService = this.notifyNetworkService.bind(this);
        this.bindingsHaveBeenSet = true;
    }


    start(): void {
        console.log("endpoint::start(): The media negotiator is type: <<%s>>", this.mypcnm.getMediaNegotiatorType());
        this.setBindings();    // this kinda sux but i think it will be ok
        this.myep.start();
    }


    engage(connId: string): void {
        this.myep.engage(connId);
    }


    // callbacks

    onConnecting() {
        console.log("endpoint::onConnecting(): not implemented.");
    }
    
    onConnectionSuccessful() {
        console.log("endpoint::onConnectionSuccessful(): not implemented.");
    }
    
    onConnectionFailed(err: string) {
        console.log("endpoint::onConnectionFailed(): not implemented, called with err: " + err);
    }

    onDisconnected(reason: string) {
        console.log("endpoint::onDisconnected(): not implemented, called with reason: " + reason);
    }

    onRegistrationFailed() {
        console.log("endpoint::onRegistrationFailed(): not implemented.");
    }

    onRegistrationSuccessful() {
        console.log("endpoint::onRegistrationSuccessful(): not implemented.");
    }

    onEngaging() {
        console.log("endpoint::onEngaging(): not implemented.");
    }

    onEngagementFailed(err: string) {
        console.log("endpoint::onEngagementFailed(): not implemented, called with err: " + err);
    }

    onEngagementSuccessful() {
        console.log("endpoint::onEngagementSuccessful(): not implemented.");
    }

    onDisengagement(reason: any) {
        console.log("endpoint::onDisengagement(): not implemented, called with reason: " + reason);
    }

    
    onNotification(msg: any) {
        console.log("endpoint::onNotification(): not implemented");
    }
    

    onNewLocation(latlon: any) {
        console.log("endpoint::onNewLocation(): not implemented");
    }

    onDataChannelMessage(messageEvent: MessageEvent) {
        console.log("endpoint::onDataChannelMessage(): not implemented");
    }

    onDataChannelOpen(messageEvent: Event) {
        console.log("endpoint::onDataChannelOpen(): not implemented");
    }

    onDataChannelClose(messageEvent: Event) {
        console.log("endpoint::onDataChannelClose(): not implemented");
    }

    onDataChannelError(messageEvent: Event) {
        console.log("endpoint::onDataChannelError(): not implemented");
    }



    
}
