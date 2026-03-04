import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, message, Alert } from 'antd';
import { HomeOutlined, CoffeeOutlined, TagsOutlined, UserOutlined, LogoutOutlined, DownloadOutlined } from '@ant-design/icons';
import { HashRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import TenantDashboard from './pages/TenantDashboard';
import MealTracker from './pages/MealTracker';
import ServiceRequests from './pages/ServiceRequests';
import Perks from './pages/Perks';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Signup from './pages/Signup';
import './App.css';

const { Header, Content } = Layout;

interface User {
  id: number;
  name: string;
  phone: string;
  aadhar: string;
  is_admin: boolean;
  created_at?: string;
}

interface MenuItem {
  key: string;
  icon: React.ReactNode;
  label: string;
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else if (location.pathname !== '/login' && location.pathname !== '/signup') {
      navigate('/login');
    }
  }, [navigate, location]);

  // PWA install prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        setShowInstallBanner(true);
      }
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result.outcome === 'accepted') {
      message.success('App installed successfully!');
    }
    setInstallPrompt(null);
    setShowInstallBanner(false);
  };

  const dismissInstallBanner = () => {
    setShowInstallBanner(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
    message.success('Logged out successfully');
  };

  const handleMenuClick = (key: string) => {
    navigate(key);
  };

  if (!user || location.pathname === '/login' || location.pathname === '/signup') {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  let menuItems: MenuItem[] = [];

  if (user.is_admin) {
    menuItems = [
      { key: '/admin', icon: <HomeOutlined />, label: 'Admin Panel' },
      { key: '/profile', icon: <UserOutlined />, label: 'Profile' },
    ];
  } else {
    menuItems = [
      { key: '/home', icon: <HomeOutlined />, label: 'Home' },
      { key: '/meals', icon: <CoffeeOutlined />, label: 'Meals' },
      { key: '/service-requests', icon: <HomeOutlined />, label: 'Issues' },
      { key: '/perks', icon: <TagsOutlined />, label: 'Perks' },
      { key: '/profile', icon: <UserOutlined />, label: 'Profile' },
    ];
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#001529', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>PGMT</div>
        <Button type="primary" danger onClick={handleLogout} icon={<LogoutOutlined />}>
          Logout
        </Button>
      </Header>
      {showInstallBanner && (
        <Alert
          message="Install PGMT App"
          description="Add PGMT to your home screen for quick access and offline support."
          type="info"
          showIcon
          icon={<DownloadOutlined />}
          closable
          onClose={dismissInstallBanner}
          action={
            <Button size="small" type="primary" onClick={handleInstall} icon={<DownloadOutlined />}>
              Install
            </Button>
          }
          style={{ margin: '0', borderRadius: 0 }}
        />
      )}
      <Content style={{ padding: '20px', marginBottom: '80px' }}>
        <Routes>
          {user.is_admin ? (
            <>
              <Route path="/admin" element={<AdminDashboard user={user} />} />
              <Route path="/profile" element={<Profile user={user} />} />
              <Route path="*" element={<AdminDashboard user={user} />} />
            </>
          ) : (
            <>
              <Route path="/home" element={<TenantDashboard user={user} />} />
              <Route path="/meals" element={<MealTracker user={user} />} />
              <Route path="/service-requests" element={<ServiceRequests user={user} />} />
              <Route path="/perks" element={<Perks />} />
              <Route path="/profile" element={<Profile user={user} />} />
              <Route path="*" element={<TenantDashboard user={user} />} />
            </>
          )}
        </Routes>
      </Content>
      <div style={{
        position: 'fixed',
        bottom: 0,
        width: '100%',
        background: 'white',
        boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.1)',
        zIndex: 100,
      }}>
        <Menu
          mode="horizontal"
          selectedKeys={[location.pathname]}
          onClick={(e) => handleMenuClick(e.key)}
          items={menuItems.map(item => ({
            key: item.key,
            icon: item.icon,
            label: item.label,
          }))}
          style={{ display: 'flex', justifyContent: 'space-around', border: 'none' }}
        />
      </div>
    </Layout>
  );
}

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppContent />
    </Router>
  );
}

export default App;
