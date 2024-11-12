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

  }

  ngOnInit() {
    console.log("HELLO HELLO HELLO!!!!!");
    let pcnm = new GTwvPeerConnectionMediaNegotiator();
    let gpcs = new GPCSHandler(this.authService, this.authService.getUserEmailAddress(), this.authService.getAuthorizationToken(), pcnm, 1, 2);
  }

}
