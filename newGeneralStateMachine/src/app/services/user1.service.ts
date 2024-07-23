import { Injectable } from '@angular/core';
import { WebsocketConnectionStateMachine } from './new-locator-api';
import { GuidentVehicleEndpointService } from '../guident-vehicle-endpoint.service';
import { CraigAuthenticateService } from './craig.authenticate.service';
import { GuidentPcsPeerConnectionMediaNegotiator } from './guident-pcs-peer-connection-media-negotiator';
import { GuidentCraigEndpoint } from './guident-craig-endpoint';

@Injectable({
  providedIn: 'root'
})
export class User1Service {   

  constructor(private gves: GuidentVehicleEndpointService, private authService: CraigAuthenticateService) {
      // gves.myep.getLocalAudioStream();
      gves.getLocalMediaStream();
  }

  SayHelloToService(){      
    //setTimeout(() => this.onTwoSecondTimeout(), 50);
    console.log('Hello, welcome your service, user1, your endpoint type is <<%s>>', this.gves.getEndpointType());
    this.gves.setCredentials(this.authService.getAuthUserEmail(), this.authService.getAuthAccessToken());
    this.gves.start();
  }


  engageTheVehicle(): void {
    console.log("User1Service::engageTheVehicle(): Engaging user 1: ", this.gves.getVehicle14ConnectionId());
    // this.gves.engage(this.gves.getVehicle14ConnectionId()); //delete, this is for testing
    if ( this.gves.getVehicle14ConnectionId() == "" ) return;
    this.gves.setRemoteVideoId(0, "user1Video0");
    this.gves.setRemoteVideoId(1, "user1Video1");
    this.gves.setRemoteVideoId(2, "user1Video2");
    // this.gves.myep.setOfferVideoPayloadTypeManipulations(98, 98, 98, 99, 100, 101); // AA: should this be in the media negotiator as well?
    this.gves.setOfferVideoPayloadTypeManipulations(98, 98, 98, 99, 100, 101);
    this.gves.engage(this.gves.getVehicle14ConnectionId());
  }

  getInstance(): GuidentVehicleEndpointService {
    return this.gves;
  }
}
