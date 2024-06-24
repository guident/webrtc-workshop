import { TestBed } from '@angular/core/testing';

import { User3Service } from './user3.service';

describe('User3Service', () => {
  let service: User3Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(User3Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
