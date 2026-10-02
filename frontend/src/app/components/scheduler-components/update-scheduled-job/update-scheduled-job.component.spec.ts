import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateScheduledJobComponent } from './update-scheduled-job.component';

describe('UpdateScheduledJobComponent', () => {
  let component: UpdateScheduledJobComponent;
  let fixture: ComponentFixture<UpdateScheduledJobComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UpdateScheduledJobComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UpdateScheduledJobComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
