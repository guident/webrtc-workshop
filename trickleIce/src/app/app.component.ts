import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GTwvPeerConnectionMediaNegotiator } from './services/g-two-way-video-peer-connection-media-negotiator';
import { GPCSHandler } from './services/g-pcs-handler';
import { AuthService } from './services/auth/auth.service';
import { CraigService } from './craig.service';

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
    this.craigService.RegisterButton1Click();
  }

  onClickEngageButton() {
    this.craigService.EngageButton1Click();
  }

}
