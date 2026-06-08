import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttendanceHome } from './attendance-home';

describe('AttendanceHome', () => {
  let component: AttendanceHome;
  let fixture: ComponentFixture<AttendanceHome>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AttendanceHome],
    }).compileComponents();

    fixture = TestBed.createComponent(AttendanceHome);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
