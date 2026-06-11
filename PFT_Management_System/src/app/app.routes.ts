import { Routes } from '@angular/router';

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
    // {
    //     path: 'dashboard',
    //     loadComponent: () => import('./pages/dashboard/dashboard.component').then(c => c.Dashboard)
    // },
    {
        path: '**',
        redirectTo: 'login'
    }
];
