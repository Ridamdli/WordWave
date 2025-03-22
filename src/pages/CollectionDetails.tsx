import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Book, ArrowLeft, Edit, Trash, Share2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const CollectionDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Mock collection data - replace with actual data from your API
  const collection = {
    id,
    title: 'Fantasy Favorites',
    description: 'My favorite fantasy books of all time',
    books: [
      {
        id: '1',
        title: 'The Name of the Wind',
        author: 'Patrick Rothfuss',
        cover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
      },
      {
        id: '2',
        title: 'The Way of Kings',
        author: 'Brandon Sanderson',
        cover: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
      }
    ],
    owner: {
      id: 'user123',
      name: 'John Doe'
    }
  };

  const isOwner = user?.id === collection.owner.id;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/collections')}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Collections
          </button>
          
          {isOwner && (
            <div className="flex gap-2">
              <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg">
                <Edit className="h-5 w-5" />
              </button>
              <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg">
                <Trash className="h-5 w-5" />
              </button>
              <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg">
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        {/* Collection Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h1 className="text-3xl font-bold dark:text-white mb-2">{collection.title}</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{collection.description}</p>
          <div className="flex items-center text-gray-500 dark:text-gray-400">
            <Book className="h-5 w-5 mr-2" />
            <span>{collection.books.length} books</span>
          </div>
        </div>

        {/* Books Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {collection.books.map(book => (
            <div
              key={book.id}
              onClick={() => navigate(`/books/${book.id}`)}
              className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
            >
              <img
                src={book.cover}
                alt={book.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">{book.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{book.author}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CollectionDetails;