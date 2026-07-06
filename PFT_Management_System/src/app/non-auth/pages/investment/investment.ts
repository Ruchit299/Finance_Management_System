import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { InvestmentService } from '../../services/investment.service';
import { CategoryService } from '../../services/category.service';
import { ConfirmationService } from '../../../shared/services/confirmation';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';

@Component({
  selector: 'app-investment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MatFormFieldModule, MatInputModule, MatDatepickerModule],
  providers: [provideNativeDateAdapter()],
  templateUrl: './investment.html',
})
export class InvestmentComponent implements OnInit {
  investments: any[] = [];
  categories: any[] = [];
  investmentForm: FormGroup;

  // States
  showFormModal = false;
  isEditing = false;
  selectedId: number | null = null;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  isLoading = false;

  today = new Date().toISOString().split('T')[0];

  constructor(
    private fb: FormBuilder,
    private investmentService: InvestmentService,
    private categoryService: CategoryService,
    private confirmationService: ConfirmationService
  ) {
    this.investmentForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      targetAmount: [null, [Validators.required, Validators.min(0.01)]],
      categoryId: [null, [Validators.required]],
      paymentMethod: ['Cash', [Validators.required]],
      startDate: [this.today, [Validators.required]],
      maturityDate: [this.today, [Validators.required]],
      notes: [''],
      status: ['Active', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadInvestments();
  }

  loadCategories(): void {
    this.categoryService.getAll('investment').subscribe({
      next: (res) => {
        this.categories = res.result || [];
        if (!this.isEditing && this.categories.length > 0 && !this.investmentForm.get('categoryId')?.value) {
          this.investmentForm.patchValue({ categoryId: this.categories[0].id });
        }
      },
      error: (err) => console.error('Failed to load investment categories', err)
    });
  }

  loadInvestments(): void {
    this.isLoading = true;
    this.investmentService.getAll().subscribe({
      next: (res) => {
        this.isLoading = false;
        this.investments = res.result || [];
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Failed to load investments';
      }
    });
  }

  formatDateToYYYYMMDD(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  openAddModal(): void {
    this.isEditing = false;
    this.selectedId = null;
    this.investmentForm.reset({
      name: '',
      amount: null,
      targetAmount: null,
      categoryId: this.categories.length > 0 ? this.categories[0].id : null,
      paymentMethod: 'Cash',
      startDate: this.today,
      maturityDate: this.today,
      notes: '',
      status: 'Active'
    });
    this.showFormModal = true;
  }

  openEditModal(item: any): void {
    this.isEditing = true;
    this.selectedId = item.id;
    this.investmentForm.patchValue({
      name: item.name,
      amount: item.amount,
      targetAmount: item.targetAmount,
      categoryId: item.categoryId,
      paymentMethod: item.paymentMethod || 'Cash',
      startDate: item.startDate,
      maturityDate: item.maturityDate,
      notes: item.notes || '',
      status: item.status || 'Active'
    });
    this.showFormModal = true;
  }

  closeModal(): void {
    this.showFormModal = false;
    this.errorMessage = null;
    this.successMessage = null;
  }

  saveInvestment(): void {
    if (this.investmentForm.invalid) {
      this.investmentForm.markAllAsTouched();
      return;
    }

    const formVal = this.investmentForm.value;
    const start = new Date(formVal.startDate);
    const end = new Date(formVal.maturityDate);
    if (end < start) {
      this.errorMessage = 'Maturity date cannot be before start date';
      return;
    }

    const payload = {
      ...formVal,
      startDate: this.formatDateToYYYYMMDD(formVal.startDate),
      maturityDate: this.formatDateToYYYYMMDD(formVal.maturityDate)
    };

    this.errorMessage = null;
    this.successMessage = null;

    if (this.isEditing && this.selectedId) {
      this.investmentService.update(this.selectedId, payload).subscribe({
        next: () => {
          this.successMessage = 'Investment plan updated successfully';
          this.loadInvestments();
          setTimeout(() => this.closeModal(), 1500);
        },
        error: (err) => {
          this.errorMessage = err.error?.error || err.error?.message || 'Failed to update investment';
        }
      });
    } else {
      this.investmentService.create(payload).subscribe({
        next: () => {
          this.successMessage = 'Investment plan created successfully';
          this.loadInvestments();
          setTimeout(() => this.closeModal(), 1500);
        },
        error: (err) => {
          this.errorMessage = err.error?.error || err.error?.message || 'Failed to create investment';
        }
      });
    }
  }

  async deleteInvestment(id: number): Promise<void> {
    const confirmed = await this.confirmationService.confirm('Are you sure you want to delete this investment plan?');
    if (confirmed) {
      this.investmentService.delete(id).subscribe({
        next: () => {
          this.loadInvestments();
        },
        error: (err) => {
          this.confirmationService.alert(err.error?.message || 'Failed to delete investment plan', 'Error');
        }
      });
    }
  }

  async recordManualContribution(item: any): Promise<void> {
    const confirmed = await this.confirmationService.confirm(
      `Do you want to log a monthly contribution payment of ₹${item.amount} via ${item.paymentMethod || 'Cash'} for the plan "${item.name}"?`,
      'Log Contribution Payment',
      'Confirm Payment'
    );

    if (confirmed) {
      this.isLoading = true;
      this.errorMessage = null;
      this.successMessage = null;
      
      this.investmentService.recordContribution(item.id, {
        amount: item.amount,
        paymentMethod: item.paymentMethod || 'Cash',
        date: this.formatDateToYYYYMMDD(new Date())
      }).subscribe({
        next: () => {
          this.isLoading = false;
          this.successMessage = 'Monthly contribution payment logged successfully under Transactions!';
          this.loadInvestments();
          setTimeout(() => this.successMessage = null, 4000);
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.message || 'Failed to log contribution payment';
          setTimeout(() => this.errorMessage = null, 4000);
        }
      });
    }
  }
}
