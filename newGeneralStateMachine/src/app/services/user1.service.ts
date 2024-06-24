import { Injectable } from '@angular/core';
import { GuidentRmccEndpoint } from './new-locator-api';
import { GuidentVehicleEndpointService } from '../guident-vehicle-endpoint.service';

@Injectable({
  providedIn: 'root'
})
export class User1Service {

    

  constructor(private gves: GuidentVehicleEndpointService) {

    //this.gves.setBindings();

    /*
    this.user1Var = new GuidentRmccEndpoint(
      "harald", 
      "whaddaya", 
      "wss://guident.bluepepper.us:8445", 
      [{'urls': "stun:guident.bluepepper.us:3478" }], 
      null, 
      "dvega@guident.co", 
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoiOCIsImZpcnN0X25hbWUiOiJEYXZpZCIsImxhc3RfbmFtZSI6IlZlZ2EgU290b2xvbmdvIiwiYXZhdGFyIjpudWxsLCJjcmVhdGVkX2F0IjoiMjAyMy0wMi0yM1QxNzoxNzo1NC44MDBaIn0sImdlbmVyYXRlZF9hdCI6IjIwMjQtMDYtMThUMjA6MTA6MjcuMjU3WiIsImlhdCI6MTcxODc0MTQyNywiZXhwIjoxNzE4NzQ4NjI3fQ.7K-SSpzRShFvbgtOv47Xy-214JMwo2hKB4FSEA69KR4"
    );
    */
  }

  SayHelloToService(){      
    console.log('Hello, welcome your service, user1')
    this.gves.start();
  }


  engageTheVehicle(): void {
    if ( this.gves.getVehicle31ConnectionId() == "" ) return;
    this.gves.engage(this.gves.getVehicle31ConnectionId());
  }

}
