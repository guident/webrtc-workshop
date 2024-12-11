import { Subject } from "rxjs";
import { GPeerConnectionMediaNegotiator } from "./g-peer-connection-media-negotiator";
import { WebsocketConnectionStateMachine } from "./vehicle-locator-api";
import { environment } from "../../../src/environments/environment";
import { GuidentLogger } from "./guident-logger";

export class endpoint extends GuidentLogger{

  myep: any = null;
  protected mypcnm: any;
  private endpointType: string = "";
  private bindingsHaveBeenSet: boolean = false;

  killMeOffEmitter: Subject<boolean> = new Subject();

  constructor(type: string, uname: string, token: string, pcnm: GPeerConnectionMediaNegotiator, endpointType: string) {

    super("endpointClass");

    this.endpointType = type;

    this.myep = new WebsocketConnectionStateMachine(
      environment.username,
      environment.password,
      environment.locatorUrl,
      uname,
      token,
      endpointType
    );
    this.mypcnm = pcnm;

    this.mypcnm.setEndpoint(this);

    this.mypcnm.connectionId = this.myep.connectionId;
    this.mypcnm.endpointId = this.myep.endpointId;
    this.mypcnm.endpointType = this.myep.endpointType;
    this.mypcnm.username = this.myep.username;
    this.mypcnm.password = this.myep.password;
    this.mypcnm.authUsername = this.myep.authUsername;
    this.mypcnm.authToken = this.myep.authToken;
    this.mypcnm.localMessageSequence = this.myep.localMessageSequence;

  }

  getEndpointType(): string {
      return this.endpointType;
  }

  setCredentials(uname: string, token: string) {
      this.logDebug("setCredentials(): Setting credentials for username: <<%s>>.", uname);
      this.myep.setCredentials(uname, token);
  }

  setBindings() : void {

    if ( this.bindingsHaveBeenSet) return;

    this.logDebug("setBindings(): Setting the bindings to the handler callbacks")

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
    // this.myep.startPeerEngagementOffer = this.mypcnm.startPeerEngagementOffer.bind(this.mypcnm);
    this.myep.startPeerEngagementOffer = this.startPeerEngagementOffer.bind(this);
    this.myep._startRenegotiateEngagement = this._startRenegotiateEngagement.bind(this);
    this.myep.onRenegotiationStarted = this.onRenegotiationStarted.bind(this);
    this.myep.processPeerEngagementAnswer = this.mypcnm.processPeerEngagementAnswer.bind(this.mypcnm);
    this.myep._resetEngagement = this.mypcnm._resetEngagement.bind(this.mypcnm);
    this.myep._sendDisengagement = this.mypcnm._sendDisengagement.bind(this.myep)

    this.mypcnm._sendMessage = this.myep._sendMessage.bind(this.myep);

    this.bindingsHaveBeenSet = true;
  }


  start(): void {
    this.logDebug("start(): The media negotiator is type: <<%s>>", this.mypcnm.getMediaNegotiatorType());
    this.setBindings();    // this kinda sux but i think it will be ok
    this.myep.start();
  }

  engage(connId: string): void {
    this.myep.engage(connId);
  }

  setLocalVideoId(id: string) {
    this.mypcnm.setLocalVideoId(id);
  }

  /**
   * Function used to update the remote video ids to be used for the WebRTC streams
   * @param cameraIndex The index of the camera
   * @param videoTagId  The id of the tag
   */
  setRemoteVideoId(cameraIndex: number, videoTagId: string) {
    this.mypcnm.setRemoteVideoId(cameraIndex, videoTagId);
  }

  // Callbacks which will be overridden by the handlers
  getLocalMediaStream(): void {
    this.logDebug("getLocalMediaStream(): not implemented.");
  }



  onConnecting() {
      this.logDebug("onConnecting(): not implemented.");
  }

  onConnectionSuccessful() {
      this.logDebug("onConnectionSuccessful(): not implemented.");
  }

  onConnectionFailed(err: string) {
      this.logDebug("onConnectionFailed(): not implemented, called with err: " + err);
  }

  onDisconnected(reason: string) {
      this.logDebug("onDisconnected(): not implemented, called with reason: " + reason);
  }

  onRegistrationFailed() {
      this.logDebug("onRegistrationFailed(): not implemented.");
  }

  onRegistrationSuccessful() {
      this.logDebug("onRegistrationSuccessful(): not implemented.");
  }

  onEngaging() {
      this.logDebug("onEngaging(): not implemented.");
  }

  onEngagementFailed(err: string) {
      this.logDebug("onEngagementFailed(): not implemented, called with err: " + err);
  }

  onEngagementSuccessful() {
      this.logDebug("onEngagementSuccessful(): not implemented.");
  }

  onDisengagement(reason: any) {
      this.logDebug("onDisengagement(): not implemented, called with reason: " + reason);
  }


  onNotification(msg: any) {
      this.logDebug("onNotification(): not implemented.");
  }


  onNewLocation(latlon: any) {
      this.logDebug("onNewLocation(): not implemented.");
  }

  //The following Data Channel callbacks will be binded to in the VehicleRemoteControlAndStatusChannelMonitor

  onDataChannelMessage(messageEvent: MessageEvent) {
      this.logDebug("onDataChannelMessage(): not implemented.");
  }

  onDataChannelOpen(messageEvent: Event) {
      this.logDebug("onDataChannelOpen(): not implemented.");
  }

  onDataChannelClose(messageEvent: Event) {
      this.logDebug("onDataChannelClose(): not implemented.");
  }

  onDataChannelError(messageEvent: Event) {
      this.logDebug("onDataChannelError(): not implemented.");
  }

  //-------------------------------------------------------------------------------------------------------------

  startPeerEngagementOffer(peerId: string): boolean {
      this.logDebug("startPeerEngagementOffer(): not implemented.");
      return false;
  }

  processPeerEngagementAnswer(msg: any) {
      this.logDebug("processPeerEngagementAnswer(): not implemented.");
  }

  setOfferVideoPayloadTypeManipulations(exclusivePtMid1?: number, exclusivePtMid2?: number, exclusivePtMid3?: number, changePtMid1?: number, changePtMid2?: number, changePtMid3?: number) {
      this.logDebug("setOfferVideoPayloadTypeManipulations(): not implemented");
  }

  _resetEngagement() {
  this.logDebug("_resetEngagement(): not implemented.");
  }

  _sendDisengagement(){
    this.logDebug("_sendDisengagement(): not implemented.");
  }

  getKillMeOffNotifier(){
    return this.killMeOffEmitter.asObservable();
  }


  // NEW! this stuff is for renegotiating a peerconnection


  // public
  renegotiate(audioVideoConfig: number): void {
      this.myep.renegotiate(audioVideoConfig);
      return;
  }


  // private:
  _startRenegotiateEngagement(audioVideoConfig: number) : boolean {
      this.logDebug("_startRenegotiateEngagement(): not implemented.");
      return(false);
  }


  // callback
  onRenegotiationStarted() {
      this.logDebug("onRenegotiationStarted(): not implemented.");
  }


}
