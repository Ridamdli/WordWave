import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Book, Download, Heart, Share2, Star, ArrowLeft, MessageCircle, Send, Flag, Bookmark, ExternalLink, BookOpen, User, ChevronRight, ChevronLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import LoadingSpinner from '../components/LoadingSpinner';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { getBookCoverUrl, toggleLike, checkIfLiked } from '../lib/books';
import { useImageWithFallback } from '../lib/hooks';
import { logger } from '../lib/logger';

interface BookDetailsProps {
  onBack?: () => void;
}

interface BookData {
  id: string;
  title: string;
  author: string;
  cover_url: string;
  summary: string;
  category: string;
  rating: number;
  page_count?: number;
  downloads: number;
  formats: string[];
  file_size?: string;
  created_at: string;
  updated_at: string;
}

interface Review {
  id: string;
  user_id: string;
  book_id: string;
  rating: number;
  comment: string;
  created_at: string;
  user_name: string;
}

const RelatedBookCard = React.memo(({ book, onBookClick }: { book: BookData, onBookClick: (id: string) => void }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Use our custom hook to handle image loading with fallback
  const coverImageSrc = useImageWithFallback(
    getBookCoverUrl(book.cover_url),
    'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
  );

  // Check if book is liked when user is available
  useEffect(() => {
    if (user) {
      checkLikeStatus();
    }
  }, [user, book.id]);

  // Check if the user has liked this book
  const checkLikeStatus = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const isLiked = await checkIfLiked(user.id, book.id);
      setIsLiked(isLiked);
    } catch (error) {
      logger.error('Error checking like status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Direct navigation handler for authentication
  const handleAuthRedirect = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  // Handle card click
  const handleCardClick = useCallback(() => {
    onBookClick(book.id);
  }, [book.id, onBookClick]);

  // Handle download button click
  const handleDownloadClick = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      toast.error('Please sign in to download books');
      handleAuthRedirect('/signin');
      return;
    }
    
    try {
      setIsLoading(true);
      // Get book download link
      if (!supabase) {
        toast.error('Database connection not available');
        return;
      }
      
      const { data: linkData, error: linkError } = await supabase
        .from('book_links')
        .select('download_url')
        .eq('book_id', book.id)
        .single();
      
      if (linkError) {
        toast.error('Download link not available');
        return;
      }
      
      if (linkData && linkData.download_url && typeof linkData.download_url === 'string') {
        // Open download link
        window.open(linkData.download_url, '_blank');
        
        // Update download count in the database
        const { error: updateError } = await supabase
          .from('books')
          .update({ downloads: (book.downloads || 0) + 1 })
          .eq('id', book.id);
        
        if (updateError) {
          logger.error('Error updating download count:', updateError);
        }
        
        // Record the download in user_downloads
        const { error: downloadError } = await supabase
          .from('user_books')
          .upsert({
            user_id: user.id,
            book_id: book.id,
            last_downloaded: new Date().toISOString(),
            download_count: 1
          }, {
            onConflict: 'user_id,book_id',
            ignoreDuplicates: false
          });
        
        if (downloadError) {
          logger.error('Error recording download:', downloadError);
        }
        
        toast.success(`Downloading ${book.title}...`);
      } else {
        toast.error('Download link not available');
      }
    } catch (error) {
      logger.error('Error downloading book:', error);
      toast.error('Failed to download book');
    } finally {
      setIsLoading(false);
    }
  }, [book.id, book.title, book.downloads, user, handleAuthRedirect]);

  // Handle read button click
  const handleReadClick = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      setIsLoading(true);
      // Get book read online link
      if (!supabase) {
        toast.error('Database connection not available');
        return;
      }
      
      const { data: linkData, error: linkError } = await supabase
        .from('book_links')
        .select('read_url')
        .eq('book_id', book.id)
        .single();
      
      if (linkError) {
        toast.error('Online reading is not available for this book');
        return;
      }
      
      if (linkData && linkData.read_url && typeof linkData.read_url === 'string') {
        // Open read link
        window.open(linkData.read_url, '_blank');
        toast.success(`Opening ${book.title} for reading...`);
      } else {
        toast.error('Online reading is not available for this book');
      }
    } catch (error) {
      logger.error('Error opening book for reading:', error);
      toast.error('Failed to open book for reading');
    } finally {
      setIsLoading(false);
    }
  }, [book.id, book.title]);

  // Handle favorite button click
  const handleFavoriteClick = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      toast.error('Please sign in to add favorites');
      handleAuthRedirect('/signin');
      return;
    }
    
    try {
      setIsLoading(true);
      // Toggle like status
      const newLikeStatus = await toggleLike(user.id, book.id);
      setIsLiked(newLikeStatus);
      
      // Show success message
      if (newLikeStatus) {
        toast.success(`Added ${book.title} to favorites!`);
      } else {
        toast.success(`Removed ${book.title} from favorites`);
      }
    } catch (error) {
      logger.error('Error toggling favorite:', error);
      toast.error('Failed to update favorites');
    } finally {
      setIsLoading(false);
    }
  }, [book.id, book.title, user, handleAuthRedirect]);

  return (
    <motion.div
      key={book.id}
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 20,
        translateY: {
          type: "spring",
          stiffness: 300,
          damping: 20
        }
      }}
      className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl will-change-transform flex-shrink-0 w-48 md:w-56"
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative">
        <div className="aspect-[3/4] overflow-hidden">
          <img
            src={coverImageSrc}
            alt={book.title}
            className={`w-full h-full object-cover will-change-transform ${
              isHovered ? 'scale-110 transition-transform duration-500' : 'scale-100 transition-transform duration-300'
            }`}
            loading="lazy" 
            decoding="async"
          />
        </div>
        <div 
          className={`absolute inset-0 bg-black will-change-opacity flex items-center justify-center gap-4 ${
            isHovered ? 'bg-opacity-60 opacity-100' : 'bg-opacity-0 opacity-0'
          } transition-opacity duration-300`}
        >
          <button 
            className="p-3 bg-white rounded-full hover:bg-blue-500 hover:text-white will-change-transform transition-colors duration-200 transform hover:scale-110 hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed"
            onClick={handleReadClick}
            aria-label="Read book online"
            disabled={isLoading}
          >
            <BookOpen className="h-5 w-5" />
          </button>
          <button 
            className="p-3 bg-white rounded-full hover:bg-blue-500 hover:text-white will-change-transform transition-colors duration-200 transform hover:scale-110 hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed"
            onClick={handleDownloadClick}
            aria-label="Download book"
            disabled={isLoading}
          >
            <Download className="h-5 w-5" />
          </button>
          <button 
            className={`p-3 bg-white rounded-full hover:bg-blue-500 hover:text-white will-change-transform transition-colors duration-200 transform hover:scale-110 hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed ${
              isLiked ? 'bg-red-50' : ''
            }`}
            onClick={handleFavoriteClick}
            aria-label={isLiked ? "Remove from favorites" : "Add to favorites"}
            disabled={isLoading}
          >
            <Heart className={`h-5 w-5 transition-colors duration-300 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
          </button>
        </div>
        {book.likes_count > 0 && (
          <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded-full text-white text-sm flex items-center">
            <Heart className="h-3 w-3 fill-red-500 text-red-500 mr-1" />
            {book.likes_count}
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg dark:text-white line-clamp-1">{book.title}</h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-1">{book.author}</p>
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= Math.round(book.rating)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                />
              ))}
            </div>
            <span className="ml-1 text-sm text-gray-600 dark:text-gray-300">
              {book.rating.toFixed(1)}
            </span>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
            <Download className="h-3 w-3 mr-1" />
            {book.downloads?.toLocaleString() || '0'}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {book.formats?.map(format => (
            <span
              key={format}
              className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200"
            >
              {format}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
});

// Add this helper function to throttle scroll events
function throttle<F extends (...args: any[]) => any>(func: F, wait: number) {
  let lastCall = 0;
  return function(...args: Parameters<F>) {
    const now = Date.now();
    if (now - lastCall < wait) return;
    lastCall = now;
    return func(...args);
  };
}

const BookDetails: React.FC<BookDetailsProps> = ({ onBack }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [book, setBook] = useState<BookData | null>(null);
  const [relatedBooks, setRelatedBooks] = useState<BookData[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [readUrl, setReadUrl] = useState<string | null>(null);
  
  // Move the useImageWithFallback hook call to the top level
  // We need a default value until book is loaded
  const coverImageSrc = useImageWithFallback(
    book?.cover_url ? getBookCoverUrl(book.cover_url) : '',
    'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
  );

  // Add these new state variables and refs
  const [visibleRelatedBooks, setVisibleRelatedBooks] = useState<BookData[]>([]);
  const [loadedCount, setLoadedCount] = useState(4); // Initial books to load
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(true);
  const relatedBooksContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (id) {
      fetchBookDetails(id);
      fetchReviews(id);
      if (user) {
        checkIfFavorite(id);
      }
    }
  }, [id, user]);

  useEffect(() => {
    if (relatedBooks.length > 0) {
      setVisibleRelatedBooks(relatedBooks.slice(0, loadedCount));
    }
  }, [relatedBooks, loadedCount]);

  const fetchBookDetails = async (bookId: string) => {
    try {
      setLoading(true);
      if (!supabase) {
        toast.error('Database connection not available');
        return;
      }

      // Fetch book details
      const { data: bookData, error: bookError } = await supabase
        .from('books')
        .select('*')
        .eq('id', bookId)
        .single();

      if (bookError) throw bookError;
      
      if (bookData) {
        // Use type assertion with unknown first to avoid direct conversion
        setBook(bookData as unknown as BookData);
        
        // Fetch related books based on category
        const { data: relatedData, error: relatedError } = await supabase
          .from('books')
          .select('*')
          .eq('category', (bookData as any).category)
          .neq('id', bookId)
          .limit(4);
          
        if (relatedError) throw relatedError;
        setRelatedBooks((relatedData || []) as unknown as BookData[]);
        
        // Fetch download and read links
        const { data: linksData, error: linksError } = await supabase
          .from('book_links')
          .select('download_url, read_url')
          .eq('book_id', bookId)
          .single();
          
        if (!linksError && linksData) {
          setDownloadUrl((linksData as any).download_url);
          setReadUrl((linksData as any).read_url);
        }
      }
    } catch (error) {
      logger.error('Error fetching book details:', error);
      toast.error('Failed to load book details');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async (bookId: string) => {
    try {
      if (!supabase) return;
      
      // First get the reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          id,
          user_id,
          book_id,
          rating,
          comment,
          created_at
        `)
        .eq('book_id', bookId)
        .order('created_at', { ascending: false });
        
      if (reviewsError) throw reviewsError;
      
      // Then get the user data for each review
      if (reviewsData) {
        const reviewsWithUserData = await Promise.all(
          reviewsData.map(async (review) => {
            // Use non-null assertion since we already checked supabase is not null
            const { data: userData } = await supabase!
              .from('profiles')
              .select('username')
              .eq('id', (review as any).user_id)
              .single();
            
            return {
              ...review,
              user_name: (userData as any)?.username || 'Anonymous'
            } as unknown as Review;
          })
        );
        
        setReviews(reviewsWithUserData as Review[]);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const checkIfFavorite = async (bookId: string) => {
    try {
      if (!supabase || !user) return;
      
      const { data, error } = await supabase
        .from('user_books')
        .select('is_favorite')
        .eq('user_id', user.id)
        .eq('book_id', bookId)
        .single();
        
      if (error && error.code !== 'PGRST116') throw error;
      
      // Use double negation to convert to boolean
      setIsFavorite(!!((data as any)?.is_favorite));
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const toggleFavorite = async () => {
    try {
      if (!supabase || !user) {
        toast.error('Please sign in to add favorites');
        navigate('/signin');
        return;
      }
      
      if (!book) return;
      
      const { data: existing } = await supabase
        .from('user_books')
        .select('id, is_favorite')
        .eq('user_id', user.id)
        .eq('book_id', book.id)
        .single();
        
      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from('user_books')
          .update({ is_favorite: !(existing as any).is_favorite })
          .eq('id', (existing as any).id);
          
        if (error) throw error;
        
        setIsFavorite(!(existing as any).is_favorite);
        toast.success((existing as any).is_favorite ? 'Removed from favorites' : 'Added to favorites');
      } else {
        // Create new record
        const { error } = await supabase
          .from('user_books')
          .insert({
            user_id: user.id,
            book_id: book.id,
            is_favorite: true
          });
          
        if (error) throw error;
        
        setIsFavorite(true);
        toast.success('Added to favorites');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorites');
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!supabase || !user) {
        toast.error('Please sign in to leave a review');
        navigate('/signin');
        return;
      }
      
      if (!book) return;
      
      setSubmittingReview(true);
      
      const { error } = await supabase
        .from('reviews')
        .insert({
          user_id: user.id,
          book_id: book.id,
          rating: newReview.rating,
          comment: newReview.comment
        });
        
      if (error) throw error;
      
      toast.success('Review submitted successfully');
      setNewReview({ rating: 5, comment: '' });
      fetchReviews(book.id);
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleReportReview = (reviewId: string) => {
    toast.success('Review reported. Thank you for helping us maintain quality content.');
  };

  const handleShare = async () => {
    try {
      if (navigator.share && book) {
        await navigator.share({
          title: book.title,
          text: `Check out "${book.title}" by ${book.author} on WordWave`,
          url: window.location.href
        });
      } else {
        // Fallback for browsers that don't support Web Share API
        navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/books');
    }
  };

  // Add these scroll handler functions
  const handleRelatedBooksScroll = useCallback(throttle((e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    setShowLeftButton(container.scrollLeft > 0);
    
    // Check if we're near the end of the scroll to load more books
    const isNearEnd = container.scrollLeft + container.clientWidth >= 
      container.scrollWidth - 300; // 300px threshold before the end
    
    setShowRightButton(!isNearEnd || loadedCount < relatedBooks.length);
    
    // Load more books if we're near the end and haven't loaded all books yet
    if (isNearEnd && loadedCount < relatedBooks.length) {
      handleLoadMoreRelatedBooks();
    }
  }, 100), [loadedCount, relatedBooks.length]);
  
  const handleLoadMoreRelatedBooks = useCallback(() => {
    if (loadedCount >= relatedBooks.length) return;
    
    // Load next batch of books
    const nextBatch = Math.min(loadedCount + 4, relatedBooks.length);
    setLoadedCount(nextBatch);
  }, [relatedBooks.length, loadedCount]);
  
  const handleLeftScroll = useCallback(() => {
    if (relatedBooksContainerRef.current) {
      relatedBooksContainerRef.current.scrollBy({
        left: -400,
        behavior: 'smooth'
      });
    }
  }, []);
  
  const handleRightScroll = useCallback(() => {
    if (relatedBooksContainerRef.current) {
      relatedBooksContainerRef.current.scrollBy({
        left: 400,
        behavior: 'smooth'
      });
      
      // Check if we're near the end after scrolling
      setTimeout(() => {
        if (relatedBooksContainerRef.current) {
          if (relatedBooksContainerRef.current.scrollLeft + relatedBooksContainerRef.current.clientWidth >= 
              relatedBooksContainerRef.current.scrollWidth - 500) {
            handleLoadMoreRelatedBooks();
          }
        }
      }, 500);
    }
  }, [handleLoadMoreRelatedBooks]);
  
  const handleRelatedBookClick = useCallback((bookId: string) => {
    navigate(`/books/${bookId}`);
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 pt-16 flex items-center justify-center">
        <div className="flex flex-col items-center text-center px-4">
          <div className="relative">
            <LoadingSpinner size="large" color="#3B82F6" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Book className="h-6 w-6 text-blue-600 dark:text-blue-400 animate-pulse" />
            </div>
          </div>
          <p className="mt-4 text-gray-600 dark:text-gray-300 animate-pulse">Loading book details...</p>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 pt-16 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center text-center max-w-md px-4">
          <div className="bg-white dark:bg-gray-800 rounded-full p-6 shadow-lg mb-4">
            <Book className="h-16 w-16 text-gray-400 dark:text-gray-600" />
          </div>
          <h2 className="text-2xl font-bold dark:text-white mb-2">Book Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">The book you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/books')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center shadow-lg hover:shadow-xl"
          >
            <BookOpen className="h-5 w-5 mr-2" />
            Browse Books
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 pt-16">
      {/* Back Button with improved styling */}
      <button
        onClick={handleBack}
        className="fixed top-20 left-4 z-10 p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
      >
        <ArrowLeft className="h-5 w-5 dark:text-white" />
      </button>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Book Details */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
          <div className="md:flex">
            {/* Book Cover */}
            <div className="md:w-1/3 lg:w-1/4">
              <div className="rounded-lg overflow-hidden shadow-lg">
                <img
                  src={coverImageSrc}
                  alt={book.title}
                  className="w-full object-cover"
                />
              </div>
            </div>

            {/* Book Information */}
            <div className="md:w-2/3 lg:w-3/4 p-6 md:p-8">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold dark:text-white">{book.title}</h1>
                  <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mt-2">by {book.author}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={toggleFavorite}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                    aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                  >
                    <Heart
                      className={`h-6 w-6 ${
                        isFavorite ? 'fill-red-500 text-red-500' : 'dark:text-white'
                      }`}
                    />
                  </button>
                  <button 
                    onClick={handleShare}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                    aria-label="Share book"
                  >
                    <Share2 className="h-6 w-6 dark:text-white" />
                  </button>
                  <button 
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                    aria-label="Bookmark for later"
                    onClick={() => {
                      if (user) {
                        toast.success('Book added to your reading list');
                      } else {
                        toast.error('Please sign in to add to reading list');
                        navigate('/signin');
                      }
                    }}
                  >
                    <Bookmark className="h-6 w-6 dark:text-white" />
                  </button>
                </div>
              </div>

              <div className="flex items-center mt-4">
                <Star className="h-5 w-5 text-yellow-400 fill-current" />
                <span className="ml-2 text-gray-600 dark:text-gray-300">{book.rating} Rating</span>
                <span className="mx-2 text-gray-400">•</span>
                <span className="text-gray-600 dark:text-gray-300">{book.downloads?.toLocaleString() || '0'} Downloads</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Pages</p>
                  <p className="text-lg font-semibold dark:text-white">{book.page_count || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Genre</p>
                  <p className="text-lg font-semibold dark:text-white">{book.category}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">File Size</p>
                  <p className="text-lg font-semibold dark:text-white">{book.file_size || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Published</p>
                  <p className="text-lg font-semibold dark:text-white">
                    {new Date(book.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <p className="mt-6 text-gray-600 dark:text-gray-300">{book.summary}</p>

              <div className="flex flex-wrap gap-4 mt-8">
                <button 
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg transition ${
                    readUrl 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  }`}
                  onClick={() => {
                    if (readUrl) {
                      window.open(readUrl, '_blank');
                    } else {
                      toast.error('Online reading is not available for this book');
                    }
                  }}
                >
                  <Book className="h-5 w-5" />
                  Read Online
                </button>
                <button 
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg transition ${
                    downloadUrl 
                      ? 'bg-green-600 text-white hover:bg-green-700' 
                      : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  }`}
                  onClick={() => {
                    if (downloadUrl) {
                      window.open(downloadUrl, '_blank');
                      
                      // Update download count
                      if (supabase && book) {
                        supabase
                          .from('books')
                          .update({ downloads: (book.downloads || 0) + 1 })
                          .eq('id', book.id)
                          .then(() => {
                            setBook({
                              ...book,
                              downloads: (book.downloads || 0) + 1
                            });
                          });
                      }
                    } else {
                      toast.error('Download is not available for this book');
                    }
                  }}
                >
                  <Download className="h-5 w-5" />
                  Download
                </button>
              </div>

              {/* Available Formats */}
              <div className="mt-6">
                <p className="text-sm text-gray-500 dark:text-gray-400">Available Formats</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {book.formats?.map(format => (
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

          {/* Reviews Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-6 md:p-8">
            <h2 className="text-2xl font-bold dark:text-white mb-6">Reviews</h2>
            
            {/* Add Review Form */}
            {user && (
              <form onSubmit={handleSubmitReview} className="mb-8 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold dark:text-white mb-4">Write a Review</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Rating
                  </label>
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewReview({ ...newReview, rating: star })}
                        className="p-1 focus:outline-none"
                      >
                        <Star
                          className={`h-6 w-6 ${
                            star <= newReview.rating
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Comment
                  </label>
                  <textarea
                    value={newReview.comment}
                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                    placeholder="Share your thoughts about this book..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingReview ? (
                    <>
                      <LoadingSpinner size="small" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Submit Review</span>
                    </>
                  )}
                </button>
              </form>
            )}
            
            {/* Reviews List */}
            {reviews.length > 0 ? (
              <div className="space-y-6">
                {reviews.map(review => (
                  <div key={review.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold dark:text-white">{review.user_name}</p>
                      <div className="flex items-center">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= review.rating
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300 dark:text-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <p className="mt-2 text-gray-600 dark:text-gray-300">{review.comment}</p>
                    <div className="mt-2 flex justify-end">
                      <button
                        onClick={() => handleReportReview(review.id)}
                        className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 flex items-center"
                      >
                        <Flag className="h-3 w-3 mr-1" />
                        Report
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-medium dark:text-white mb-2">No reviews yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Be the first to review this book!</p>
                {!user && (
                  <button
                    onClick={() => navigate('/signin')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Sign in to leave a review
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Related Books Section */}
        <div className="mt-12 relative group">
          <h2 className="text-2xl font-bold dark:text-white mb-6">Related Books</h2>
          
          {relatedBooks.length > 0 ? (
            <>
              {/* Left scroll button */}
              <button 
                className={`absolute left-0 top-1/2 transform -translate-y-1/2 z-10 
                  bg-white/80 dark:bg-gray-800/80 rounded-full p-2 md:p-3 shadow-lg backdrop-blur-sm
                  border border-gray-200 dark:border-gray-700 
                  transition-opacity focus:outline-none will-change-transform
                  ${!showLeftButton ? 'hidden' : ''}
                  opacity-0 group-hover:opacity-100 touch-manipulation`}
                onClick={handleLeftScroll}
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </button>
              
              {/* Horizontal scrolling book list */}
              <div 
                ref={relatedBooksContainerRef}
                className="overflow-x-auto no-scrollbar pb-4 max-w-full relative" 
                style={{ 
                  scrollBehavior: "smooth", 
                  WebkitOverflowScrolling: "touch",
                  msOverflowStyle: "none"
                }}
                onScroll={handleRelatedBooksScroll}
              >
                <div className="flex gap-4 w-max pl-2 pr-2">
                  {visibleRelatedBooks.map(book => (
                    <div key={book.id} className="flex-shrink-0">
                      <RelatedBookCard book={book} onBookClick={handleRelatedBookClick} />
                    </div>
                  ))}
                  
                  {/* Loading indicator for more books */}
                  {loadedCount < relatedBooks.length && (
                    <div className="flex-shrink-0 flex items-center justify-center w-48 md:w-56 h-72">
                      <div className="p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                        <LoadingSpinner size="small" color="#3B82F6" />
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading more...</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Right scroll button */}
              <button 
                className={`absolute right-0 top-1/2 transform -translate-y-1/2 z-10
                  bg-white/80 dark:bg-gray-800/80 rounded-full p-2 md:p-3 shadow-lg backdrop-blur-sm
                  border border-gray-200 dark:border-gray-700 
                  transition-opacity focus:outline-none will-change-transform
                  ${!showRightButton ? 'hidden' : ''}
                  opacity-0 group-hover:opacity-100 hover:opacity-100 touch-manipulation`}
                onClick={handleRightScroll}
                aria-label="Scroll right"
              >
                <ChevronRight className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </button>
            </>
          ) : (
            <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-lg">
              <Book className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-medium dark:text-white mb-2">No related books found</h3>
              <p className="text-gray-600 dark:text-gray-400">
                We couldn't find any books related to this one.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookDetails;
