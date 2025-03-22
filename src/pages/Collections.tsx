import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Book, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Collections: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Mock collections data - replace with actual data from your API
  const collections = [
    {
      id: '1',
      title: 'Fantasy Favorites',
      description: 'My favorite fantasy books of all time',
      bookCount: 12,
      coverUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
    },
    {
      id: '2',
      title: 'Science & Technology',
      description: 'Latest reads in tech and science',
      bookCount: 8,
      coverUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold dark:text-white">My Collections</h1>
          {user && (
            <button
              onClick={() => {/* Handle create collection */}}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="h-5 w-5" />
              Create Collection
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map(collection => (
            <div
              key={collection.id}
              onClick={() => navigate(`/collections/${collection.id}`)}
              className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
            >
              <div className="relative h-48">
                <img
                  src={collection.coverUrl}
                  alt={collection.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                  <h3 className="text-white text-xl font-semibold">{collection.title}</h3>
                </div>
              </div>
              <div className="p-4">
                <p className="text-gray-600 dark:text-gray-300 mb-4">{collection.description}</p>
                <div className="flex items-center text-gray-500 dark:text-gray-400">
                  <Book className="h-5 w-5 mr-2" />
                  <span>{collection.bookCount} books</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {!user && (
          <div className="mt-8 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Sign in to create and manage your own collections!
            </p>
            <button
              onClick={() => navigate('/signin')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Collections;