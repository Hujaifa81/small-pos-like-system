/* eslint-disable @typescript-eslint/no-explicit-any */
import { Outlet } from 'react-router-dom';
import type { TRole } from '../../types';
import type { ReactNode } from 'react';
import { Layout } from 'antd';
import Sidebar from './Sidebar';

interface Props {
  user?: { role?: TRole; [key: string]: any } | null;
  children?: ReactNode;
}

export default function DashboardLayout({ user }: Props) {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar user={user} />
      <Layout>
        <Layout.Content style={{ padding: 24 }}>
          <Outlet />
        </Layout.Content>
      </Layout>
    </Layout>
  );
}
