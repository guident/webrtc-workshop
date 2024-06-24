import { TestBed } from '@angular/core/testing';

import { GuidentVehicleEndpointService } from './guident-vehicle-endpoint.service';

describe('GuidentVehicleEndpointService', () => {
  let service: GuidentVehicleEndpointService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GuidentVehicleEndpointService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
