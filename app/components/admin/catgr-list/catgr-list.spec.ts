import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CatgrList } from './catgr-list';

describe('CatgrList', () => {
  let component: CatgrList;
  let fixture: ComponentFixture<CatgrList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CatgrList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CatgrList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
