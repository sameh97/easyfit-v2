import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowSingleTrainingComponent } from './show-single-training.component';

describe('ShowSingleTrainingComponent', () => {
  let component: ShowSingleTrainingComponent;
  let fixture: ComponentFixture<ShowSingleTrainingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ShowSingleTrainingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowSingleTrainingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
