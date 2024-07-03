import { Injectable } from '@angular/core';
import { GuidentRmccEndpoint } from './new-locator-api';
import { GuidentVehicleEndpointService } from '../guident-vehicle-endpoint.service';

@Injectable({
  providedIn: 'root'
})
export class User1Service {

  constructor(private gves: GuidentVehicleEndpointService) {

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
