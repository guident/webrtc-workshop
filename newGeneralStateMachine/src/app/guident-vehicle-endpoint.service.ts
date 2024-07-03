import { Injectable } from '@angular/core';
import { endpoint } from './services/endpoint';
import { GuidentVtuPeerConnectionMediaNegotiator } from './services/guident-vtu-peer-connection-media-negotiator';

@Injectable({
  providedIn: 'root'
})
export class GuidentVehicleEndpointService extends endpoint {


  private vehicle31ConnectionId: string = "";
  
  constructor() { 
    super("VEHICLE", new GuidentVtuPeerConnectionMediaNegotiator());
  }


  override onConnecting() {
    console.log("GuidentVehicleEndpointService::onConnecting(): not implemented.");
  }

  override onConnectionSuccessful() {
    console.log("GuidentVehicleEndpointService::onConnectionSuccessful(): not implemented.");
  }

  override onConnectionFailed(err: string) {
    console.log("GuidentVehicleEndpointService::onConnectionFailed(): not implemented, called with err: " + err);
  }

  override onDisconnected(reason: string) {
    console.log("GuidentVehicleEndpointService::onDisconnected(): not implemented, called with reason: " + reason);
  }

  override onRegistrationFailed() {
    console.log("GuidentVehicleEndpointService::onRegistrationFailed(): not implemented.");
  }

  override onRegistrationSuccessful() {
    console.log("GuidentVehicleEndpointService::onRegistrationSuccessful(): not implemented.");
  }

  override onEngaging() {
    console.log("GuidentVehicleEndpointService::onEngaging(): not implemented.");
  }

  override onEngagementFailed(err: string) {
    console.log("GuidentVehicleEndpointService::onEngagementFailed(): not implemented, called with err: " + err);
  }

  override onEngagementSuccessful() {
    console.log("GuidentVehicleEndpointService::onEngagementSuccessful(): not implemented.");
  }

  override onDisengagement(reason: any) {
    console.log("GuidentVehicleEndpointService::onDisengagement(): not implemented, called with reason: " + reason);
  }

  override onNotification(msg: any) {
    console.log("GuidentVehicleEndpointService::onNotification(): Got a message!!");
    if ( msg.endpointId == 31 ) {
      this.vehicle31ConnectionId = msg.conectionId;
    }
  }

  override onNewLocation(latlon: any) {
    console.log("GuidentVehicleEndpointService::onNewLocation(): not implemented");
  }

  override onDataChannelMessage(messageEvent: MessageEvent) {
    console.log("GuidentVehicleEndpointService::onDataChannelMessage(): not implemented");
  }

  override onDataChannelOpen(messageEvent: Event) {
    console.log("GuidentVehicleEndpointService::onDataChannelOpen(): not implemented");
  }

  override onDataChannelClose(messageEvent: Event) {
    console.log("GuidentVehicleEndpointService::onDataChannelClose(): not implemented");
  }

  override onDataChannelError(messageEvent: Event) {
    console.log("GuidentVehicleEndpointService::onDataChannelError(): not implemented");
  }



    getVehicle31ConnectionId(): string {
       return this.vehicle31ConnectionId;
    }
}
