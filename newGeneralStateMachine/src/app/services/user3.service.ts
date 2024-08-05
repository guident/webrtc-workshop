import { Injectable } from '@angular/core';
import { WebsocketConnectionStateMachine } from './new-locator-api';
import { GuidentPcsPeerConnectionMediaNegotiator } from './guident-pcs-peer-connection-media-negotiator';
import { CraigAuthenticateService } from './craig.authenticate.service';
import { GuidentCraigEndpoint } from './guident-craig-endpoint';
import { GuidentTwvPeerConnectionMediaNegotiator } from './guident-two-way-video-peer-connection-media-negotiator';

@Injectable({
  providedIn: 'root'
})
export class User3Service {

  // guidentpcs

  // user3Var: WebsocketConnectionStateMachine;
  user3Var: any = null;

  constructor(private authService: CraigAuthenticateService) {
  
  }

  SayHelloToService() {      
    console.log("user3 access token is: <<%s>>", this.authService.getAuthAccessToken());
    var pcnm = new GuidentTwvPeerConnectionMediaNegotiator();
    this.user3Var = new GuidentCraigEndpoint(this.authService.getAuthUserEmail(), this.authService.getAuthAccessToken(), pcnm)
    
    console.log('Hello, welcome your service, user3, your endpoint type is <<%s>>', this.user3Var.getEndpointType())
    this.user3Var.start();
  }

  async engageTheVehicle() {
    this.user3Var.setLocalVideoId("user3LocalVideo");
    this.user3Var.setRemoteVideoId(0, "user3RemoteVideo");
    // this.user3Var.setRemoteVideoId(1, "user3Video1");
    if ( this.user3Var.getVehicle31ConnectionId() == "" ) return;
    await this.user3Var.getLocalMediaStream();
    this.user3Var.setOfferVideoPayloadTypeManipulations(98, 98, 98, 99, 100, 101);
    this.user3Var.engage(this.user3Var.getVehicle31ConnectionId());
  }

  getInstance(): GuidentCraigEndpoint {
    return this.user3Var;
  }
}
