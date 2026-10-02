import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddGroupTrainingComponent } from './add-group-training.component';

describe('AddGroupTrainingComponent', () => {
  let component: AddGroupTrainingComponent;
  let fixture: ComponentFixture<AddGroupTrainingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddGroupTrainingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddGroupTrainingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
