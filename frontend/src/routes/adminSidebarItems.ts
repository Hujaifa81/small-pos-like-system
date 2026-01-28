import { lazy } from 'react';
import type { ISidebarItem } from '../types';

const ProductsList = lazy(() => import('../pages/Admin/ProductsList'));
const ProductCreate = lazy(() => import('../pages/Admin/ProductCreate'));
const SalesOverview = lazy(() => import('../pages/Admin/SalesOverview'));

export const adminSidebarItems: ISidebarItem[] = [
  {
    title: 'Dashboard',
    items: [
      { title: 'Sales Overview', url: 'sales', component: SalesOverview },
    ],
  },
  {
    title: 'Products',
    items: [
      { title: 'Products List', url: 'products', component: ProductsList },
      { title: 'Create Product', url: 'products/create', component: ProductCreate },
    ],
  },
];
