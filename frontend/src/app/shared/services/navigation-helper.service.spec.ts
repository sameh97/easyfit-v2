import { TestBed } from '@angular/core/testing';

import { NavigationHelperService } from './navigation-helper.service';

describe('NavigationHelperService', () => {
  let service: NavigationHelperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NavigationHelperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
