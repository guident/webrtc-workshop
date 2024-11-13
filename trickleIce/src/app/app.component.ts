import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GTwvPeerConnectionMediaNegotiator } from './services/g-two-way-video-peer-connection-media-negotiator';
import { GPCSHandler } from './services/g-pcs-handler';
import { AuthService } from './services/auth/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'whaddaya';

  constructor(
    private authService: AuthService
  ) {
    console.log("this is the constructor");
  }

  ngOnInit() {
    console.log("HELLO HELLO HELLO!!!!!");
    this.authService.startLogin();
    //let pcnm = new GTwvPeerConnectionMediaNegotiator();
    //let gpcs = new GPCSHandler(this.authService, this.authService.getUserEmailAddress(), this.authService.getAuthorizationToken(), pcnm, 1, 2);
  }


  onClickRegisterButton() {
    console.log("Register button is clicked!! Auth data: Email: <<%s>>, UserId: <<%d>>, AuthToken: <<%s>>", this.authService.getUserEmailAddress(), this.authService.getUserId(), this.authService.getAuthorizationToken());
  }

}
