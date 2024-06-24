import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { User1Service } from './services/user1.service';
import { User2Service } from './services/user2.service';
import { User3Service } from './services/user3.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'workstationNew';

  constructor(
    private user2: User2Service, private user3: User3Service, private user1: User1Service
  ){

  }

  ServiceOnButton1Click(){
    this.user1.SayHelloToService();
  }

  ServiceOnButton2Click(){
    this.user2.SayHelloToService();
  }

  ServiceOnButton3Click(){
    this.user3.SayHelloToService();
  }

  EngageButton1Click(){
    this.user1.engageTheVehicle();
  }

}
