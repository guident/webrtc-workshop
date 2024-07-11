import { Injectable } from '@angular/core';
import { GuidentRmccEndpoint } from './new-locator-api';
import { GuidentVehicleEndpointService } from '../guident-vehicle-endpoint.service';
import { CraigAuthenticateService } from './craig.authenticate.service';
import { GuidentPcsPeerConnectionMediaNegotiator } from './guident-pcs-peer-connection-media-negotiator';
import { GuidentCraigEndpoint } from './guident-craig-endpoint';

@Injectable({
  providedIn: 'root'
})
export class User1Service {

  constructor(private gves: GuidentVehicleEndpointService, private authService: CraigAuthenticateService) {

  }

  SayHelloToService(){      
    //setTimeout(() => this.onTwoSecondTimeout(), 50);
    console.log('Hello, welcome your service, user1, your endpoint type is <<%s>>', this.gves.getEndpointType());
    this.gves.setCredentials(this.authService.getAuthUserEmail(), this.authService.getAuthAccessToken());
    this.gves.start();
  }


  engageTheVehicle(): void {
    if ( this.gves.getVehicle31ConnectionId() == "" ) return;
    this.gves.engage(this.gves.getVehicle31ConnectionId());
  }

}
