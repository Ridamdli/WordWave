import React, { useState, useEffect } from 'react';
import { Book, Download, Heart, Share2, Star, ArrowLeft, Bookmark } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { checkIfLiked, checkIfSaved, toggleLike, toggleSave } from '../lib/api';

interface BookDetailsProps {
  onBack: () => void;
  id?: string;
  user?: { id: string };
  book?: { id: string };
}

// This would typically come from your data layer
const bookDetails = {
  id: 1,
  title: "The Psychology of Money",
  author: "Morgan Housel",
  cover: "https://images.unsplash.com/photo-1553729459-efe14ef6055d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
  rating: 4.7,
  pageCount: 256,
  genre: "Business & Psychology",
  summary: "Timeless lessons on wealth, greed, and happiness doing well with money isn't necessarily about what you know. It's about how you behave. And behavior is hard to teach, even to really smart people.",
  fileSize: "15MB",
  format: ["PDF", "EPUB"],
  physicalCopies: 5,
  reviews: [
    { id: 1, user: "Alice", rating: 5, comment: "Insightful and practical. A must-read!" },
    { id: 2, user: "Bob", rating: 4, comment: "Great perspective on money management." }
  ]
};

const relatedBooks = [
  {
    id: 1,
    title: "Rich Dad Poor Dad",
    author: "Robert Kiyosaki",
    cover: "https://images.unsplash.com/photo-1592496431122-2349e0fbc666?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    rating: 4.8
  },
  {
    id: 2,
    title: "Atomic Habits",
    author: "James Clear",
    cover: "https://images.unsplash.com/photo-1589998059171-988d887df646?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    rating: 4.9
  },
  {
    id: 3,
    title: "Think and Grow Rich",
    author: "Napoleon Hill",
    cover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    rating: 4.7
  }
];

const BookDetails: React.FC<BookDetailsProps> = ({ onBack, id, user, book }) => {
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    if (id) {
      fetchBookDetails(id);
      fetchReviews(id);
      if (user) {
        checkUserInteractions(id);
      }
    }
  }, [id, user]);

  const checkUserInteractions = async (bookId: string) => {
    try {
      if (!user) return;

      const [likedStatus, savedStatus] = await Promise.all([
        checkIfLiked(user.id, bookId),
        checkIfSaved(user.id, bookId)
      ]);

      setIsLiked(likedStatus);
      setIsSaved(savedStatus);
    } catch (error) {
      console.error('Error checking user interactions:', error);
    }
  };

  const handleLike = async () => {
    try {
      if (!user) {
        toast.error('Please sign in to like books');
        navigate('/signin');
        return;
      }

      if (!book) return;

      const newLikedStatus = await toggleLike(user.id, book.id);
      setIsLiked(newLikedStatus);
      setLikesCount(prev => newLikedStatus ? prev + 1 : prev - 1);
      toast.success(newLikedStatus ? 'Added to likes' : 'Removed from likes');
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like status');
    }
  };

  const handleSave = async () => {
    try {
      if (!user) {
        toast.error('Please sign in to save books');
        navigate('/signin');
        return;
      }

      if (!book) return;

      const newSavedStatus = await toggleSave(user.id, book.id);
      setIsSaved(newSavedStatus);
      toast.success(newSavedStatus ? 'Book saved to library' : 'Book removed from library');
    } catch (error) {
      console.error('Error toggling save:', error);
      toast.error('Failed to update save status');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 pt-16">
      <button
        onClick={onBack}
        className="fixed top-20 left-4 z-10 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <ArrowLeft className="h-6 w-6 dark:text-white" />
      </button>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
          <div className="md:flex">
            <div className="md:w-1/3">
              <img
                src={bookDetails.cover}
                alt={bookDetails.title}
                className="w-full h-[500px] object-cover"
              />
            </div>

            <div className="md:w-2/3 p-8">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold dark:text-white">{bookDetails.title}</h1>
                  <p className="text-xl text-gray-600 dark:text-gray-300 mt-2">by {bookDetails.author}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleLike}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                    aria-label={isLiked ? "Unlike book" : "Like book"}
                  >
                    <Heart
                      className={`h-6 w-6 ${
                        isLiked ? 'fill-red-500 text-red-500' : 'dark:text-white'
                      }`}
                    />
                  </button>
                  <button
                    onClick={handleSave}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                    aria-label={isSaved ? "Remove from library" : "Save to library"}
                  >
                    <Bookmark
                      className={`h-6 w-6 ${
                        isSaved ? 'fill-blue-500 text-blue-500' : 'dark:text-white'
                      }`}
                    />
                  </button>
                  <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                    <Share2 className="h-6 w-6 dark:text-white" />
                  </button>
                </div>
              </div>

              <div className="flex items-center mt-4">
                <Star className="h-5 w-5 text-yellow-400 fill-current" />
                <span className="ml-2 text-gray-600 dark:text-gray-300">{bookDetails.rating} Rating</span>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Pages</p>
                  <p className="text-lg font-semibold dark:text-white">{bookDetails.pageCount}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Genre</p>
                  <p className="text-lg font-semibold dark:text-white">{bookDetails.genre}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">File Size</p>
                  <p className="text-lg font-semibold dark:text-white">{bookDetails.fileSize}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Physical Copies</p>
                  <p className="text-lg font-semibold dark:text-white">{bookDetails.physicalCopies} available</p>
                </div>
              </div>

              <p className="mt-6 text-gray-600 dark:text-gray-300">{bookDetails.summary}</p>

              <div className="flex gap-4 mt-8">
                <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                  <Book className="h-5 w-5" />
                  Read Online
                </button>
                <button className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                  <Download className="h-5 w-5" />
                  Download
                </button>
              </div>

              <div className="mt-6">
                <p className="text-sm text-gray-500 dark:text-gray-400">Available Formats</p>
                <div className="flex gap-2 mt-2">
                  {bookDetails.format.map(format => (
                    <span
                      key={format}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                    >
                      {format}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 p-8">
            <h2 className="text-2xl font-bold dark:text-white mb-6">Reviews</h2>
            <div className="space-y-6">
              {bookDetails.reviews.map(review => (
                <div key={review.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold dark:text-white">{review.user}</p>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="ml-1 text-gray-600 dark:text-gray-300">{review.rating}</span>
                    </div>
                  </div>
                  <p className="mt-2 text-gray-600 dark:text-gray-300">{review.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-bold dark:text-white mb-6">Related Books</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedBooks.map(book => (
              <div
                key={book.id}
                className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
              >
                <img
                  src={book.cover}
                  alt={book.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="font-semibold text-lg dark:text-white">{book.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{book.author}</p>
                  <div className="mt-2 flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="ml-1 text-gray-600 dark:text-gray-300">{book.rating}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetails;