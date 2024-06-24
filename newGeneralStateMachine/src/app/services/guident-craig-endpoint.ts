import { endpoint } from "./endpoint";


export class GuidentCraigEndpoint extends endpoint {

  constructor() { 
    super("CRAIG");
  }


  override onConnecting() {
    console.log("GuidentCraigEndpoint::onConnecting(): not implemented.");
  }

  override onConnectionSuccessful() {
    console.log("GuidentCraigEndpoint::onConnectionSuccessful(): not implemented.");
  }

  override onConnectionFailed(err: string) {
    console.log("GuidentCraigEndpoint::onConnectionFailed(): not implemented, called with err: " + err);
  }

  override onDisconnected(reason: string) {
    console.log("GuidentCraigEndpoint::onDisconnected(): not implemented, called with reason: " + reason);
  }

  override onRegistrationFailed() {
    console.log("GuidentCraigEndpoint::onRegistrationFailed(): not implemented.");
  }

  override onRegistrationSuccessful() {
    console.log("GuidentCraigEndpoint::onRegistrationSuccessful(): not implemented.");
  }

  override onEngaging() {
    console.log("GuidentCraigEndpoint::onEngaging(): not implemented.");
  }

  override onEngagementFailed(err: string) {
    console.log("GuidentCraigEndpoint::onEngagementFailed(): not implemented, called with err: " + err);
  }

  override onEngagementSuccessful() {
    console.log("GuidentCraigEndpoint::onEngagementSuccessful(): not implemented.");
  }

  override onDisengagement(reason: any) {
    console.log("GuidentCraigEndpoint::onDisengagement(): not implemented, called with reason: " + reason);
  }

  override onNotification(msg: any) {
    console.log(`GuidentCraigEndpoint::onNotification(): Got a message!! : <<${msg}>>`, msg);
  }

  override onNewLocation(latlon: any) {
    console.log("GuidentCraigEndpoint::onNewLocation(): not implemented");
  }

  override onDataChannelMessage(messageEvent: MessageEvent) {
    console.log("GuidentCraigEndpoint::onDataChannelMessage(): not implemented");
  }

  override onDataChannelOpen(messageEvent: Event) {
    console.log("GuidentCraigEndpoint::onDataChannelOpen(): not implemented");
  }

  override onDataChannelClose(messageEvent: Event) {
    console.log("GuidentCraigEndpoint::onDataChannelClose(): not implemented");
  }

  override onDataChannelError(messageEvent: Event) {
    console.log("GuidentCraigEndpoint::onDataChannelError(): not implemented");
  }

}
