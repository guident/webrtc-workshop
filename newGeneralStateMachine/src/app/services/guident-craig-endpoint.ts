import { endpoint } from "./endpoint";
import { GuidentPcsPeerConnectionMediaNegotiator } from "./guident-pcs-peer-connection-media-negotiator";


export class GuidentCraigEndpoint extends endpoint {

  private vehicle31ConnectionId: string = "";

  constructor(uname: string, token: string, pcnm: GuidentPcsPeerConnectionMediaNegotiator) {
    super("CRAIG", uname, token, pcnm);
    this.setOfferVideoPayloadTypeManipulations(98, 98, 98, 99, 100, 101);
  }


  override onConnecting() {
    console.log("GuidentCraigEndpoint::onConnecting(): OK!.");
  }

  override onConnectionSuccessful() {
    console.log("GuidentCraigEndpoint::onConnectionSuccessful(): OK.");
  }

  override onConnectionFailed(err: string) {
    console.log("GuidentCraigEndpoint::onConnectionFailed(): ok!, called with err: " + err);
  }

  override onDisconnected(reason: string) {
    console.log("GuidentCraigEndpoint::onDisconnected(): ok!, called with reason: " + reason);
  }

  override onRegistrationFailed() {
    console.log("GuidentCraigEndpoint::onRegistrationFailed(): ok!.");
  }

  override onRegistrationSuccessful() {
    console.log("GuidentCraigEndpoint::onRegistrationSuccessful(): ok!.");
  }

  override onEngaging() {
    console.log("GuidentCraigEndpoint::onEngaging(): ok!.");
  }

  override onEngagementFailed(err: string) {
    console.log("GuidentCraigEndpoint::onEngagementFailed(): ok!, called with err: " + err);
  }

  override onEngagementSuccessful() {
    console.log("GuidentCraigEndpoint::onEngagementSuccessful(): ok!.");
  }

  override onDisengagement(reason: any) {
    console.log("GuidentCraigEndpoint::onDisengagement(): ok!, called with reason: " + reason);
  }

  override onNotification(msg: any) {
    console.log("GuidentCraigEndpointService::onNotification(): Got a message!!");
    // console.log(msg);
    if ( msg.endpointId == 31 ) {
      // console.log("GuidentCraigEndpoint::onNotification(): msg.endpointId is >>", msg.endpointId); // AA: remove
      this.vehicle31ConnectionId = msg.connectionId;
    }
  }

  override onNewLocation(latlon: any) {
    console.log("GuidentCraigEndpoint::onNewLocation(): ok!");
  }

  override onDataChannelMessage(messageEvent: MessageEvent) {
    console.log("GuidentCraigEndpoint::onDataChannelMessage(): ok!");
  }

  override onDataChannelOpen(messageEvent: Event) {
    console.log("GuidentCraigEndpoint::onDataChannelOpen(): ok!");
  }

  override onDataChannelClose(messageEvent: Event) {
    console.log("GuidentCraigEndpoint::onDataChannelClose(): ok!");
  }

  override onDataChannelError(messageEvent: Event) {
    console.log("GuidentCraigEndpoint::onDataChannelError(): ok!");
  }

  override async getLocalMediaStream() {
    await this.mypcnm.getLocalMediaStream();
  }

  override startPeerEngagementOffer(peerId: string): void {
    this.mypcnm.startPeerEngagementOffer(peerId);
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



  getVehicle31ConnectionId(): string {
    console.log("GuidentCraigEndpoint::getVehicle31ConnectionId(): the vehicle connectionID is: <%s>", this.vehicle31ConnectionId);
    return this.vehicle31ConnectionId;
  } 

}
