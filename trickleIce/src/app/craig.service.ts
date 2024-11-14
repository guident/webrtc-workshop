import { Injectable } from '@angular/core';
import  { AuthService } from './services/auth/auth.service';
import { Subject, Subscription } from 'rxjs';
import { GPeerConnectionMediaNegotiator } from './services/g-peer-connection-media-negotiator';
import { GPCSHandler } from './services/g-pcs-handler';
import { GTwvPeerConnectionMediaNegotiator } from './services/g-two-way-video-peer-connection-media-negotiator';
import { endpoint } from './services/endpoint';

@Injectable({
  providedIn: 'root'
})
export class CraigService {
  private myEventSubscription:any;

  public clockTicks = 0;
  public endpointsHaveBeenStarted = false;
  public engagementStarted = false;
  
  // protected webrtcPeerConnection: RTCPeerConnection | null = null;
  // webrtcPeerConfiguration: RTCConfiguration = { iceServers: [] };

  mikeVar: any = null;
    PCShandler: GPCSHandler | undefined;
    GTwvPeerConnectionMediaNegotiator: any;

  constructor(public  authService: AuthService) { 
    // setInterval(() => { this.onTimerTick(); }, 2000);
  }

  sendMessage(vehId: any, msg: string){
    console.log("Sending message to vehicle: " + vehId + " message: " + msg);
    // this.externalCamerasFeedEndpoints[vehId].sendMessageOnDataChannel(msg);
  //   this.webrtcPeerConfiguration = {
  //     iceServers: [{'urls': "stun:guident.bluepepper.us:3478" }],
  //     bundlePolicy: 'max-bundle'
  // };
  //   this.webrtcPeerConnection = new RTCPeerConnection(this.webrtcPeerConfiguration);
  //   this.externalCamerasFeedEndpoints[0].remoteControlDataChannel = this.webrtcPeerConnection!.createDataChannel("foo1");
  //   this.externalCamerasFeedEndpoints[0].onopen = () => {
  //     console.log('Data channel is open');
  //     this.externalCamerasFeedEndpoints[0].remoteControlDataChannel.send(msg);
  //   };
    // this.remoteControldataChannel.send(msg);
    // console.log("message data is %s \n", msg);
    // this.externalCamerasFeedEndpoints[0].sendRemoteControlMessage(msg);
  }

  RegisterButton1Click(){
    console.log("Timer has ticked!!");
    if ( ! this.endpointsHaveBeenStarted ) {
      if (this.authService.isAuthenticated) {
        this.startWebSocketConnectionEndpoints();
        this.endpointsHaveBeenStarted = true;
      }
    }
  }

  EngageButton1Click(){
    if ( ! this.engagementStarted) {
      // if ( this.clockTicks > 10 ) {
        if ( this.GTwvPeerConnectionMediaNegotiator.startEngagement() ) {
          this.engagementStarted = true;
        }
      // }
    }
  }


  // onTimerTick() {
    
  //   console.log("Timer has ticked!!");
    
  //   this.clockTicks++;

  //   if ( ! this.endpointsHaveBeenStarted ) {
  //     if (this.authService.isAuthenticated) {
  //       this.startWebSocketConnectionEndpoints();
  //       this.endpointsHaveBeenStarted = true;
  //     }
  //   }

  //   if ( ! this.engagementStarted) {
  //     if ( this.clockTicks > 10 ) {
  //       if ( this.internalCameraFeedEndpoints[0].startEngagement() ) {
  //         this.engagementStarted = true;
  //       }
  //       if ( this.externalCamerasFeedEndpoints[0].startEngagement() ) {
  //         this.engagementStarted = true;
  //       }
  //     }
  //   }
  // }


  
  startWebSocketConnectionEndpoints(): void {

    //this.internalCameraFeedEndpoints[0].setOfferVideoPayloadTypeManipulations(0, ) 
    /*
    for ( var i = 0; i < 3; i++ ) {
      this.internalCameraFeedEndpoints[i] = new InternalCameraEngagementEndpoint(this.authService.getAuthUserEmail(), this.authService.getAuthAccessToken(), i, new InternalCameraMediaNegotiator());
      this.internalCameraFeedEndpoints[i].start();
    }

    for ( var i = 0; i < 3; i++ ) {
      this.externalCamerasFeedEndpoints[i] = new ExternalCamerasEngagementEndpoint(this.authService.getAuthUserEmail(), this.authService.getAuthAccessToken(), i, new ExternalCamerasMediaNegotiator());
      this.externalCamerasFeedEndpoints[i].start();
    }
    */
  
    this.PCShandler = new GPCSHandler(this.authService.getUserEmailAddress(), this.authService.getAuthorizationToken(), new GTwvPeerConnectionMediaNegotiator, 1, 33);
    this.PCShandler.setRemoteVideoId(0, "vehicle1Video0");
    this.PCShandler.start();

    setTimeout(() => {
        if (this.PCShandler) {
          this.PCShandler.startEngagement();
        }
      }, 3500);


    // alert("internal endpoint");

    // this.externalCamerasFeedEndpoints[0] = new ExternalCamerasEngagementEndpoint(this.authService.getAuthUserEmail(), this.authService.getAuthAccessToken(), 35, new ExternalCamerasMediaNegotiator());
    // this.externalCamerasFeedEndpoints[0].setRemoteVideoId(0, "vehicle1Video1");
    // this.externalCamerasFeedEndpoints[0].start();
    // // alert("external endpoint");

    // this.myEventSubscription = this.PCShandler.myEvent0$.subscribe((event:any) => {
    //   setTimeout(() => {
    //     if (this.PCShandler) {
    //       this.PCShandler.startEngagement();
    //     }
    //   }, 150);
    // });

 
    
    // this.myEventSubscription = this.externalCamerasFeedEndpoints[0].myEvent1$.subscribe((event:any) => {
    //   setTimeout(() => {
        
    //     this.externalCamerasFeedEndpoints[0].startEngagement();
    //   }, 150);
    // });

  }

}
