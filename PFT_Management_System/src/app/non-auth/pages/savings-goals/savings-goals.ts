import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SavingsGoalsService } from '../../services/savings-goals.service';
import { ConfirmationService } from '../../../shared/services/confirmation';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';

@Component({
  selector: 'app-savings-goals',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MatFormFieldModule, MatInputModule, MatDatepickerModule],
  providers: [provideNativeDateAdapter()],
  templateUrl: './savings-goals.html',
})
export class SavingsGoalsComponent implements OnInit {
  goals: any[] = [];
  goalForm: FormGroup;
  depositForm: FormGroup;

  showGoalModal = false;
  showDepositModal = false;
  isEditing = false;
  selectedGoalId: number | null = null;
  isLoading = false;
  isSaving = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  today = new Date().toISOString().split('T')[0];

  constructor(
    private fb: FormBuilder,
    private savingsService: SavingsGoalsService,
    private confirmationService: ConfirmationService
  ) {
    this.goalForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: [''],
      targetAmount: [null, [Validators.required, Validators.min(0.01)]],
      targetDate: ['', [Validators.required]],
    });

    this.depositForm = this.fb.group({
      amount: [null, [Validators.required, Validators.min(0.01)]],
    });
  }

  ngOnInit(): void {
    this.loadGoals();
  }

  loadGoals(): void {
    this.isLoading = true;
    this.savingsService.getAll().subscribe({
      next: (res) => {
        this.isLoading = false;
        this.goals = res.result || [];
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Failed to load savings goals';
      },
    });
  }

  openAddModal(): void {
    this.isEditing = false;
    this.selectedGoalId = null;
    this.goalForm.reset({
      name: '',
      description: '',
      targetAmount: null,
      targetDate: this.today,
    });
    this.showGoalModal = true;
  }

  openEditModal(goal: any): void {
    this.isEditing = true;
    this.selectedGoalId = goal.id;
    this.goalForm.patchValue({
      name: goal.name,
      description: goal.description || '',
      targetAmount: goal.targetAmount,
      targetDate: goal.targetDate,
    });
    this.showGoalModal = true;
  }

  openDepositModal(goal: any): void {
    this.selectedGoalId = goal.id;
    this.depositForm.reset({ amount: null });
    this.showDepositModal = true;
  }

  closeModals(): void {
    this.showGoalModal = false;
    this.showDepositModal = false;
    this.errorMessage = null;
    this.successMessage = null;
    this.isSaving = false;
  }

  saveGoal(): void {
    if (this.goalForm.invalid || this.isSaving) {
      if (this.goalForm.invalid) this.goalForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    const payload = this.goalForm.value;
    this.errorMessage = null;
    this.successMessage = null;

    if (this.isEditing && this.selectedGoalId) {
      this.savingsService.update(this.selectedGoalId, payload).subscribe({
        next: () => {
          this.successMessage = 'Savings goal updated!';
          this.loadGoals();
          setTimeout(() => this.closeModals(), 1500);
        },
        error: (err) => {
          this.isSaving = false;
          this.errorMessage = err.error?.error || err.error?.message || 'Failed to update';
        },
      });
    } else {
      this.savingsService.create(payload).subscribe({
        next: () => {
          this.successMessage = 'Savings goal created!';
          this.loadGoals();
          setTimeout(() => this.closeModals(), 1500);
        },
        error: (err) => {
          this.isSaving = false;
          this.errorMessage = err.error?.error || err.error?.message || 'Failed to create';
        },
      });
    }
  }

  addDeposit(): void {
    if (this.depositForm.invalid || !this.selectedGoalId || this.isSaving) {
      if (this.depositForm.invalid) this.depositForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    const { amount } = this.depositForm.value;
    this.savingsService.addSavings(this.selectedGoalId, amount).subscribe({
      next: () => {
        this.successMessage = `₹${amount} added successfully!`;
        this.loadGoals();
        setTimeout(() => this.closeModals(), 1500);
      },
      error: (err) => {
        this.isSaving = false;
        this.errorMessage = err.error?.error || err.error?.message || 'Failed to add savings';
      },
    });
  }

  async deleteGoal(id: number): Promise<void> {
    const confirmed = await this.confirmationService.confirm('Are you sure you want to delete this savings goal?');
    if (confirmed) {
      this.savingsService.delete(id).subscribe({
        next: () => this.loadGoals(),
        error: (err) => this.confirmationService.alert(err.error?.message || 'Failed to delete', 'Error'),
      });
    }
  }

  getProgressColor(percent: number): string {
    if (percent >= 100) return '#22c55e';
    if (percent >= 75) return '#3b82f6';
    if (percent >= 50) return '#f59e0b';
    return '#ef4444';
  }

  getDaysLabel(days: number): string {
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return 'Due today!';
    return `${days} days left`;
  }
}
