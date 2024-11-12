import { Observable, Subject } from "rxjs";
import { endpoint } from "./endpoint";
import { GuidentLogger } from "./guident-logger";
import { GTwvPeerConnectionMediaNegotiator } from "./g-two-way-video-peer-connection-media-negotiator";
import { AuthService } from "./auth/auth.service";

/**
 * This class is a handler for the PCS endpoint. It is responsible for handling the state machine and the media negotiation for the endpoint.
 * It also provides a set of functions that can be used to interact with the PCS component.
 */   


export class GPCSHandler extends endpoint {

  //Variables to display and emit the state of the state machine
  private stateChangeEmitter$: Subject<string> = new Subject();
  private callInProgress$: Subject<boolean> = new Subject();
  private pamModifiers$: Subject<string> = new Subject();
  //Variables that store information about the PCS connection
  private connectionId: string = "";
  private associatedVehicleId: number = -1;
  private engageLauncherTimeout: any;

  constructor(public authService: AuthService, uname: string, token: string, pcnm: GTwvPeerConnectionMediaNegotiator, connectionId: number, associatedVehicleId: number) {
    super("PCS", authService.getUserEmailAddress(), authService.getAuthorizationToken(), pcnm, "parco");
    this.connectionId = `${connectionId}`;
    this.associatedVehicleId = associatedVehicleId;
    this.setOfferVideoPayloadTypeManipulations(98, 98, 98, 99, 100, 101);
  }

  override onConnecting() {
    GuidentLogger.logDebug("GPCSHandler","::onConnecting(): OK!.");
  }

  override onConnectionSuccessful() {
    GuidentLogger.logDebug("GPCSHandler","::onConnectionSuccessful(): OK.");
  }

  override onConnectionFailed(err: string) {
    GuidentLogger.logDebug("GPCSHandler","::onConnectionFailed(): ok!, called with err: " + err);
  }

  override onDisconnected(reason: string) {
    GuidentLogger.logDebug("GPCSHandler","::onDisconnected(): ok!, called with reason: " + reason);
    this.destroy();
  }

  override onRegistrationFailed() {
    GuidentLogger.logDebug("GPCSHandler","::onRegistrationFailed(): ok!.");
  }

  override onRegistrationSuccessful() {
    GuidentLogger.logDebug("GPCSHandler","::onRegistrationSuccessful(): ok!.");
    this.engageLauncherTimeout = setTimeout(async ()=>{
      await this.getLocalMediaStream();
      this.engage(this.connectionId);
      //Clear the engagement launcher timeout
      clearTimeout(this.engageLauncherTimeout);
      this.engageLauncherTimeout = null;
    }, 200)
  }

  override onEngaging() {
    GuidentLogger.logDebug("GPCSHandler","::onEngaging(): ok!.");
  }

  override onEngagementFailed(err: string) {
    GuidentLogger.logDebug("GPCSHandler","::onEngagementFailed(): ok!, called with err: " + err);
    this.stateChangeEmitter$.next("failed");
    this.destroy();
  }

  override onEngagementSuccessful() {
    GuidentLogger.logDebug("GPCSHandler","::onEngagementSuccessful(): ok!.");
    this.callInProgress$.next(false);
  }

  override onDisengagement(reason: any) {
    GuidentLogger.logDebug("GPCSHandler","::onDisengagement(): ok!, called with reason: " + reason);

    this.destroy();
  }

  override onNotification(msg: any) {
    if(msg.endpointType == "vehicle") return;

    // GuidentLogger.logDebug("GPCSHandler","onNotification(): Got a message!! : \n");
    // GuidentLogger.logObject("GPCSHandler", msg)
  }

  override onNewLocation(latlon: any) {
    GuidentLogger.logDebug("GPCSHandler","::onNewLocation(): ok!");
  }

  override async getLocalMediaStream() {
    await this.mypcnm.getLocalMediaStream();
  }

  nullVideoStream(){
    this.mypcnm.nullVideoStreams();
  }

  override startPeerEngagementOffer(peerId: string): boolean {
    return this.mypcnm.startPeerEngagementOffer(peerId);
  }

  override processPeerEngagementAnswer(msg: any) {
    this.mypcnm.processPeerEngagementAnswer(msg);
  }

  override setOfferVideoPayloadTypeManipulations(exclusivePtMid1?: number, exclusivePtMid2?: number, exclusivePtMid3?: number, changePtMid1?: number, changePtMid2?: number, changePtMid3?: number) {
    this.mypcnm.setOfferVideoPayloadTypeManipulations(exclusivePtMid1, exclusivePtMid2, exclusivePtMid3, changePtMid1, changePtMid2, changePtMid3);
  }

  override _resetEngagement(): void {
    this.mypcnm._resetEngagement();
  }

  destroy(){
    this.logDebug("destroy(): Closing the websocket connection and setting the endpoint to null");
    //Clear the insance of the webrtc connection
    this.logDebug("destroy(): Starting to clear all references from the handler");
    clearTimeout(this.mypcnm.errorTimeout);
    if(this.mypcnm.webrtcPeerConnection){
      this.logDebug("destroy(): Closing the webrtc connection and dereferencing it");
      this.mypcnm.webrtcPeerConnection.close();
      this.mypcnm.webrtcPeerConnection.onicecandidate = null;
      this.mypcnm.webrtcPeerConnection.ontrack = null;
      this.mypcnm.webrtcPeerConnection.onconnectionstatechange = null;
      this.mypcnm.webrtcPeerConnection = null;
    }
    this.mypcnm.setEndpoint(null);
    this.mypcnm = null; //Nullify the media negotiator instance so that it can be garbage collected
    //Clear off the timer and nullify the statemachine instance
    this.myep._clearCurrentTimer();
    this.myep.clearStatemachine();
    //Nullify the callbacks attached to the websocket connection
    this.logDebug("destroy(): Starting to clear all websocket callbacks and instance");
    this.myep.websocketConnection.onopen = null;
    this.myep.websocketConnection.onmessage = null;
    this.myep.websocketConnection.onclose = null;
    this.myep.websocketConnection.onerror = null;
    //Close the connection
    this.logDebug("destroy(): Closing and dereferencing the websocket object");
    this.myep.websocketConnection.close();
    //Nullify the connection so that the garbage collector can get rid of it
    this.myep.websocketConnection = null;
    //Nullify the reference to the statemachine
    this.myep = null;
    //Nullify the reference that the media negotiator holds of the endpoint
    this.logDebug("destroy(): Informing PCS component to close itself");
    //Inform the PCS component to close itself
    this.killMeOffEmitter.next(true);
  }

  //Functions which are used to interact with other components and services
  onUserPressedEndCall(){
    this.callInProgress$.next(false);
    this.myep.disengage(this.connectionId);
  }
  /**
   * Will emit en event to the PCS component so that it shrinks
   */
  onTakeover(){
    this.pamModifiers$.next("shrink");
  }
  /**
   * Will emit an event to the PCS component so that it expands
   */
  onRelease(){
    this.pamModifiers$.next("expand");
  }

  //Functions to get Observables for the event emitters
  getCallInProgressAsObservable(): Observable<boolean>{
    return this.callInProgress$.asObservable();
  }

  getPamModifiersAsObservable(): Observable<string>{
    return this.pamModifiers$.asObservable();
  }

  getStateChangeEmitterAsObservable(): Observable<string>{
    return this.stateChangeEmitter$.asObservable();
  }

}
