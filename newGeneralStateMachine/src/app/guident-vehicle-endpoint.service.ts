import { Injectable } from '@angular/core';
import { endpoint } from './services/endpoint';
import { GuidentVtuPeerConnectionMediaNegotiator } from './services/guident-vtu-peer-connection-media-negotiator';
import { CraigAuthenticateService } from './services/craig.authenticate.service';

@Injectable({
  providedIn: 'root'
})
export class GuidentVehicleEndpointService extends endpoint {


  private vehicle14ConnectionId: string = ""; // AA: 14 is MiCa

  constructor(private authService: CraigAuthenticateService) { 
    super("VEHICLE", "", "", new GuidentVtuPeerConnectionMediaNegotiator());
  }

  override onConnecting() {
    console.log("GuidentVehicleEndpointService::onConnecting(): Ok!.");
  }

  override onConnectionSuccessful() {
    console.log("GuidentVehicleEndpointService::onConnectionSuccessful(): Ok!.");
  }

  override onConnectionFailed(err: string) {
    console.log("GuidentVehicleEndpointService::onConnectionFailed(): Ok!, called with err: " + err);
  }

  override onDisconnected(reason: string) {
    console.log("GuidentVehicleEndpointService::onDisconnected(): Ok!, called with reason: " + reason);
  }

  override onRegistrationFailed() {
    console.log("GuidentVehicleEndpointService::onRegistrationFailed(): Ok!.");
  }

  override onRegistrationSuccessful() {
    console.log("GuidentVehicleEndpointService::onRegistrationSuccessful(): Ok!.");
  }

  override onEngaging() {
    console.log("GuidentVehicleEndpointService::onEngaging(): Ok!.");
  }

  override onEngagementFailed(err: string) {
    console.log("GuidentVehicleEndpointService::onEngagementFailed(): Ok!, called with err: " + err);
  }

  override onEngagementSuccessful() {
    console.log("GuidentVehicleEndpointService::onEngagementSuccessful(): Ok!.");
  }

  override onDisengagement(reason: any) {
    console.log("GuidentVehicleEndpointService::onDisengagement(): Ok!, called with reason: " + reason);
  }

  override onNotification(msg: any) {
    console.log("GuidentVehicleEndpointService::onNotification(): Got a message!!");
    if ( msg.endpointId == 14 ) {
      console.log("Connection Id for vehicle 14 is <<%s>>", msg.connectionId);
      this.vehicle14ConnectionId = msg.connectionId;
    }
  }

  override onNewLocation(latlon: any) {
    console.log("GuidentVehicleEndpointService::onNewLocation(): Ok!");
  }

  override onDataChannelMessage(messageEvent: MessageEvent) {
    console.log("GuidentVehicleEndpointService::onDataChannelMessage(): Ok!");
  }

  override onDataChannelOpen(messageEvent: Event) {
    console.log("GuidentVehicleEndpointService::onDataChannelOpen(): Ok!");
  }

  override onDataChannelClose(messageEvent: Event) {
    console.log("GuidentVehicleEndpointService::onDataChannelClose(): Ok!");
  }

  override onDataChannelError(messageEvent: Event) {
    console.log("GuidentVehicleEndpointService::onDataChannelError(): Ok!");
  }

  override getLocalMediaStream(): void {
    this.mypcnm.getLocalMediaStream();
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


  getVehicle14ConnectionId(): string {
      return this.vehicle14ConnectionId;
  }
}
