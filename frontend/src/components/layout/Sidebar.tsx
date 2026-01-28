/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Layout, Menu } from 'antd';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../../lib/axios';
import { Button } from 'antd';
import {
  ShopOutlined,
  ShoppingCartOutlined,
  AppstoreOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { adminSidebarItems } from '../../routes/adminSidebarItems';
import { userSidebarItems } from '../../routes/userSidebarItems';
import type { TRole } from '../../types';
import './sidebar.css';

const { Sider } = Layout;

const ICON_MAP: Record<string, any> = {
  Products: <ShopOutlined />,
  Sales: <ShoppingCartOutlined />,
  Dashboard: <BarChartOutlined />,
};

interface Props {
  user?: { role?: TRole } | null;
}

export default function Sidebar({ user }: Props) {
  const role = user?.role ?? 'CASHIER';
  const isAdminOrCashier = role === 'ADMIN' || role === 'CASHIER';
  const sections = isAdminOrCashier ? adminSidebarItems : userSidebarItems;
  const location = useLocation();
  

  const navigate = useNavigate();
  const qClient = useQueryClient();

  const base = '/app';

  const items = sections.flatMap((section) =>
    section.items.map((it) => {
      const path = String(it.url || '');
      const to = path.startsWith('/') ? path : `${base}/${path}`;
      return {
        key: to,
        icon: ICON_MAP[section.title] ?? <AppstoreOutlined />,
        label: <Link to={to}>{it.title}</Link>,
      };
    }),
  );

  // no static additions — adminSidebarItems will be shown for CASHIER as well

  return (
    <Sider width={240} className="app-sider">
      <div className="sider-top">
        <div className="sider-logo">POS</div>
        <div className="sider-sub">{role === 'ADMIN' ? 'Admin Panel' : role === 'CASHIER' ? 'Cashier Panel' : 'User'}</div>
      </div>
      <div className="sider-menu" style={{ background: 'transparent' }}>
        <Menu
          mode="vertical"
          theme="light"
          // select by full pathname so keys match absolute item keys
          selectedKeys={[location.pathname.replace(/\/+$/, '')]}
          items={items}
          style={{ border: 'none', background: 'transparent' }}
          onClick={(info) => {
            if (typeof info.key === 'string') navigate(info.key);
          }}
        />
        <div style={{ padding: 12, borderTop: '1px solid rgba(0,0,0,0.04)', marginTop: 8 }}>
          <Button
            danger
            block
            onClick={async () => {
              try {
                await axiosInstance.post('/auth/logout');
              } catch (e) {
                console.error('Logout request failed', e);
              }
              try {
                localStorage.removeItem('access_token');
              } catch (e) {
                console.error('Failed to remove access_token from localStorage', e);
              }
              try {
                delete axiosInstance.defaults.headers.common['Authorization'];
              } catch (e) {
                /* ignore */
              }
              try {
                qClient.clear();
                qClient.removeQueries();
              } catch (e) {
                /* ignore */
              }
              navigate('/login');
            }}
          >
            Logout
          </Button>
        </div>
      </div>
    </Sider>
  );
}
