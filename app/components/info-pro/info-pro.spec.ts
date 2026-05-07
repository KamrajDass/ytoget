import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfoPro } from './info-pro';

describe('InfoPro', () => {
  let component: InfoPro;
  let fixture: ComponentFixture<InfoPro>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InfoPro]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InfoPro);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
