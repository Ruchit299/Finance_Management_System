import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RecurringTransactionsService } from '../../services/recurring-transactions.service';
import { CategoryService } from '../../services/category.service';
import { ConfirmationService } from '../../../shared/services/confirmation';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';

@Component({
  selector: 'app-recurring-transactions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MatFormFieldModule, MatInputModule, MatDatepickerModule],
  providers: [provideNativeDateAdapter()],
  templateUrl: './recurring-transactions.html',
})
export class RecurringTransactionsComponent implements OnInit {
  items: any[] = [];
  recurringForm: FormGroup;

  showModal = false;
  isEditing = false;
  selectedId: number | null = null;
  isLoading = false;
  isSaving = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  categories: any[] = [];
  frequencies = ['Daily', 'Weekly', 'Monthly', 'Yearly'];
  today = new Date().toISOString().split('T')[0];

  constructor(
    private fb: FormBuilder,
    private service: RecurringTransactionsService,
    private confirmationService: ConfirmationService,
    private categoryService: CategoryService
  ) {
    this.recurringForm = this.fb.group({
      amount: [null, [Validators.required, Validators.min(0.01)]],
      type: ['expense', [Validators.required]],
      categoryId: [null, [Validators.required]],
      paymentMethod: ['Cash', [Validators.required]],
      frequency: ['Monthly', [Validators.required]],
      startDate: [this.today, [Validators.required]],
      notes: [''],
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.load();
  }

  loadCategories(): void {
    this.categoryService.getAll().subscribe({
      next: (res) => {
        this.categories = res.result || [];
        if (!this.isEditing && this.categories.length > 0 && !this.recurringForm.get('categoryId')?.value) {
          this.recurringForm.patchValue({ categoryId: this.categories[0].id });
        }
      },
      error: (err) => console.error('Failed to load categories', err)
    });
  }

  load(): void {
    this.isLoading = true;
    this.service.getAll().subscribe({
      next: (res) => {
        this.isLoading = false;
        this.items = res.result || [];
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Failed to load';
      },
    });
  }

  openAddModal(): void {
    this.isEditing = false;
    this.selectedId = null;
    this.recurringForm.reset({
      type: 'expense',
      categoryId: this.categories.length > 0 ? this.categories[0].id : null,
      paymentMethod: 'Cash',
      frequency: 'Monthly',
      startDate: this.today
    });
    this.errorMessage = null;
    this.successMessage = null;
    this.showModal = true;
  }

  openEditModal(item: any): void {
    this.isEditing = true;
    this.selectedId = item.id;
    this.recurringForm.patchValue({
      amount: item.amount,
      type: item.type,
      categoryId: item.categoryId,
      paymentMethod: item.paymentMethod || 'Cash',
      frequency: item.frequency,
      startDate: item.startDate,
      notes: item.notes,
    });
    this.errorMessage = null;
    this.successMessage = null;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.errorMessage = null;
    this.successMessage = null;
    this.isSaving = false;
  }

  formatDateToYYYYMMDD(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    const month = '' + (d.getMonth() + 1);
    const day = '' + d.getDate();
    const year = d.getFullYear();

    return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
  }

  save(): void {
    if (this.recurringForm.invalid || this.isSaving) {
      if (this.recurringForm.invalid) this.recurringForm.markAllAsTouched();
      return;
    }
    this.isSaving = true;
    const formVal = this.recurringForm.value;
    const payload = {
      ...formVal,
      startDate: this.formatDateToYYYYMMDD(formVal.startDate)
    };

    if (this.isEditing && this.selectedId) {
      this.service.update(this.selectedId, payload).subscribe({
        next: () => {
          this.successMessage = 'Updated successfully!';
          this.load();
          setTimeout(() => this.closeModal(), 1500);
        },
        error: (err) => {
          this.isSaving = false;
          this.errorMessage = err.error?.error || err.error?.message || 'Failed to update';
        },
      });
    } else {
      this.service.create(payload).subscribe({
        next: () => {
          this.successMessage = 'Recurring transaction created!';
          this.load();
          setTimeout(() => this.closeModal(), 1500);
        },
        error: (err) => {
          this.isSaving = false;
          this.errorMessage = err.error?.error || err.error?.message || 'Failed to create';
        },
      });
    }
  }

  toggle(id: number): void {
    this.service.toggle(id).subscribe({
      next: () => this.load(),
      error: (err) => this.confirmationService.alert(err.error?.message || 'Failed to toggle', 'Error'),
    });
  }

  async delete(id: number): Promise<void> {
    const confirmed = await this.confirmationService.confirm('Delete this recurring transaction?');
    if (confirmed) {
      this.service.delete(id).subscribe({
        next: () => this.load(),
        error: (err) => this.confirmationService.alert(err.error?.message || 'Failed to delete', 'Error'),
      });
    }
  }

  getFrequencyIcon(freq: string): string {
    const map: { [key: string]: string } = {
      Daily: 'bi-calendar-day',
      Weekly: 'bi-calendar-week',
      Monthly: 'bi-calendar-month',
      Yearly: 'bi-calendar2-check',
    };
    return map[freq] || 'bi-calendar';
  }
}
