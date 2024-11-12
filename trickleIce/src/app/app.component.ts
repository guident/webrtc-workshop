import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GTwvPeerConnectionMediaNegotiator } from './services/g-two-way-video-peer-connection-media-negotiator';
import { GPCSHandler } from './services/g-pcs-handler';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'whaddaya';

  constructor() {

  }


}
