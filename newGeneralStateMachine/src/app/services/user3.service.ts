import { Injectable } from '@angular/core';
import { WebsocketConnectionStateMachine } from './new-locator-api';

@Injectable({
  providedIn: 'root'
})
export class User3Service {
  SayHelloToService(){      
    console.log('Hello, welcome your service, user3')
    this.user3Var.start();
  }
  user3Var: WebsocketConnectionStateMachine;

  constructor() {
    this.user3Var = new WebsocketConnectionStateMachine(
      "harald", 
      "whaddaya", 
      "wss://guident.bluepepper.us:8445", 
      "dvega@guident.co", 
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoiOCIsImZpcnN0X25hbWUiOiJEYXZpZCIsImxhc3RfbmFtZSI6IlZlZ2EgU290b2xvbmdvIiwiYXZhdGFyIjpudWxsLCJjcmVhdGVkX2F0IjoiMjAyMy0wMi0yM1QxNzoxNzo1NC44MDBaIn0sImdlbmVyYXRlZF9hdCI6IjIwMjQtMDYtMThUMjA6MTA6MjcuMjU3WiIsImlhdCI6MTcxODc0MTQyNywiZXhwIjoxNzE4NzQ4NjI3fQ.7K-SSpzRShFvbgtOv47Xy-214JMwo2hKB4FSEA69KR4"
    );
  }
}
