import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisplayTrainingsComponent } from './display-trainings.component';

describe('DisplayTrainingsComponent', () => {
  let component: DisplayTrainingsComponent;
  let fixture: ComponentFixture<DisplayTrainingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DisplayTrainingsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DisplayTrainingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
