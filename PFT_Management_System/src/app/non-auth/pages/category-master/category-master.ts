import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../services/category.service';
import { ConfirmationService } from '../../../shared/services/confirmation';

@Component({
  selector: 'app-category-master',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './category-master.html',
  styleUrls: ['./category-master.scss']
})
export class CategoryMasterComponent implements OnInit {
  categories: any[] = [];
  newCategoryName: string = '';
  isEditing = false;
  selectedCategoryId: number | null = null;
  isLoading = false;
  isSaving = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  selectedTab: 'transaction' | 'investment' = 'transaction';

  constructor(
    private categoryService: CategoryService,
    private confirmationService: ConfirmationService
  ) { }

  ngOnInit(): void {
    this.loadCategories();
  }

  selectTab(tab: 'transaction' | 'investment'): void {
    if (this.selectedTab === tab) return;
    this.selectedTab = tab;
    this.resetForm();
    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoading = true;
    this.categoryService.getAll(this.selectedTab).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.categories = res.result || [];
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Failed to load categories';
      }
    });
  }

  saveCategory(): void {
    if (!this.newCategoryName.trim() || this.isSaving) {
      return;
    }

    this.isSaving = true;
    this.isLoading = true;
    if (this.isEditing && this.selectedCategoryId) {
      this.categoryService.update(this.selectedCategoryId, this.newCategoryName).subscribe({
        next: () => {
          this.successMessage = 'Category updated successfully';
          this.resetForm();
          this.loadCategories();
          setTimeout(() => this.successMessage = null, 3000);
        },
        error: (err) => {
          this.isSaving = false;
          this.isLoading = false;
          this.errorMessage = err.error?.message || 'Failed to update category';
          setTimeout(() => this.errorMessage = null, 3000);
        }
      });
    } else {
      this.categoryService.create(this.newCategoryName, this.selectedTab).subscribe({
        next: () => {
          this.successMessage = 'Category created successfully';
          this.resetForm();
          this.loadCategories();
          setTimeout(() => this.successMessage = null, 3000);
        },
        error: (err) => {
          this.isSaving = false;
          this.isLoading = false;
          this.errorMessage = err.error?.message || 'Failed to create category';
          setTimeout(() => this.errorMessage = null, 3000);
        }
      });
    }
  }

  editCategory(category: any): void {
    if (!category.userId) return; // Cannot edit system default categories
    this.isEditing = true;
    this.selectedCategoryId = category.id;
    this.newCategoryName = category.name;
    this.errorMessage = null;
    this.successMessage = null;
  }

  async deleteCategory(category: any): Promise<void> {
    if (!category.userId) return; // Cannot delete system default categories

    const confirmed = await this.confirmationService.confirm(
      `Are you sure you want to delete "${category.name}"?`,
      'Delete Category',
      'Delete'
    );

    if (confirmed) {
      this.categoryService.delete(category.id).subscribe({
        next: () => {
          this.successMessage = 'Category deleted successfully';
          if (this.selectedCategoryId === category.id) {
            this.resetForm();
          }
          this.loadCategories();
          setTimeout(() => this.successMessage = null, 3000);
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to delete category';
          setTimeout(() => this.errorMessage = null, 3000);
        }
      });
    }
  }

  resetForm(): void {
    this.isEditing = false;
    this.selectedCategoryId = null;
    this.newCategoryName = '';
    this.isSaving = false;
  }
}
