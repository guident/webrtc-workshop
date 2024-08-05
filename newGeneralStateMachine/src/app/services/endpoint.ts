import { GuidentPeerConnectionMediaNegotiator } from "./guident-peer-connection-media-negotiator";
import { GuidentVtuPeerConnectionMediaNegotiator } from "./guident-vtu-peer-connection-media-negotiator";
import { WebsocketConnectionStateMachine } from "./new-locator-api";



export class endpoint {

    myep: any = null;
    protected mypcnm: GuidentPeerConnectionMediaNegotiator;
    private endpointType: string = "";
    private bindingsHaveBeenSet: boolean = false;

    constructor(t: string, uname: string, token: string, pcnm: GuidentPeerConnectionMediaNegotiator) {
        this.endpointType = t;

        this.myep = new WebsocketConnectionStateMachine("harald", 
            "whaddaya", 
            "wss://guident.bluepepper.us:8445", // 8443
            uname, 
            token);

            
        this.mypcnm = pcnm;

        this.mypcnm.setEndpoint(this.myep); // do I need to do this?

        // this.myep.stateMachine = this.mypcnm.stateMachine;
        // this.mypcnm.stateMachine = this.myep.stateMachine;
        // add all other necessary variables from the endpoint to the pcnm
        this.mypcnm.connectionId = this.myep.connectionId;
        this.mypcnm.endpointId = this.myep.endpointId;
        this.mypcnm.endpointType = this.myep.endpointType;
        this.mypcnm.username = this.myep.username;
        this.mypcnm.password = this.myep.password;
        this.mypcnm.authUsername = this.myep.authUsername;
        this.mypcnm.authToken = this.myep.authToken;
        this.mypcnm.localMessageSequence = this.myep.localMessageSequence;
        // this.mypcnm.websocketConnection = this.myep.websocketConnection;


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
        this.myep.startPeerEngagementOffer = this.mypcnm.startPeerEngagementOffer.bind(this.mypcnm);
        this.myep.processPeerEngagementAnswer = this.mypcnm.processPeerEngagementAnswer.bind(this.mypcnm);
        this.myep._resetEngagement = this.mypcnm._resetEngagement.bind(this.mypcnm);

        this.mypcnm._sendMessage = this.myep._sendMessage.bind(this.myep);


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

    setLocalVideoId(id: string) {
        this.mypcnm.setLocalVideoId(id);
    }

    setRemoteVideoId(cameraIndex: number, videoTagId: string) {
        // this.myep.setRemoteVideoId(cameraIndex, videoTagId);
        this.mypcnm.setRemoteVideoId(cameraIndex, videoTagId); // AA: should media negotiator do this?
    }

    getLocalMediaStream(): void {
        console.log("endpoint::getLocalMediaStream(): not implemented.");
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
        console.log("endpoint::onNotification(): not implemented.");
    }
    

    onNewLocation(latlon: any) {
        console.log("endpoint::onNewLocation(): not implemented.");
    }

    onDataChannelMessage(messageEvent: MessageEvent) {
        console.log("endpoint::onDataChannelMessage(): not implemented.");
    }

    onDataChannelOpen(messageEvent: Event) {
        console.log("endpoint::onDataChannelOpen(): not implemented.");
    }

    onDataChannelClose(messageEvent: Event) {
        console.log("endpoint::onDataChannelClose(): not implemented.");
    }

    onDataChannelError(messageEvent: Event) {
        console.log("endpoint::onDataChannelError(): not implemented.");
    }

    startPeerEngagementOffer(peerId: string) {
        console.log("endpoint::startPeerEngagementOffer(): not implemented.");
    }

    processPeerEngagementAnswer(msg: any) {
        console.log("endpoint::processPeerEngagementAnswer(): not implemented.");
    }

    setOfferVideoPayloadTypeManipulations(exclusivePtMid1?: number, exclusivePtMid2?: number, exclusivePtMid3?: number, changePtMid1?: number, changePtMid2?: number, changePtMid3?: number) {
        console.log("endpoint::setOfferVideoPayloadTypeManipulations(): not implemented");
    }

    _resetEngagement() {
        console.log("endpoint::_resetEngagement(): not implemented.");
    }
    
}
