import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { signal } from '@angular/core';

import { Home } from './home';
import { Data } from '../../services/data';

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;

  const dataStub = {
    homeData: signal({ navLinks: ['Link A', 'Link B', 'Link C'] }),
    fetchHome: () => {}
  } as unknown as Data;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home, HttpClientTestingModule],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    TestBed.overrideProvider(Data, { useValue: dataStub });

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render links', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const items = compiled.querySelectorAll('ul li');
    expect(items.length).toBe(3);
    expect(items[0].textContent).toContain('Link A');
    expect(items[1].textContent).toContain('Link B');
    expect(items[2].textContent).toContain('Link C');
  });
});
