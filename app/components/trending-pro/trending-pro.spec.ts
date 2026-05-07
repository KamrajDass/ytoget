import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrendingPro } from './trending-pro';

describe('TrendingPro', () => {
  let component: TrendingPro;
  let fixture: ComponentFixture<TrendingPro>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrendingPro]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrendingPro);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
