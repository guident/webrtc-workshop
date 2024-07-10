import { TestBed } from '@angular/core/testing';

import { CraigAuthenticateService } from './craig.authenticate.service';

describe('CraigAuthenticateService', () => {
  let service: CraigAuthenticateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CraigAuthenticateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
