import { TestBed } from '@angular/core/testing';

import { User2Service } from './user2.service';

describe('User2Service', () => {
  let service: User2Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(User2Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
