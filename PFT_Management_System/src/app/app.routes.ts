import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    },
    {
        path: 'login',
        loadComponent: () => import('../app/auth/pages/login/login').then(c => c.Login)
    },
    {
        path: 'register',
        loadComponent: () => import('../app/auth/pages/register/register').then(c => c.Register)
    },
    {
        path: '',
        component: LayoutComponent,
        children: [
            {
                path: 'dashboard',
                loadComponent: () => import('./non-auth/pages/dashboard/dashboard').then(c => c.Dashboard)
            },
            {
                path: 'transactions',
                loadComponent: () => import('./non-auth/pages/transaction/transaction').then(c => c.Transaction)
            },
            {
                path: 'budget',
                loadComponent: () => import('./non-auth/pages/budget/budget').then(c => c.BudgetComponent)
            },
            {
                path: 'savings-goals',
                loadComponent: () => import('./non-auth/pages/savings-goals/savings-goals').then(c => c.SavingsGoalsComponent)
            },
            {
                path: 'recurring-transactions',
                loadComponent: () => import('./non-auth/pages/recurring-transactions/recurring-transactions').then(c => c.RecurringTransactionsComponent)
            },
            {
                path: 'bill-reminders',
                loadComponent: () => import('./non-auth/pages/bill-reminders/bill-reminders').then(c => c.BillRemindersComponent)
            },
            {
                path: 'categories',
                loadComponent: () => import('./non-auth/pages/category-master/category-master').then(c => c.CategoryMasterComponent)
            },
            {
                path: 'investments',
                loadComponent: () => import('./non-auth/pages/investment/investment').then(c => c.InvestmentComponent)
            }
        ]
    },
    {
        path: '**',
        redirectTo: 'login'
    }
];

