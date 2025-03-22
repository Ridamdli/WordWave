import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Book } from 'lucide-react';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="text-center">
        <Book className="mx-auto h-16 w-16 text-blue-500" />
        <h1 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">Page Not Found</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Sorry, we couldn't find the page you're looking for.
        </p>
        <button
          onClick={() => navigate('/')}
          className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Go back home
        </button>
      </div>
    </div>
  );
};

export default NotFound;