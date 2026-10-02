import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddCatalogComponent } from './add-catalog.component';

describe('AddCatalogComponent', () => {
  let component: AddCatalogComponent;
  let fixture: ComponentFixture<AddCatalogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddCatalogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddCatalogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
