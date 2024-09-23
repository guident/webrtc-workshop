import { Injectable } from '@angular/core';
import { endpoint } from './services/endpoint';
import { GuidentVtuPeerConnectionMediaNegotiator } from './services/guident-vtu-peer-connection-media-negotiator';
import { CraigAuthenticateService } from './services/craig.authenticate.service';

@Injectable({
  providedIn: 'root'
})
export class GuidentVehicleEndpointService extends endpoint {


  private vehicle31ConnectionId: string = "";

  constructor(private authService: CraigAuthenticateService) { 
    super("VEHICLE", "", "", new GuidentVtuPeerConnectionMediaNegotiator());
    this.myep.setOfferVideoPayloadTypeManipulations(98, 98, 98, 99, 100, 101);
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
    if ( msg.endpointId == 31 ) {
      this.vehicle31ConnectionId = msg.conectionId;
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



  getVehicle31ConnectionId(): string {
    console.log("the vehicle connectionID is: <%s>", this.vehicle31ConnectionId);
    return this.vehicle31ConnectionId;
  }
}
