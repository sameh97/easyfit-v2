import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddScheduledJobPageComponent } from './add-scheduled-job-page.component';

describe('AddScheduledJobPageComponent', () => {
  let component: AddScheduledJobPageComponent;
  let fixture: ComponentFixture<AddScheduledJobPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddScheduledJobPageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddScheduledJobPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
