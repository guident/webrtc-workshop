import { Injectable } from '@angular/core';
import { GuidentCraigEndpoint } from './guident-craig-endpoint';

@Injectable({
  providedIn: 'root'
})
export class User2Service {
  SayHelloToService(){      
    console.log('Hello, welcome your service, user2, your endpoint type is <<%s>>', this.user2Var.getEndpointType());
    this.user2Var.start();
  }
  user2Var: GuidentCraigEndpoint;

  constructor() {
    this.user2Var = new GuidentCraigEndpoint();
  }
}
