import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../Navbar';
import Footer from '../Footer';
import { useTheme } from '../../context/ThemeContext';

const Layout: React.FC = () => {
  const { darkMode } = useTheme();

  return (
    <div className={darkMode ? 'dark' : ''}>
      <Navbar />
      <main className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;