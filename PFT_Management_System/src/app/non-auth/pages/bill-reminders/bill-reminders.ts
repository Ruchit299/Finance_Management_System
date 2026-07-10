import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { BillRemindersService } from '../../services/bill-reminders.service';
import { CategoryService } from '../../services/category.service';
import { ConfirmationService } from '../../../shared/services/confirmation';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';

@Component({
  selector: 'app-bill-reminders',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MatFormFieldModule, MatInputModule, MatDatepickerModule],
  providers: [provideNativeDateAdapter()],
  templateUrl: './bill-reminders.html',
})
export class BillRemindersComponent implements OnInit {
  bills: any[] = [];
  billForm: FormGroup;

  showModal = false;
  isEditing = false;
  selectedId: number | null = null;
  isLoading = false;
  isSaving = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  categories: any[] = [];
  today = new Date().toISOString().split('T')[0];

  get overdueCount(): number {
    return this.bills.filter((b) => b.alertLevel === 'overdue' && !b.isPaid).length;
  }

  get dueSoonCount(): number {
    return this.bills.filter(
      (b) => ['critical', 'warning', 'soon'].includes(b.alertLevel) && !b.isPaid
    ).length;
  }

  constructor(
    private fb: FormBuilder,
    private service: BillRemindersService,
    private confirmationService: ConfirmationService,
    private categoryService: CategoryService
  ) {
    this.billForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      dueDate: ['', [Validators.required]],
      categoryId: [null, [Validators.required]],
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
        if (!this.isEditing && this.categories.length > 0 && !this.billForm.get('categoryId')?.value) {
          this.billForm.patchValue({ categoryId: this.categories[0].id });
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
        this.bills = res.result || [];
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Failed to load bill reminders';
      },
    });
  }

  openAddModal(): void {
    this.isEditing = false;
    this.selectedId = null;
    this.billForm.reset({ categoryId: this.categories.length > 0 ? this.categories[0].id : null });
    this.errorMessage = null;
    this.successMessage = null;
    this.showModal = true;
  }

  openEditModal(bill: any): void {
    this.isEditing = true;
    this.selectedId = bill.id;
    this.billForm.patchValue({
      name: bill.name,
      amount: bill.amount,
      dueDate: bill.dueDate,
      categoryId: bill.categoryId,
      notes: bill.notes,
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

  save(): void {
    if (this.billForm.invalid || this.isSaving) {
      if (this.billForm.invalid) this.billForm.markAllAsTouched();
      return;
    }
    this.isSaving = true;
    const payload = this.billForm.value;

    if (this.isEditing && this.selectedId) {
      this.service.update(this.selectedId, payload).subscribe({
        next: () => {
          this.successMessage = 'Bill reminder updated!';
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
          this.successMessage = 'Bill reminder created!';
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

  togglePaid(id: number): void {
    this.service.togglePaid(id).subscribe({
      next: () => this.load(),
      error: (err) => this.confirmationService.alert(err.error?.message || 'Failed to update', 'Error'),
    });
  }

  async delete(id: number): Promise<void> {
    const confirmed = await this.confirmationService.confirm('Delete this bill reminder?');
    if (confirmed) {
      this.service.delete(id).subscribe({
        next: () => this.load(),
        error: (err) => this.confirmationService.alert(err.error?.message || 'Failed to delete', 'Error'),
      });
    }
  }

  getAlertClass(alertLevel: string, isPaid: boolean): string {
    if (isPaid) return 'border-success';
    const map: { [key: string]: string } = {
      overdue: 'border-danger',
      critical: 'border-danger',
      warning: 'border-warning',
      soon: 'border-info',
      ok: 'border-secondary',
    };
    return map[alertLevel] || 'border-secondary';
  }

  getAlertBadge(alertLevel: string, isPaid: boolean): { text: string; cls: string } {
    if (isPaid) return { text: '✅ Paid', cls: 'bg-success' };
    const map: { [key: string]: { text: string; cls: string } } = {
      overdue: { text: '🔴 Overdue', cls: 'bg-danger' },
      critical: { text: '🔴 Due Tomorrow', cls: 'bg-danger' },
      warning: { text: '🟠 Due in 3 days', cls: 'bg-warning text-dark' },
      soon: { text: '🟡 Due in 7 days', cls: 'bg-warning text-dark' },
      ok: { text: '🟢 Upcoming', cls: 'bg-secondary' },
    };
    return map[alertLevel] || { text: 'Upcoming', cls: 'bg-secondary' };
  }

  getDaysLabel(daysLeft: number, isPaid: boolean): string {
    if (isPaid) return 'Paid';
    if (daysLeft < 0) return `${Math.abs(daysLeft)} days overdue`;
    if (daysLeft === 0) return 'Due today!';
    return `Due in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`;
  }
}
