import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getBookCoverUrl } from '../lib/books';
import { useImageWithFallback } from '../lib/hooks';
import { BookOpen, Star, ChevronRight } from 'lucide-react';

// Book interface
interface FeaturedBook {
  id: string;
  title: string;
  author: string;
  cover_url: string;
  category: string;
}

// Extracted BookCard component to fix hooks rendering issue
const FeaturedBookCard = ({ book }: { book: FeaturedBook }) => {
  const navigate = useNavigate();
  const coverImageSrc = useImageWithFallback(
    getBookCoverUrl(book.cover_url),
    'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
  );
  
  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-200 dark:border-gray-700"
      onClick={() => navigate(`/book/${book.id}`)}
    >
      <div className="aspect-w-2 aspect-h-3 overflow-hidden">
        <img
          src={coverImageSrc}
          alt={book.title}
          className="w-full h-full object-cover transform transition-transform duration-700 hover:scale-110"
        />
      </div>
      <div className="p-5">
        <h3 className="font-semibold text-lg mb-1 text-gray-900 dark:text-white line-clamp-1">{book.title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{book.author}</p>
        <div className="flex items-center justify-between">
          <span className="inline-block bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-100 text-xs px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-800/50">
            {book.category}
          </span>
          <div className="flex items-center">
            <Star className="h-4 w-4 text-yellow-400" fill="currentColor" />
            <span className="ml-1 text-xs text-gray-600 dark:text-gray-400">4.5</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const FeaturedBooks = () => {
  const navigate = useNavigate();
  
  const featuredBooks = [
    {
      id: '1',
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      cover_url: 'the-great-gatsby.jpg',
      category: 'Classics'
    },
    {
      id: '2',
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      cover_url: 'to-kill-a-mockingbird.jpg',
      category: 'Fiction'
    },
    {
      id: '3',
      title: 'A Brief History of Time',
      author: 'Stephen Hawking',
      cover_url: 'a-brief-history-of-time.jpg',
      category: 'Science'
    },
    {
      id: '4',
      title: 'Pride and Prejudice',
      author: 'Jane Austen',
      cover_url: 'pride-and-prejudice.jpg',
      category: 'Classics'
    }
  ];

  return (
    <div className="my-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
            <BookOpen className="mr-2 h-6 w-6 text-blue-600 dark:text-blue-400" />
            Featured Books
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Discover our handpicked selection of must-read titles</p>
        </div>
        <motion.button
          whileHover={{ x: 3 }}
          whileTap={{ x: -1 }}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium flex items-center text-sm"
          onClick={() => navigate('/books')}
        >
          View all
          <ChevronRight className="h-4 w-4 ml-1" />
        </motion.button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {featuredBooks.map((book, index) => (
          <motion.div
            key={book.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <FeaturedBookCard book={book} />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default FeaturedBooks;