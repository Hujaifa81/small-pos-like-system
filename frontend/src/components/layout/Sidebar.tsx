import { Layout, Menu, theme } from 'antd';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  const isAdmin = role === 'ADMIN';
  const sections = isAdmin ? adminSidebarItems : userSidebarItems;
  const location = useLocation();
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const navigate = useNavigate();

  const items = sections.flatMap((section) =>
    section.items.map((it) => ({
      // use absolute path keys to avoid relative navigation issues
      key: `/app/${it.url}`,
      icon: ICON_MAP[section.title] ?? <AppstoreOutlined />,
      label: <Link to={`/app/${it.url}`}>{it.title}</Link>,
    })),
  );

  // Ensure background is applied with strong specificity and keep a visible width on small screens
  return (
    <Sider width={240} className="app-sider" style={{ background: 'transparent' }}>
      <div className="sider-top" style={{ color: '#fff' }}>
        <div className="sider-logo">POS</div>
        <div className="sider-sub">{isAdmin ? 'Admin Panel' : 'Cashier'}</div>
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
      </div>
    </Sider>
  );
}
