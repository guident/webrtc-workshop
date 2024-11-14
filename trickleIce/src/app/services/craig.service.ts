import { Injectable } from '@angular/core';
import { AuthService } from './auth/auth.service';
import { Subject, Subscription } from 'rxjs';
import { GPeerConnectionMediaNegotiator } from './g-peer-connection-media-negotiator';
import { TrickleIceTwoWayVideoEndpoint } from './trickle-ice-two-way-video-endpoint';
import { TrickeIceTwoWayVideoMediaNegotiator } from './trickle-ice-two-way-video-media-negotiator';
import { endpoint } from './endpoint';



@Injectable({
  providedIn: 'root'
})
export class CraigService {
  private myEventSubscription:any;

  public clockTicks = 0;
  public endpointHasBeenStarted = false;
  public engagementStarted = false;
  public vehicleConnectionId = "";
  
  ep: TrickleIceTwoWayVideoEndpoint | undefined;
  
  constructor(public  authService: AuthService) { 
    // setInterval(() => { this.onTimerTick(); }, 2000);
  }


  setEndpoint(myep: TrickleIceTwoWayVideoEndpoint) {
    this.ep = myep;
  }

  RegisterButtonClick(){
    if ( ! this.endpointHasBeenStarted ) {
      if (this.authService.isAuthenticated) {
        this.startWebSocketConnectionEndpoint();
        this.endpointHasBeenStarted = true;
      }
    }
  }

  EngageButtonClick(){
    if ( ! this.engagementStarted ) {
      //this.ep.startEngagement
      // if ( this.clockTicks > 10 ) {
        //if ( this.GTwvPeerConnectionMediaNegotiator.startEngagement() ) {
          ///this.engagementStarted = true;
        //}
      // }
    }
  }



  
  startWebSocketConnectionEndpoint(): void {

  
    this.ep = new TrickleIceTwoWayVideoEndpoint(this.authService.getUserEmailAddress(), this.authService.getAuthorizationToken(), new TrickeIceTwoWayVideoMediaNegotiator(), 33, this);
    this.ep.setRemoteVideoId(0, "videoRectangle");
    this.ep.start();

    /*
    setTimeout(() => {
        if (this.PCShandler) {
          this.PCShandler.startEngagement();
        }
      }, 3500);
      */
    

  }

}
