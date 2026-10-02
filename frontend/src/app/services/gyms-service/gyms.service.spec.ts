import { TestBed } from '@angular/core/testing';

import { GymsService } from './gyms.service';

describe('GymsService', () => {
  let service: GymsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GymsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
