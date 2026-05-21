import React from 'react';
import { Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  AppstoreOutlined,
  TeamOutlined,
  FileTextOutlined,
  LinkOutlined,
  UserOutlined
} from '@ant-design/icons';

const MainMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const items = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: '首页' },
    { key: '/categories', icon: <AppstoreOutlined />, label: '招聘类别' },
    { key: '/invites', icon: <LinkOutlined />, label: '面试邀请' },
    { key: '/candidates', icon: <TeamOutlined />, label: '候选人' },
  ];

  return (
    <Menu
      mode="horizontal"
      selectedKeys={[location.pathname]}
      onClick={({ key }) => navigate(key)}
      items={items}
      style={{ border: 'none', background: 'transparent' }}
    />
  );
};

export default MainMenu;
