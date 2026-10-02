import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MachineNotificationsComponent } from './machine-notifications.component';

describe('MachineNotificationsComponent', () => {
  let component: MachineNotificationsComponent;
  let fixture: ComponentFixture<MachineNotificationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MachineNotificationsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MachineNotificationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
