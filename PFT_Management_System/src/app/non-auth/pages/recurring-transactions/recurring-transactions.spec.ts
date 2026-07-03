import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecurringTransactionsComponent } from './recurring-transactions';

describe('RecurringTransactions', () => {
  let component: RecurringTransactionsComponent;
  let fixture: ComponentFixture<RecurringTransactionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecurringTransactionsComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(RecurringTransactionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
