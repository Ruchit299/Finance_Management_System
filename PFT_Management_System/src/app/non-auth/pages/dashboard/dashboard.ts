import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  user: any = null;
  currentDate = new Date();

  // Static data as requested
  stats = {
    totalBalance: 75000,
    monthlyIncome: 50000,
    monthlyExpenses: 32000,
    savings: 18000,
    budgetUtilization: 64 // (32000 / 50000) * 100
  };

  // Static budget categories for display
  budgets = [
    { category: 'Housing & Rent', limit: 15000, spent: 12000, percent: 80, color: 'bg-primary' },
    { category: 'Groceries & Dining', limit: 10000, spent: 7500, percent: 75, color: 'bg-success' },
    { category: 'Utilities & Internet', limit: 5000, spent: 3000, percent: 60, color: 'bg-info' },
    { category: 'Entertainment & Shopping', limit: 10000, spent: 9500, percent: 95, color: 'bg-warning' }
  ];

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    this.user = this.authService.getUser();
  }
}
