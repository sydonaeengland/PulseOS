import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/admin/Sidebar';

function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const h = () => setWidth(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return width;
}

export default function AdminLayout() {
  const width = useWindowWidth();
  const [collapsed, setCollapsed] = useState(width < 1024);
  const sidebarWidth = collapsed ? 64 : 220;

  // Auto-collapse on narrow screens
  useEffect(() => {
    if (width < 1024 && !collapsed) setCollapsed(true);
  }, [width]);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(prev => !prev)} />
      <div style={{
        marginLeft: sidebarWidth,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'margin-left 0.22s cubic-bezier(0.4,0,0.2,1)',
        minWidth: 0,
      }}>
        <Outlet />
      </div>
    </div>
  );
}
