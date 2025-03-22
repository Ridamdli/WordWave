import React, { useState } from 'react';
import { Book, Moon, Sun, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleSignIn = () => {
    navigate('/signin');
    setIsMenuOpen(false);
  };

  const handleSignUp = () => {
    navigate('/signup');
    setIsMenuOpen(false);
  };

  const handleProfileClick = () => {
    navigate('/profile');
    setShowDropdown(false);
    setIsMenuOpen(false);
  };

  return (
    <nav className={`fixed w-full z-50 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
            <Book className={`h-8 w-8 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <span className={`ml-2 text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              WordWave
            </span>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => navigate('/')}
              className={`${
                location.pathname === '/'
                  ? 'text-blue-500'
                  : darkMode
                  ? 'text-gray-300 hover:text-white'
                  : 'text-gray-700 hover:text-gray-900'
              } transition-colors`}
            >
              Home
            </button>
            <button
              onClick={() => navigate('/books')}
              className={`${
                location.pathname === '/books'
                  ? 'text-blue-500'
                  : darkMode
                  ? 'text-gray-300 hover:text-white'
                  : 'text-gray-700 hover:text-gray-900'
              } transition-colors`}
            >
              Browse
            </button>
            {user && (
              <button
                onClick={handleProfileClick}
                className={`${
                  location.pathname === '/profile'
                    ? 'text-blue-500'
                    : darkMode
                    ? 'text-gray-300 hover:text-white'
                    : 'text-gray-700 hover:text-gray-900'
                } transition-colors`}
              >
                My Library
              </button>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-lg ${
                darkMode 
                  ? 'hover:bg-gray-700 text-gray-200' 
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            
            {!user ? (
              <div className="hidden md:flex items-center space-x-4">
                <button
                  onClick={handleSignIn}
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Sign In
                </button>
                <button
                  onClick={handleSignUp}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Sign Up
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {user.email?.split('@')[0]}
                </span>
                <button
                  onClick={signOut}
                  className={`p-2 rounded-lg ${
                    darkMode 
                      ? 'hover:bg-gray-700 text-gray-200' 
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;