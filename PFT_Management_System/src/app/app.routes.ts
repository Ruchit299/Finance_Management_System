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
            }
        ]
    },
    {
        path: '**',
        redirectTo: 'login'
    }
];
