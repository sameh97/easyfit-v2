import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditGroupTrainingComponent } from './edit-group-training.component';

describe('EditGroupTrainingComponent', () => {
  let component: EditGroupTrainingComponent;
  let fixture: ComponentFixture<EditGroupTrainingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditGroupTrainingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditGroupTrainingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
