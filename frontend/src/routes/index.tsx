import React, { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import CommonLayout from '../components/layout/CommonLayout';
import Homepage from '../pages/Homepage';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Unauthorized from '../pages/Unauthorized';
import Products from '../pages/Products';
import ProductDetails from '../pages/ProductDetails';
import Sales from '../pages/Sales';
import DashboardLayout from '../components/layout/DashboardLayout';
import generateRoutes from '../utils/generateRoutes';
import withAuth from '../utils/withAuth';
import { adminSidebarItems } from './adminSidebarItems';
import { userSidebarItems } from './userSidebarItems';

const ProductsList = lazy(() => import('../pages/Admin/ProductsList'));
const ProductCreate = lazy(() => import('../pages/Admin/ProductCreate'));
const ProductEdit = lazy(() => import('../pages/Admin/ProductEdit'));
const SalesOverview = lazy(() => import('../pages/Admin/SalesOverview'));

const router = createBrowserRouter([
    {
        path: '/',
        element: <CommonLayout />,
        children: [
            { index: true, element: <Homepage /> },
            { path: 'unauthorized', element: <Unauthorized /> },
        ],
    },
    {
        path: '/admin',
        element: React.createElement(withAuth(DashboardLayout, 'ADMIN')),
        children: [
            ...generateRoutes(adminSidebarItems),
            { path: 'products', element: <ProductsList /> },
            { path: 'products/create', element: <ProductCreate /> },
            { path: 'products/:id/edit', element: <ProductEdit /> },
            { path: 'sales', element: <SalesOverview /> },
        ],
    },
    {
        path: '/app',
        element: React.createElement(withAuth(DashboardLayout, 'CASHIER')),
        children: [
            ...generateRoutes(userSidebarItems),
            { path: 'sales', element: <Sales /> },
        ],
    },
    { path: '/products', element: <Products /> },
    { path: '/products/:id', element: <ProductDetails /> },
    { path: '/sales', element: <Sales /> },
    { path: 'login', element: <Login /> },
    { path: 'register', element: <Register /> },
]);

export default router;
