import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SavingsGoalsComponent } from './savings-goals';

describe('SavingsGoals', () => {
  let component: SavingsGoalsComponent;
  let fixture: ComponentFixture<SavingsGoalsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SavingsGoalsComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(SavingsGoalsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
