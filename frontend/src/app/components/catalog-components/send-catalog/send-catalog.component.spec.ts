import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SendCatalogComponent } from './send-catalog.component';

describe('SendCatalogComponent', () => {
  let component: SendCatalogComponent;
  let fixture: ComponentFixture<SendCatalogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SendCatalogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SendCatalogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
