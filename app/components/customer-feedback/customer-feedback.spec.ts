import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerFeedback } from './customer-feedback';

describe('CustomerFeedback', () => {
  let component: CustomerFeedback;
  let fixture: ComponentFixture<CustomerFeedback>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerFeedback]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomerFeedback);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
