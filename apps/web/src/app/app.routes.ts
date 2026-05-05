import { Routes } from '@angular/router';

export const appRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('@starter/ui-components').then((m) => m.HomePage),
  },

  {
    path: 'programs',
    loadComponent: () => import('@starter/ui-components').then((m) => m.HomePage), // Placeholder
  },
  {
    path: 'resources',
    loadComponent: () => import('@starter/ui-components').then((m) => m.HomePage), // Placeholder
  },
  {
    path: 'support',
    loadComponent: () => import('@starter/ui-components').then((m) => m.HomePage), // Placeholder
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];

