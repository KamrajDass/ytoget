import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LastestPro } from './lastest-pro';

describe('LastestPro', () => {
  let component: LastestPro;
  let fixture: ComponentFixture<LastestPro>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LastestPro]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LastestPro);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
