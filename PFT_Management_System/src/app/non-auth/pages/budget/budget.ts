import { Component, OnInit, Injectable } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule, FormControl } from '@angular/forms';
import { BudgetService } from '../../services/budget.service';
import { CategoryService } from '../../services/category.service';
import { ConfirmationService } from '../../../shared/services/confirmation';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter, NativeDateAdapter, DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';

@Injectable()
export class CustomMonthDateAdapter extends NativeDateAdapter {
  override format(date: Date, displayFormat: Object): string {
    if (displayFormat === 'input') {
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${month}/${year}`;
    }
    return super.format(date, displayFormat);
  }
}

export const MY_MONTH_FORMATS = {
  parse: {
    dateInput: { month: 'short', year: 'numeric', day: 'numeric' },
  },
  display: {
    dateInput: 'input',
    monthYearLabel: { year: 'numeric', month: 'short' },
    dateA11yLabel: { year: 'numeric', month: 'long', day: 'numeric' },
    monthYearA11yLabel: { year: 'numeric', month: 'long' },
  },
};

@Component({
  selector: 'app-budget',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MatFormFieldModule, MatInputModule, MatDatepickerModule],
  providers: [
    { provide: DateAdapter, useClass: CustomMonthDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: MY_MONTH_FORMATS }
  ],
  templateUrl: './budget.html',
})
export class BudgetComponent implements OnInit {
  budgets: any[] = [];
  budgetForm: FormGroup;
  selectedMonth: string;
  monthDate = new FormControl(new Date());

  // States
  showFormModal = false;
  isEditing = false;
  selectedBudgetId: number | null = null;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  isLoading = false;

  // Categories list
  categories: any[] = [];

  constructor(
    private fb: FormBuilder,
    private budgetService: BudgetService,
    private confirmationService: ConfirmationService,
    private categoryService: CategoryService
  ) {
    this.selectedMonth = this.getCurrentMonthString();
    this.budgetForm = this.fb.group({
      categoryId: [null, [Validators.required]],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      month: [new Date(), [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadBudgets();
  }

  loadCategories(): void {
    this.categoryService.getAll().subscribe({
      next: (res) => {
        this.categories = res.result || [];
        if (!this.isEditing && this.categories.length > 0 && !this.budgetForm.get('categoryId')?.value) {
          this.budgetForm.patchValue({ categoryId: this.categories[0].id });
        }
      },
      error: (err) => console.error('Failed to load categories', err)
    });
  }

  getCurrentMonthString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  loadBudgets(): void {
    this.isLoading = true;
    const dateVal = this.monthDate.value || new Date();
    const year = dateVal.getFullYear();
    const month = String(dateVal.getMonth() + 1).padStart(2, '0');
    const monthStr = `${year}-${month}`;
    this.selectedMonth = monthStr;

    this.budgetService.getAll(monthStr).subscribe({
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

  chosenYearHandler(normalizedYear: Date) {
    const ctrlValue = this.monthDate.value || new Date();
    ctrlValue.setFullYear(normalizedYear.getFullYear());
    this.monthDate.setValue(ctrlValue);
  }

  chosenMonthHandler(normalizedMonth: Date, datepicker: any) {
    const ctrlValue = this.monthDate.value || new Date();
    ctrlValue.setMonth(normalizedMonth.getMonth());
    this.monthDate.setValue(ctrlValue);
    datepicker.close();
    this.loadBudgets();
  }

  chosenYearHandlerModal(normalizedYear: Date) {
    const monthCtrl = this.budgetForm.get('month');
    const ctrlValue = monthCtrl?.value instanceof Date ? monthCtrl.value : new Date();
    ctrlValue.setFullYear(normalizedYear.getFullYear());
    monthCtrl?.setValue(ctrlValue);
  }

  chosenMonthHandlerModal(normalizedMonth: Date, datepicker: any) {
    const monthCtrl = this.budgetForm.get('month');
    const ctrlValue = monthCtrl?.value instanceof Date ? monthCtrl.value : new Date();
    ctrlValue.setMonth(normalizedMonth.getMonth());
    monthCtrl?.setValue(ctrlValue);
    datepicker.close();
  }

  openAddModal(): void {
    this.isEditing = false;
    this.selectedBudgetId = null;
    this.budgetForm.reset({
      categoryId: this.categories.length > 0 ? this.categories[0].id : null,
      amount: null,
      month: this.monthDate.value || new Date()
    });
    this.showFormModal = true;
  }

  openEditModal(budget: any): void {
    this.isEditing = true;
    this.selectedBudgetId = budget.id;
    const [year, month] = budget.month.split('-').map(Number);
    const dateVal = new Date(year, month - 1, 1);
    this.budgetForm.patchValue({
      categoryId: budget.categoryId,
      amount: budget.amount,
      month: dateVal
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

    const formVals = this.budgetForm.value;
    const dateVal = formVals.month instanceof Date ? formVals.month : new Date(formVals.month);
    const year = dateVal.getFullYear();
    const month = String(dateVal.getMonth() + 1).padStart(2, '0');
    const monthStr = `${year}-${month}`;

    const payload = {
      ...formVals,
      month: monthStr
    };
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

  async deleteBudget(id: number): Promise<void> {
    const confirmed = await this.confirmationService.confirm('Are you sure you want to delete this budget?');
    if (confirmed) {
      this.budgetService.delete(id).subscribe({
        next: () => {
          this.loadBudgets();
        },
        error: (err) => {
          this.confirmationService.alert(err.error?.message || 'Failed to delete budget', 'Error');
        }
      });
    }
  }
}
