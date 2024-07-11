import { Injectable } from '@angular/core';
import { GuidentCraigEndpoint } from './guident-craig-endpoint';
import { GuidentPcsPeerConnectionMediaNegotiator } from './guident-pcs-peer-connection-media-negotiator';
import { CraigAuthenticateService } from './craig.authenticate.service';

@Injectable({
  providedIn: 'root'
})
export class User2Service {

 
  user2Var: any = null;

  constructor(private authService: CraigAuthenticateService) {
    
  }

  
  SayHelloToService(){  

    var pcnm = new GuidentPcsPeerConnectionMediaNegotiator();
    console.log("user2 access token is: <<%s>>", this.authService.getAuthAccessToken());
    this.user2Var = new GuidentCraigEndpoint(this.authService.getAuthUserEmail(), this.authService.getAuthAccessToken(), pcnm);
    
    //setTimeout(() => this.onTwoSecondTimeout(), 50);
    console.log('Hello, welcome your service, user2, your endpoint type is <<%s>>', this.user2Var.getEndpointType());
    this.user2Var.start();
  }

  /*
  onTwoSecondTimeout() {
    console.log('Hello, welcome your service, user2, your endpoint type is <<%s>>', this.user2Var.getEndpointType());
    this.user2Var.start();
  }
    */

  engageTheVehicle(): void {
    if ( this.user2Var.getVehicle14ConnectionId() == "" ) return;
    this.user2Var.engage(this.user2Var.getVehicle14ConnectionId());
  }

}
