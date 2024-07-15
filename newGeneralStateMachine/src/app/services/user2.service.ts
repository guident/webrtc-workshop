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
    this.user2Var.myep.setIceServer(
      [{
        urls: [ "stun:us-turn5.xirsys.com" ]
      }, {
          username: "_DYVz1xUZvXJHIlhLB1ucpO50HEc98R9fOMH4xm13sTFd-3lhmM5Wxjee4ulyvLrAAAAAGRZMGpndWlkZW50",
          credential: "41d94e58-edc5-11ed-8e3f-0242ac140004",
          urls: [
              "turn:us-turn5.xirsys.com:80?transport=udp",
              "turn:us-turn5.xirsys.com:3478?transport=udp",
              "turn:us-turn5.xirsys.com:80?transport=tcp",
              "turn:us-turn5.xirsys.com:3478?transport=tcp",
              "turns:us-turn5.xirsys.com:443?transport=tcp",
              "turns:us-turn5.xirsys.com:5349?transport=tcp"
        ]
      }],

    );
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

  async engageTheVehicle() {
    this.user2Var.setRemoteVideoId(0, "user2Video0");
    this.user2Var.setRemoteVideoId(1, "user2Video1");
    this.user2Var.setRemoteVideoId(2, "user2Video2");
    if ( this.user2Var.getVehicle14ConnectionId() == "" ) return;
    await this.user2Var.myep.getLocalAudioStream();
    this.user2Var.engage(this.user2Var.getVehicle14ConnectionId());
  }

  getInstance(): GuidentCraigEndpoint{
    return this.user2Var;
  }
}
