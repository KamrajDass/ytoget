import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PopularCategories } from './popular-categories';

describe('PopularCategories', () => {
  let component: PopularCategories;
  let fixture: ComponentFixture<PopularCategories>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PopularCategories]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PopularCategories);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
