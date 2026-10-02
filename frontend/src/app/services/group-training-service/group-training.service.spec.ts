import { TestBed } from '@angular/core/testing';

import { GroupTrainingService } from './group-training.service';

describe('GroupTrainingService', () => {
  let service: GroupTrainingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GroupTrainingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
