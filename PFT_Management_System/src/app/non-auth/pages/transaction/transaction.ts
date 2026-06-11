import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { TransactionService } from '../../services/transaction.service';

@Component({
  selector: 'app-transaction',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './transaction.html',
})
export class Transaction implements OnInit {
  transactions: any[] = [];
  transactionForm: FormGroup;
  
  // States
  showFormModal = false;
  isEditing = false;
  selectedTransactionId: number | null = null;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  isLoading = false;

  // Static Categories list
  categories = ['Food', 'Transport', 'Rent', 'Shopping', 'Entertainment', 'Salary', 'Investment'];

  // Filter properties
  filters = {
    startDate: '',
    endDate: '',
    category: '',
    type: '',
    minAmount: null,
    maxAmount: null
  };

  constructor(
    private fb: FormBuilder,
    private transactionService: TransactionService
  ) {
    this.transactionForm = this.fb.group({
      amount: [null, [Validators.required, Validators.min(0.01)]],
      type: ['expense', [Validators.required]],
      category: ['Food', [Validators.required]],
      date: [this.getTodayDateString(), [Validators.required]],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadTransactions();
  }

  getTodayDateString(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  loadTransactions(): void {
    this.isLoading = true;
    this.transactionService.getAll(this.filters).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.transactions = res.result || [];
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Failed to load transactions';
      }
    });
  }

  applyFilters(): void {
    this.loadTransactions();
  }

  resetFilters(): void {
    this.filters = {
      startDate: '',
      endDate: '',
      category: '',
      type: '',
      minAmount: null,
      maxAmount: null
    };
    this.loadTransactions();
  }

  openAddModal(): void {
    this.isEditing = false;
    this.selectedTransactionId = null;
    this.transactionForm.reset({
      amount: null,
      type: 'expense',
      category: 'Food',
      date: this.getTodayDateString(),
      notes: ''
    });
    this.showFormModal = true;
  }

  openEditModal(tx: any): void {
    this.isEditing = true;
    this.selectedTransactionId = tx.id;
    this.transactionForm.patchValue({
      amount: tx.amount,
      type: tx.type,
      category: tx.category,
      date: tx.date,
      notes: tx.notes || ''
    });
    this.showFormModal = true;
  }

  closeModal(): void {
    this.showFormModal = false;
    this.errorMessage = null;
    this.successMessage = null;
  }

  saveTransaction(): void {
    if (this.transactionForm.invalid) {
      this.transactionForm.markAllAsTouched();
      return;
    }

    const payload = this.transactionForm.value;
    this.errorMessage = null;
    this.successMessage = null;

    if (this.isEditing && this.selectedTransactionId) {
      this.transactionService.update(this.selectedTransactionId, payload).subscribe({
        next: () => {
          this.successMessage = 'Transaction updated successfully';
          this.loadTransactions();
          setTimeout(() => this.closeModal(), 1500);
        },
        error: (err) => {
          this.errorMessage = err.error?.error || err.error?.message || 'Failed to update transaction';
        }
      });
    } else {
      this.transactionService.create(payload).subscribe({
        next: () => {
          this.successMessage = 'Transaction created successfully';
          this.loadTransactions();
          setTimeout(() => this.closeModal(), 1500);
        },
        error: (err) => {
          this.errorMessage = err.error?.error || err.error?.message || 'Failed to create transaction';
        }
      });
    }
  }

  deleteTransaction(id: number): void {
    if (confirm('Are you sure you want to delete this transaction?')) {
      this.transactionService.delete(id).subscribe({
        next: () => {
          this.loadTransactions();
        },
        error: (err) => {
          alert(err.error?.message || 'Failed to delete transaction');
        }
      });
    }
  }
}
