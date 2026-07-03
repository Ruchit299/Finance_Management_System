import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { AuthService } from '../../../auth/services/auth.service';
import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NgSelectModule],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  user: any = null;
  currentDate = new Date();
  isLoading = true;
  errorMessage: string | null = null;
  timeframe: 'monthly' | 'alltime' = 'monthly';
  availableMonths: string[] = [];
  selectedMonth: string = new Date().toISOString().substring(0, 7);

  selectedPeriod: string = new Date().toISOString().substring(0, 7);

  periodOptions: { value: string; label: string }[] = [];

  // Data from API
  summary: any = null;
  budgetDetails: any[] = [];
  categoryExpenses: any[] = [];
  trendData: any[] = [];
  savingsGoals: any[] = [];
  bills: any[] = [];
  billAlerts: any = { overdueCount: 0, dueSoonCount: 0 };
  recurringCount = 0;
  recentTransactions: any[] = [];
  paymentMethodBreakdown: any[] = [];

  // Color palette for charts
  categoryColors = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#14b8a6'];

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getUser();
    this.loadDashboard();
  }

  onPeriodChange(val: string): void {
    if (!val) return;
    if (val === 'alltime') {
      this.timeframe = 'alltime';
    } else {
      this.timeframe = 'monthly';
      this.selectedMonth = val;
    }
    this.selectedPeriod = val;
    this.loadDashboard();
  }

  formatMonthYear(m: string): string {
    if (!m) return '';
    const [year, month] = m.split('-');
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString('default', { month: 'long', year: 'numeric' });
  }

  loadDashboard(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.dashboardService.getSummary(this.timeframe, this.timeframe === 'monthly' ? this.selectedMonth : undefined).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.summary = res.summary;
        this.availableMonths = res.availableMonths || [];
        
        const opts = [{ value: 'alltime', label: 'All Time' }];
        this.availableMonths.forEach((m) => {
          opts.push({ value: m, label: this.formatMonthYear(m) });
        });
        this.periodOptions = opts;
        
        if (this.timeframe === 'alltime') {
          this.selectedPeriod = 'alltime';
        } else {
          this.selectedMonth = res.summary.month;
          this.selectedPeriod = res.summary.month;
        }

        this.budgetDetails = res.budgetDetails || [];
        this.categoryExpenses = res.categoryExpenses || [];
        this.paymentMethodBreakdown = res.paymentMethodBreakdown || [];
        this.trendData = res.trendData || [];
        this.savingsGoals = res.savingsGoals || [];
        this.bills = res.bills || [];
        this.billAlerts = res.billAlerts || { overdueCount: 0, dueSoonCount: 0 };
        this.recurringCount = res.recurringCount || 0;
        this.recentTransactions = res.recentTransactions || [];
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Failed to load dashboard data';
      }
    });
  }

  // ─── Chart Helpers ──────────────────────────────────────────────────────────

  /** Income vs Expense bar chart — returns bar height in SVG units (max 80) */
  getBarHeight(value: number): number {
    const max = Math.max(this.summary?.monthlyIncome || 0, this.summary?.monthlyExpense || 1);
    return max > 0 ? Math.max(4, (value / max) * 80) : 4;
  }

  getBarY(value: number): number {
    return 100 - this.getBarHeight(value);
  }

  /** Donut chart: compute stroke-dasharray and cumulative offset for each slice */
  getDonutSegments(): { color: string; dashArray: string; dashOffset: number; label: string; amount: number; percent: number }[] {
    const total = this.categoryExpenses.reduce((s, c) => s + c.amount, 0);
    if (total === 0) return [];

    // Full circumference for r=40 => 2π*40 ≈ 251.2 — we map to 100 for easy math
    let offset = 0;
    return this.categoryExpenses.map((c, i) => {
      const slice = (c.amount / total) * 100;
      const seg = {
        color: this.categoryColors[i % this.categoryColors.length],
        dashArray: `${slice.toFixed(1)} ${(100 - slice).toFixed(1)}`,
        dashOffset: -offset,
        label: c.category,
        amount: c.amount,
        percent: c.percent
      };
      offset += slice;
      return seg;
    });
  }

  /** Monthly trend polyline — maps 6 months of expenses into SVG coordinates */
  getTrendPoints(): string {
    if (!this.trendData.length) return '';
    const maxVal = Math.max(...this.trendData.map(d => Math.max(d.income, d.expense)), 1);
    const svgW = 460, svgH = 110, padL = 20, padTop = 10;
    const stepX = (svgW - padL) / Math.max(this.trendData.length - 1, 1);
    return this.trendData.map((d, i) => {
      const x = padL + i * stepX;
      const y = padTop + (1 - d.expense / maxVal) * (svgH - padTop);
      return `${x},${y.toFixed(1)}`;
    }).join(' ');
  }

  getTrendIncomePoints(): string {
    if (!this.trendData.length) return '';
    const maxVal = Math.max(...this.trendData.map(d => Math.max(d.income, d.expense)), 1);
    const svgW = 460, svgH = 110, padL = 20, padTop = 10;
    const stepX = (svgW - padL) / Math.max(this.trendData.length - 1, 1);
    return this.trendData.map((d, i) => {
      const x = padL + i * stepX;
      const y = padTop + (1 - d.income / maxVal) * (svgH - padTop);
      return `${x},${y.toFixed(1)}`;
    }).join(' ');
  }

  getTrendMaxY(): number {
    return Math.max(...this.trendData.map(d => Math.max(d.income, d.expense)), 1);
  }

  getMonthLabel(m: string): string {
    const [y, mo] = m.split('-');
    const date = new Date(Number(y), Number(mo) - 1, 1);
    return date.toLocaleString('default', { month: 'short' });
  }

  getTrendX(index: number): number {
    const svgW = 460, padL = 20;
    const stepX = (svgW - padL) / Math.max(this.trendData.length - 1, 1);
    return padL + index * stepX;
  }

  getTrendY(value: number): number {
    const maxVal = this.getTrendMaxY();
    const svgH = 110, padTop = 10;
    return padTop + (1 - value / maxVal) * (svgH - padTop);
  }

  // ─── Utility ────────────────────────────────────────────────────────────────

  getProgressColor(percent: number): string {
    if (percent >= 100) return '#22c55e';
    if (percent >= 75) return '#3b82f6';
    if (percent >= 50) return '#f59e0b';
    return '#ef4444';
  }

  getBudgetBarColor(isExceeded: boolean, percent: number): string {
    if (isExceeded) return '#ef4444';
    if (percent >= 80) return '#f59e0b';
    return '#6366f1';
  }

  getAlertBadgeClass(level: string): string {
    const map: { [k: string]: string } = {
      overdue: 'bg-danger',
      critical: 'bg-danger',
      warning: 'bg-warning text-dark',
      soon: 'bg-warning text-dark',
      ok: 'bg-success',
    };
    return map[level] || 'bg-secondary';
  }

  getAlertLabel(level: string, days: number): string {
    if (level === 'overdue') return `${Math.abs(days)}d overdue`;
    if (days === 0) return 'Due today';
    return `${days}d left`;
  }
}
