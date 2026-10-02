import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MembersChartComponent } from './members-chart.component';

describe('MembersChartComponent', () => {
  let component: MembersChartComponent;
  let fixture: ComponentFixture<MembersChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MembersChartComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MembersChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
