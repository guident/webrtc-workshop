import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TrickeIceTwoWayVideoMediaNegotiator } from './services/trickle-ice-two-way-video-media-negotiator';
import { TrickleIceTwoWayVideoEndpoint } from './services/trickle-ice-two-way-video-endpoint';
import { AuthService } from './services/auth/auth.service';
import { CraigService } from './services/craig.service';

@Component({
  selector: 'app-root',
  standalone: true,
  // imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'whaddaya';
  public endpointsHaveBeenStarted = false;
  public engagementStarted = false;

  constructor(
    private authService: AuthService,
    private craigService: CraigService
  ) {
    console.log("this is the constructor");
  }

  ngOnInit() {
    console.log("HELLO HELLO HELLO!!!!!");
    this.authService.startLogin();
  }


  onClickRegisterButton() {
    this.craigService.RegisterButtonClick();
  }

  onClickEngageButton() {
    this.craigService.EngageButtonClick();
    // this.engage(this.peerConnectionId);
  }
  
  onClickRenegotiateButton() {
    this.craigService.RenegotiateButtonClick();
    // this.engage(this.peerConnectionId);
  }

}
