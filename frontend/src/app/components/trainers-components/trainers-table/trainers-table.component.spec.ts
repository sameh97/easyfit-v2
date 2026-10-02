import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrainersTableComponent } from './trainers-table.component';

describe('TrainersTableComponent', () => {
  let component: TrainersTableComponent;
  let fixture: ComponentFixture<TrainersTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TrainersTableComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TrainersTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
