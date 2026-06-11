import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { BudgetService } from '../../services/budget.service';

@Component({
  selector: 'app-budget',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './budget.html',
})
export class BudgetComponent implements OnInit {
  budgets: any[] = [];
  budgetForm: FormGroup;
  selectedMonth: string;

  // States
  showFormModal = false;
  isEditing = false;
  selectedBudgetId: number | null = null;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  isLoading = false;

  // Static Categories list
  categories = ['Food', 'Transport', 'Rent', 'Shopping', 'Entertainment', 'Salary', 'Investment'];

  constructor(
    private fb: FormBuilder,
    private budgetService: BudgetService
  ) {
    this.selectedMonth = this.getCurrentMonthString();
    this.budgetForm = this.fb.group({
      category: ['Food', [Validators.required]],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      month: [this.selectedMonth, [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadBudgets();
  }

  getCurrentMonthString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  loadBudgets(): void {
    this.isLoading = true;
    this.budgetService.getAll(this.selectedMonth).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.budgets = res.result || [];
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Failed to load budgets';
      }
    });
  }

  onMonthChange(): void {
    this.loadBudgets();
  }

  openAddModal(): void {
    this.isEditing = false;
    this.selectedBudgetId = null;
    this.budgetForm.reset({
      category: 'Food',
      amount: null,
      month: this.selectedMonth
    });
    this.showFormModal = true;
  }

  openEditModal(budget: any): void {
    this.isEditing = true;
    this.selectedBudgetId = budget.id;
    this.budgetForm.patchValue({
      category: budget.category,
      amount: budget.amount,
      month: budget.month
    });
    this.showFormModal = true;
  }

  closeModal(): void {
    this.showFormModal = false;
    this.errorMessage = null;
    this.successMessage = null;
  }

  saveBudget(): void {
    if (this.budgetForm.invalid) {
      this.budgetForm.markAllAsTouched();
      return;
    }

    const payload = this.budgetForm.value;
    this.errorMessage = null;
    this.successMessage = null;

    if (this.isEditing && this.selectedBudgetId) {
      // For updates, we only send the amount
      this.budgetService.update(this.selectedBudgetId, { amount: payload.amount }).subscribe({
        next: () => {
          this.successMessage = 'Budget limit updated successfully';
          this.loadBudgets();
          setTimeout(() => this.closeModal(), 1500);
        },
        error: (err) => {
          this.errorMessage = err.error?.error || err.error?.message || 'Failed to update budget limit';
        }
      });
    } else {
      this.budgetService.create(payload).subscribe({
        next: () => {
          this.successMessage = 'Budget created successfully';
          this.loadBudgets();
          setTimeout(() => this.closeModal(), 1500);
        },
        error: (err) => {
          this.errorMessage = err.error?.error || err.error?.message || 'Failed to create budget';
        }
      });
    }
  }

  deleteBudget(id: number): void {
    if (confirm('Are you sure you want to delete this budget?')) {
      this.budgetService.delete(id).subscribe({
        next: () => {
          this.loadBudgets();
        },
        error: (err) => {
          alert(err.error?.message || 'Failed to delete budget');
        }
      });
    }
  }
}
