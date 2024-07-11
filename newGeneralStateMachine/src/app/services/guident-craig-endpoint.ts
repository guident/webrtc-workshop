import { endpoint } from "./endpoint";
import { GuidentPeerConnectionMediaNegotiator } from "./guident-peer-connection-media-negotiator";


export class GuidentCraigEndpoint extends endpoint {

  private vehicle14ConnectionId: string = "";

  constructor(uname: string, token: string, pcnm: GuidentPeerConnectionMediaNegotiator) {
    super("CRAIG", uname, token, pcnm);
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
    if ( msg.endpointId == 14 ) {
      this.vehicle14ConnectionId = msg.conectionId;
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

  getVehicle14ConnectionId(): string {
    return this.vehicle14ConnectionId;
  } 

}
