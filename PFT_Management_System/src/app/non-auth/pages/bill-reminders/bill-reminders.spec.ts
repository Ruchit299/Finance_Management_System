import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BillRemindersComponent } from './bill-reminders';

describe('BillReminders', () => {
  let component: BillRemindersComponent;
  let fixture: ComponentFixture<BillRemindersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillRemindersComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(BillRemindersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
