import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { TransactionService } from '../../services/transaction.service';
import { CategoryService } from '../../services/category.service';
import { ConfirmationService } from '../../../shared/services/confirmation';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import * as XLSX from 'xlsx';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-transaction',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MatFormFieldModule, MatInputModule, MatDatepickerModule],
  providers: [provideNativeDateAdapter()],
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
  isFiltersExpanded = false;
  isSaving = false;

  // Pagination
  currentPage = 1;
  pageSize = 10;
  Math = Math;

  get paginatedTransactions(): any[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.transactions.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.transactions.length / this.pageSize));
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  toggleFilters(): void {
    this.isFiltersExpanded = !this.isFiltersExpanded;
  }

  // Import States
  isImporting = false;
  importProgress = 0;
  importSummary = '';

  // Categories list
  categories: any[] = [];

  // Filter properties
  filters = {
    startDate: '',
    endDate: '',
    categoryId: '',
    type: '',
    paymentMethod: '',
    minAmount: null,
    maxAmount: null
  };

  constructor(
    private fb: FormBuilder,
    private transactionService: TransactionService,
    private confirmationService: ConfirmationService,
    private categoryService: CategoryService
  ) {
    this.transactionForm = this.fb.group({
      amount: [null, [Validators.required, Validators.min(0.01)]],
      type: ['expense', [Validators.required]],
      categoryId: [null, [Validators.required]],
      paymentMethod: ['Cash', [Validators.required]],
      date: [this.getTodayDateString(), [Validators.required]],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadTransactions();
  }

  loadCategories(): void {
    this.categoryService.getAll().subscribe({
      next: (res) => {
        this.categories = res.result || [];
        if (!this.isEditing && this.categories.length > 0 && !this.transactionForm.get('categoryId')?.value) {
          this.transactionForm.patchValue({ categoryId: this.categories[0].id });
        }
      },
      error: (err) => console.error('Failed to load categories', err)
    });
  }

  getTodayDateString(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
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

  loadTransactions(): void {
    this.isLoading = true;

    const formattedFilters = {
      ...this.filters,
      startDate: this.formatDateToYYYYMMDD(this.filters.startDate),
      endDate: this.formatDateToYYYYMMDD(this.filters.endDate)
    };

    this.transactionService.getAll(formattedFilters).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.transactions = res.result || [];
        this.currentPage = 1;
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
      categoryId: '',
      type: '',
      paymentMethod: '',
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
      categoryId: this.categories.length > 0 ? this.categories[0].id : null,
      paymentMethod: 'Cash',
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
      categoryId: tx.categoryId,
      paymentMethod: tx.paymentMethod || 'Cash',
      date: tx.date,
      notes: tx.notes || ''
    });
    this.showFormModal = true;
  }

  closeModal(): void {
    this.showFormModal = false;
    this.errorMessage = null;
    this.successMessage = null;
    this.isSaving = false;
  }

  saveTransaction(): void {
    if (this.transactionForm.invalid || this.isSaving) {
      if (this.transactionForm.invalid) this.transactionForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
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
          this.isSaving = false;
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
          this.isSaving = false;
          this.errorMessage = err.error?.error || err.error?.message || 'Failed to create transaction';
        }
      });
    }
  }

  exportToExcel(): void {
    if (this.transactions.length === 0) return;

    // 1. Prepare data rows
    const data = this.transactions.map(tx => ({
      'Date': tx.date || '',
      'Category': tx.Category?.name || '-',
      'Notes / Description': tx.notes || '-',
      'Amount (₹)': Number(tx.amount),
      'Type': tx.type === 'income' ? 'Income' : 'Expense',
      'Payment Method': tx.paymentMethod || 'Cash'
    }));

    // 2. Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);

    // 3. Create workbook and append worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');

    // 4. Set column widths automatically
    const max_len = [15, 20, 30, 15, 12, 18]; // default column widths
    worksheet['!cols'] = max_len.map(w => ({ wch: w }));

    // 5. Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    this.saveAsExcelFile(excelBuffer, `transactions_${this.getTodayDateString()}`);
  }

  private saveAsExcelFile(buffer: any, fileName: string): void {
    const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    const blob = new Blob([buffer], { type: EXCEL_TYPE });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${fileName}.xlsx`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async onFileChange(event: any): Promise<void> {
    const file = event.target.files[0];
    if (!file) return;

    this.isImporting = true;
    this.importProgress = 0;
    this.importSummary = 'Reading Excel file...';
    this.errorMessage = null;
    this.successMessage = null;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      const rows = XLSX.utils.sheet_to_json(worksheet) as any[];
      if (rows.length === 0) {
        throw new Error('The selected Excel file is empty.');
      }

      let importedCount = 0;
      let createdCategoriesCount = 0;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        
        const dateStr = this.getRowValue(row, ['date', 'Date']);
        const categoryName = this.getRowValue(row, ['category', 'Category']);
        const notes = this.getRowValue(row, ['notes', 'description', 'notes / description', 'Notes / Description', 'Notes']);
        const amountVal = this.getRowValue(row, ['amount', 'amount (₹)', 'Amount', 'Amount (₹)']);
        const typeStr = this.getRowValue(row, ['type', 'Type']);
        const paymentMethodVal = this.getRowValue(row, ['paymentMethod', 'payment method', 'Payment Method', 'payment_method']);

        if (amountVal === undefined || !typeStr || !categoryName) {
          continue;
        }

        // 1. Resolve Category ID (create category if not exists)
        let categoryId = await this.resolveCategoryId(categoryName);
        if (!categoryId) {
          createdCategoriesCount++;
          // Create category on backend
          await lastValueFrom(this.categoryService.create(String(categoryName).trim()));
          // Reload categories list
          const categoriesRes = await lastValueFrom(this.categoryService.getAll());
          this.categories = categoriesRes.result || [];
          categoryId = await this.resolveCategoryId(categoryName);
        }

        // 2. Format Date
        let transactionDate = this.formatDateToYYYYMMDD(new Date());
        if (dateStr) {
          const parsedDate = new Date(dateStr);
          if (!isNaN(parsedDate.getTime())) {
            transactionDate = this.formatDateToYYYYMMDD(parsedDate);
          }
        }

        // Parse Payment Method options
        let pMethod = 'Cash';
        if (paymentMethodVal && ['Cash', 'UPI', 'Online'].includes(String(paymentMethodVal).trim())) {
          pMethod = String(paymentMethodVal).trim();
        }

        // 3. Create Transaction
        const payload = {
          amount: parseFloat(amountVal),
          type: String(typeStr).trim().toLowerCase() === 'income' ? 'income' : 'expense',
          categoryId: categoryId,
          paymentMethod: pMethod,
          date: transactionDate,
          notes: notes ? String(notes).trim() : ''
        };

        await lastValueFrom(this.transactionService.create(payload));
        importedCount++;

        // Update progress
        this.importProgress = Math.round(((i + 1) / rows.length) * 100);
        this.importSummary = `Importing row ${i + 1} of ${rows.length}...`;
      }

      this.successMessage = `Successfully imported ${importedCount} transactions.`;
      if (createdCategoriesCount > 0) {
        this.successMessage += ` Created ${createdCategoriesCount} new categories.`;
      }
      this.loadTransactions();
      this.loadCategories();
    } catch (err: any) {
      console.error(err);
      this.errorMessage = err.message || 'Failed to import Excel file. Ensure it has the correct columns.';
    } finally {
      this.isImporting = false;
      this.importProgress = 0;
      this.importSummary = '';
      event.target.value = ''; // clear file input
    }
  }

  private getRowValue(row: any, keys: string[]): any {
    for (const key of keys) {
      if (row[key] !== undefined) return row[key];
      for (const rowKey of Object.keys(row)) {
        if (rowKey.toLowerCase().trim() === key.toLowerCase().trim()) {
          return row[rowKey];
        }
      }
    }
    return undefined;
  }

  private async resolveCategoryId(categoryName: string): Promise<number | null> {
    const trimmedName = String(categoryName).trim().toLowerCase();
    const matched = this.categories.find(c => c.name.trim().toLowerCase() === trimmedName);
    return matched ? matched.id : null;
  }



  async deleteTransaction(id: number): Promise<void> {
    const confirmed = await this.confirmationService.confirm('Are you sure you want to delete this transaction?');
    if (confirmed) {
      this.transactionService.delete(id).subscribe({
        next: () => {
          this.loadTransactions();
        },
        error: (err) => {
          this.confirmationService.alert(err.error?.message || 'Failed to delete transaction', 'Error');
        }
      });
    }
  }
}
