import { lazy } from 'react';
import type { ISidebarItem } from '../types';

const ProductsList = lazy(() => import('../pages/Admin/ProductsList'));
const ProductCreate = lazy(() => import('../pages/Admin/ProductCreate'));
const SalesCreate = lazy(() => import('../pages/User/SalesCreate'));
const MySales = lazy(() => import('../pages/User/MySales'));

export const adminSidebarItems: ISidebarItem[] = [
  {
    title: 'Products',
    items: [
      { title: 'Products List', url: 'products', component: ProductsList },
      { title: 'Create Product', url: 'products/create', component: ProductCreate },
    ],
  },
  {
    title: 'Sales',
    items: [
      { title: 'Create Sale', url: 'sales/create', component: SalesCreate },
      { title: 'My Sales', url: 'sales/mine', component: MySales },
    ],
  },
];
