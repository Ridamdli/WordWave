import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Book, Settings, Star, BookOpen, Download, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import LoadingSpinner from './LoadingSpinner';
import { getBookCoverUrl } from '../lib/books';
import { useImageWithFallback } from '../lib/hooks';

interface DashboardStats {
  totalBooks: number;
  totalDownloads: number;
  booksReading: number;
  completedBooks: number;
}

interface UserBook {
  id: string;
  title: string;
  cover: string;
  progress: number;
  lastRead: string;
}

// Book card component to fix hooks issue
const RecentBookCard = ({ book, onClick }: { book: UserBook, onClick: (id: string) => void }) => {
  const coverImageSrc = useImageWithFallback(
    getBookCoverUrl(book.cover),
    'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
  );

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all flex cursor-pointer"
      onClick={() => onClick(book.id)}
    >
      <img 
        src={coverImageSrc} 
        alt={book.title} 
        className="w-24 h-32 object-cover flex-shrink-0" 
      />
      <div className="p-4 flex flex-col justify-between flex-grow">
        <div>
          <h3 className="font-semibold text-gray-800 dark:text-white">{book.title}</h3>
          <div className="mt-2 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${book.progress}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {book.progress}% complete
          </p>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Last read: {new Date(book.lastRead).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};

// Library book card component
const LibraryBookCard = ({ book }: { book: UserBook }) => {
  const navigate = useNavigate();
  const coverImageSrc = useImageWithFallback(
    getBookCoverUrl(book.cover),
    'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
  );
  
  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
    >
      <img
        src={coverImageSrc}
        alt={book.title}
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <h3 className="font-semibold text-lg dark:text-white">{book.title}</h3>
        <div className="mt-2">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${book.progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {book.progress}% complete
          </p>
        </div>
        <div className="mt-4 flex space-x-2">
          <button 
            onClick={() => navigate(`/books/${book.id}`)}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Continue Reading
          </button>
          <button 
            aria-label="Download book"
            className="p-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            <Download className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

type DashboardSection = 'overview' | 'library' | 'settings';

const UserDashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<DashboardSection>('overview');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [username, setUsername] = useState(user?.user_metadata?.username || '');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalBooks: 0,
    totalDownloads: 0,
    booksReading: 0,
    completedBooks: 0
  });
  const [recentBooks, setRecentBooks] = useState<UserBook[]>([]);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!supabase || !user) return;

    try {
      // Fetch user stats
      const { data: userBooks, error: statsError } = await supabase
        .from('user_books')
        .select('*')
        .eq('user_id', user.id);

      if (statsError) throw statsError;

      if (userBooks) {
        setStats({
          totalBooks: userBooks.length,
          totalDownloads: userBooks.filter(book => book.downloaded).length,
          booksReading: userBooks.filter(book => book.progress > 0 && book.progress < 100).length,
          completedBooks: userBooks.filter(book => book.progress === 100).length
        });
      }

      // Fetch recent books
      const { data: recentData, error: recentError } = await supabase
        .from('user_books')
        .select(`
          id,
          books (
            title,
            cover_url
          ),
          progress,
          last_read
        `)
        .eq('user_id', user.id)
        .order('last_read', { ascending: false })
        .limit(3);

      if (recentError) throw recentError;

      if (recentData) {
        setRecentBooks(recentData.map(book => ({
          id: book.id,
          title: book.books.title,
          cover: book.books.cover_url,
          progress: book.progress,
          lastRead: book.last_read
        })));
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!supabase) {
      toast.error('Unable to update profile. Please try again later.');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        data: { username }
      });

      if (error) throw error;
      toast.success('Profile updated successfully!');
      setIsEditingProfile(false);
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handleCardClick = (section: DashboardSection) => {
    setActiveSection(section);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 pt-16 flex items-center justify-center">
        <LoadingSpinner size="large" color="#3B82F6" />
      </div>
    );
  }

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div 
          onClick={() => handleCardClick('library')}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
        >
          <Book className="h-8 w-8 text-blue-500 mb-4" />
          <h3 className="text-2xl font-bold dark:text-white">{stats.totalBooks}</h3>
          <p className="text-gray-600 dark:text-gray-400">Total Books</p>
        </div>
        <div 
          onClick={() => handleCardClick('library')}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
        >
          <Download className="h-8 w-8 text-green-500 mb-4" />
          <h3 className="text-2xl font-bold dark:text-white">{stats.totalDownloads}</h3>
          <p className="text-gray-600 dark:text-gray-400">Downloads</p>
        </div>
        <div 
          onClick={() => handleCardClick('library')}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
        >
          <BookOpen className="h-8 w-8 text-purple-500 mb-4" />
          <h3 className="text-2xl font-bold dark:text-white">{stats.booksReading}</h3>
          <p className="text-gray-600 dark:text-gray-400">Currently Reading</p>
        </div>
        <div 
          onClick={() => handleCardClick('library')}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
        >
          <Star className="h-8 w-8 text-yellow-500 mb-4" />
          <h3 className="text-2xl font-bold dark:text-white">{stats.completedBooks}</h3>
          <p className="text-gray-600 dark:text-gray-400">Completed Books</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-6 dark:text-white">Recent Activity</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentBooks.map((book) => (
            <RecentBookCard 
              key={book.id} 
              book={book} 
              onClick={(id) => navigate(`/books/${id}`)} 
            />
          ))}
        </div>
      </div>
    </div>
  );

  const renderLibrary = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold dark:text-white">My Library</h2>
        <div className="flex space-x-2">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Add New Book
          </button>
          <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">
            Filter
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recentBooks.map(book => (
          <LibraryBookCard key={book.id} book={book} />
        ))}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-8">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-6 dark:text-white">Profile Settings</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Username
            </label>
            {isEditingProfile ? (
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <button
                  onClick={handleUpdateProfile}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <span className="text-gray-900 dark:text-white">{username}</span>
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  Edit
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-6 dark:text-white">Preferences</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">Email Notifications</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">Reading Reminders</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-6 dark:text-white">Account Actions</h2>
        <div className="space-y-4">
          <button
            onClick={() => signOut()}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-64 space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold dark:text-white">{username || 'User'}</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{user?.email}</p>
                </div>
              </div>
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveSection('overview')}
                  className={`w-full flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    activeSection === 'overview'
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <Book className="h-5 w-5" />
                  <span>Overview</span>
                </button>
                <button
                  onClick={() => setActiveSection('library')}
                  className={`w-full flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    activeSection === 'library'
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <BookOpen className="h-5 w-5" />
                  <span>My Library</span>
                </button>
                <button
                  onClick={() => setActiveSection('settings')}
                  className={`w-full flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    activeSection === 'settings'
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <Settings className="h-5 w-5" />
                  <span>Settings</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeSection === 'overview' && renderOverview()}
            {activeSection === 'library' && renderLibrary()}
            {activeSection === 'settings' && renderSettings()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;