import React, { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import 'antd/dist/reset.css';
import { RouterProvider } from 'react-router-dom';
import AppQueryProvider from './providers/QueryClientProvider';
import router from './routes';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppQueryProvider>
      <Suspense fallback={<div>Loading...</div>}>
        <RouterProvider router={router} />
      </Suspense>
    </AppQueryProvider>
  </React.StrictMode>,
);
