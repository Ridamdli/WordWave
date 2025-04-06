import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { flushSync } from 'react-dom';
import { Search, Filter, BookOpen, Download, Star, Heart, X, Menu, ChevronRight, ArrowLeft, Grid, LayoutGrid } from 'lucide-react';
import SearchBar from './SearchBar';
import LoadingSpinner from './LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { fetchBooks, Book, getBookCoverUrl, toggleLike, checkIfLiked } from '../lib/books';
import { useImageWithFallback } from '../lib/hooks';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import '../styles/scrollbars.css';
import { supabase } from '../lib/supabase';
// existing imports ...
import Chatbox from './Chatbox'; // Import Chatbox component
import './Chatbox.css'; // Import Chatbox CSS
// Book Card Component - Extracted to fix hooks issue and optimized with React.memo for performance
const BookCard = React.memo(({ book, onBookClick }: { book: Book, onBookClick: (id: string) => void }) => {
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
      // Structured logging
      const logInfo = {
        component: 'BookCard',
        action: 'checkLikeStatus',
        bookId: book.id,
        timestamp: new Date().toISOString(),
        errorType: error instanceof Error ? error.constructor.name : 'Unknown'
      };
      console.error(JSON.stringify(logInfo));
      
      // User-facing error is handled in the UI without showing technical details
      toast.error('Unable to check favorite status');
    } finally {
      setIsLoading(false);
    }
  };

  // Direct navigation handler for authentication - memoized to prevent recreating on each render
  const handleAuthRedirect = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  // Optimize event handlers with useCallback to prevent recreating on each render
  const handleCardClick = useCallback(() => {
    onBookClick(book.id);
  }, [book.id, onBookClick]);

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
          const logInfo = {
            component: 'BookCard',
            action: 'handleDownloadClick.updateDownloadCount',
            bookId: book.id,
            timestamp: new Date().toISOString(),
            errorType: 'Supabase Error'
          };
          console.error(JSON.stringify(logInfo));
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
          const logInfo = {
            component: 'BookCard',
            action: 'handleDownloadClick.recordDownload',
            bookId: book.id,
            userId: user.id,
            timestamp: new Date().toISOString(),
            errorType: 'Supabase Error'
          };
          console.error(JSON.stringify(logInfo));
        }
        
        toast.success(`Downloading ${book.title}...`);
      } else {
        toast.error('Download link not available');
      }
    } catch (error) {
      const logInfo = {
        component: 'BookCard',
        action: 'handleDownloadClick',
        bookId: book.id,
        timestamp: new Date().toISOString(),
        errorType: error instanceof Error ? error.constructor.name : 'Unknown'
      };
      console.error(JSON.stringify(logInfo));
      
      toast.error('Failed to download book');
    } finally {
      setIsLoading(false);
    }
  }, [book.id, book.title, book.downloads, user, handleAuthRedirect]);

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
      console.error('Error opening book for reading:', error);
      toast.error('Failed to open book for reading');
    } finally {
      setIsLoading(false);
    }
  }, [book.id, book.title]);

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
      console.error('Error toggling favorite:', error);
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
        // Add hardware acceleration for smoother animations
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
            decoding="async" // Add async decoding for performance
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
}, (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  return prevProps.book.id === nextProps.book.id && 
         prevProps.book.likes_count === nextProps.book.likes_count;
});

// Category Component - Extracted to fix hooks issue and optimized
const CategorySection = React.memo(({ 
  category, 
  books, 
  scrollContainerRefs,
  onBookClick, 
  onViewAll,
  isActiveCategory
}: { 
  category: string, 
  books: Book[], 
  scrollContainerRefs: React.MutableRefObject<{[key: string]: HTMLDivElement | null}>,
  onBookClick: (id: string) => void,
  onViewAll: (category: string) => void,
  isActiveCategory: boolean
}) => {
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(true);
  
  // Add state for lazy loading
  const [visibleBooks, setVisibleBooks] = useState<Book[]>([]);
  const [loadedCount, setLoadedCount] = useState(8); // Initial number of books to load
  
  // Memoize the visible books to prevent unnecessary recalculations
  const memoizedVisibleBooks = useMemo(() => {
    return books.slice(0, loadedCount);
  }, [books, loadedCount]);
  
  // Load initial books when component mounts - with books dependency for updates
  useEffect(() => {
    setVisibleBooks(memoizedVisibleBooks);
  }, [memoizedVisibleBooks]);
  
  // Handle loading more books when we reach end of scroll - memoized
  const handleLoadMore = useCallback(() => {
    if (loadedCount >= books.length) return;
    
    // Load next batch of books with a slight delay for smoother UX
    setTimeout(() => {
      // Calculate how many more books to load based on screen size
      const batchSize = window.innerWidth < 768 ? 4 : 6;
      const nextBatch = Math.min(loadedCount + batchSize, books.length);
      
      setLoadedCount(nextBatch);
      
      // After loading more books, ensure the new ones are visible
      // by scrolling slightly further right
      requestAnimationFrame(() => {
        const scrollContainer = scrollContainerRefs.current[category];
        if (scrollContainer) {
          const isNearEnd = scrollContainer.scrollLeft + scrollContainer.clientWidth >= 
            scrollContainer.scrollWidth - 300;
            
          if (isNearEnd) {
            scrollContainer.scrollBy({
              left: 200,
              behavior: 'smooth'
            });
          }
        }
      });
    }, 100);
  }, [books.length, loadedCount, category, scrollContainerRefs]);
  
  // Use the ref setter function to store the element reference - memoized
  const setScrollContainerRef = useCallback((element: HTMLDivElement | null) => {
    if (element && scrollContainerRefs.current) {
      scrollContainerRefs.current[category] = element;
      
      // Check if scroll buttons should be visible when the ref is assigned
      setShowRightButton(element.scrollWidth > element.clientWidth);
      setShowLeftButton(element.scrollLeft > 0);
    }
  }, [category, scrollContainerRefs]);
  
  // Throttled scroll handler to improve performance
  const handleScroll = useMemo(() => {
    return throttle((e: React.UIEvent<HTMLDivElement>) => {
      const container = e.currentTarget;
      
      // Detect left button visibility
      setShowLeftButton(container.scrollLeft > 20);
      
      // Calculate if we're near the right edge
      // Allow a 40px buffer to ensure the last items can be seen completely
      const isAtRightEdge = (container.scrollLeft + container.clientWidth) >= 
        (container.scrollWidth - 40);
      
      setShowRightButton(!isAtRightEdge);
      
      // Load more books if we're near the end and haven't loaded all books yet
      if (isAtRightEdge && loadedCount < books.length) {
        handleLoadMore();
      }
    }, 100); // 100ms throttle
  }, [books.length, handleLoadMore, loadedCount]);
  
  // Memoize button click handlers and improve scroll behavior
  const handleLeftScroll = useCallback(() => {
    const scrollContainer = scrollContainerRefs.current[category];
    if (scrollContainer) {
      // Calculate scroll amount based on container width
      const scrollAmount = Math.min(scrollContainer.clientWidth * 0.8, 500);
      
      scrollContainer.scrollBy({
        left: -scrollAmount,
        behavior: 'smooth'
      });
    }
  }, [category, scrollContainerRefs]);
  
  const handleRightScroll = useCallback(() => {
    const scrollContainer = scrollContainerRefs.current[category];
    if (scrollContainer) {
      // Calculate scroll amount based on container width
      const scrollAmount = Math.min(scrollContainer.clientWidth * 0.8, 500);
      
      scrollContainer.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
      
      // Check if we're near the end after scrolling
      setTimeout(() => {
        if (scrollContainer.scrollLeft + scrollContainer.clientWidth >= 
            scrollContainer.scrollWidth - 100) {
          handleLoadMore();
        }
      }, 500);
    }
  }, [category, handleLoadMore, scrollContainerRefs]);
  
  // Ensure the category click is handled directly and works with a single click
  const handleCategoryClick = useCallback((e: React.MouseEvent) => {
    // Prevent default browser behavior that causes page refresh
    if (e && e.preventDefault) e.preventDefault();
    
    // Stop event bubbling to parent elements
    if (e && e.stopPropagation) e.stopPropagation();
    
    // We need to capture and stop the event immediately before any other logic
    if (e && e.nativeEvent) e.nativeEvent.stopImmediatePropagation();
    
    // Directly call onViewAll with the category for immediate action
    onViewAll(category);
  }, [category, onViewAll]);
  
  return (
    <motion.div 
      key={category}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-6 relative group"
    >
      {/* Category Title */}
      <div className="flex justify-between items-center mb-4 px-1">
        <motion.button 
          onClick={handleCategoryClick}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="text-xl font-semibold dark:text-white hover:text-blue-500 dark:hover:text-blue-400 transition-colors flex items-center cursor-pointer"
          type="button"
        >
          {category}
          <ChevronRight className="ml-2 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.button>
      </div>
      
      {/* Left scroll button - larger hit area on mobile */}
      <button 
        className={`absolute left-0 top-1/2 transform -translate-y-1/2 z-10 
          bg-white/90 dark:bg-gray-800/90 rounded-full p-2 md:p-3 shadow-lg backdrop-blur-sm
          border border-gray-200 dark:border-gray-700 
          transition-opacity focus:outline-none will-change-transform
          ${!showLeftButton ? 'opacity-0 pointer-events-none' : 'opacity-90'}
          md:group-hover:opacity-100 hover:opacity-100 touch-manipulation`}
        onClick={handleLeftScroll}
        aria-label="Scroll left"
      >
        <ArrowLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
      </button>
      
      {/* Horizontal scrolling book list with improved scroll behavior */}
      <div 
        ref={setScrollContainerRef}
        className="overflow-x-auto pb-4 max-w-full relative scroll-smooth" 
        style={{ 
          scrollBehavior: "smooth", 
          WebkitOverflowScrolling: "touch",
          msOverflowStyle: "none",
          scrollPaddingRight: "50px", // Reduce padding since "View All" button is removed
          scrollPaddingLeft: "16px",
          // Add scrollbar styling for browsers that support it
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(156, 163, 175, 0.5) transparent"
        }}
        onScroll={handleScroll}
      >
        <div className="flex gap-4 w-max pl-2 pr-8">
          {visibleBooks.map(book => (
            <div key={book.id} className="flex-shrink-0">
              <BookCard book={book} onBookClick={onBookClick} />
            </div>
          ))}
          
          {/* Loading indicator for more books */}
          {loadedCount < books.length && (
            <div className="flex-shrink-0 flex items-center justify-center w-48 md:w-56 h-72">
              <div className="p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                <LoadingSpinner size="small" color="#3B82F6" />
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading more...</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Right scroll button - larger hit area on mobile */}
      <button 
        className={`absolute right-0 top-1/2 transform -translate-y-1/2 z-10
          bg-white/90 dark:bg-gray-800/90 rounded-full p-2 md:p-3 shadow-lg backdrop-blur-sm
          border border-gray-200 dark:border-gray-700 
          transition-opacity focus:outline-none will-change-transform
          ${!showRightButton ? 'opacity-0 pointer-events-none' : 'opacity-90'}
          md:group-hover:opacity-100 hover:opacity-100 touch-manipulation`}
        onClick={handleRightScroll}
        aria-label="Scroll right"
      >
        <ChevronRight className="h-5 w-5 text-gray-700 dark:text-gray-300" />
      </button>
    </motion.div>
  );
});

// Add throttle utility function
function throttle<F extends (...args: any[]) => any>(func: F, wait: number) {
  let lastCall = 0;
  return function(...args: Parameters<F>) {
    const now = Date.now();
    if (now - lastCall < wait) return;
    lastCall = now;
    return func(...args);
  };
}

interface BrowseLibraryProps {
  onBookClick?: (bookId: string) => void;
}

const categories = [
  'All Categories',
  'Fiction',
  'Science',
  'Business',
  'History',
  'Technology',
  'Arts',
  'Philosophy',
  'Self-Help'
];

const formats = ['PDF', 'EPUB', 'Audiobook'];

const BrowseLibrary: React.FC<BrowseLibraryProps> = ({ onBookClick }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [booksByCategory, setBooksByCategory] = useState<{[key: string]: Book[]}>({});
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'horizontal' | 'vertical'>('horizontal');
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });
  
  // Store all scroll container refs in a single ref object
  const scrollContainerRefs = useRef<{[key: string]: HTMLDivElement | null}>({});

  useEffect(() => {
    loadBooks();
    
    // Close sidebar on larger screens, open on smaller screens
    const handleResize = throttle(() => {
      setIsSidebarOpen(window.innerWidth >= 1024);
      
      // Also check all scroll containers to update the scroll buttons visibility
      Object.keys(scrollContainerRefs.current).forEach(category => {
        const container = scrollContainerRefs.current[category];
        if (container) {
          // Dispatch a scroll event to update button visibility states
          container.dispatchEvent(new Event('scroll'));
        }
      });
    }, 100); // Throttle to 100ms
    
    // Set initial state
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Memoized function to create category map
  const createCategoryMap = useCallback((fetchedBooks: Book[]) => {
    const map: {[key: string]: Book[]} = {};
    fetchedBooks.forEach(book => {
      if (!book.category) return;
      
      if (!map[book.category]) {
        map[book.category] = [];
      }
      map[book.category].push(book);
    });
    return map;
  }, []);

  // Update filter function to properly update booksByCategory as well
  const applyFilters = useCallback((
    booksToFilter: Book[], 
    query: string, 
    category: string, 
    formats: string[]
  ) => {
    // Use a single filter pass for better performance
    const filtered = booksToFilter.filter(book => {
      // Apply category filter if not "All Categories"
      if (category !== 'All Categories' && book.category !== category) {
        return false;
      }
      
      // Apply format filters if any are selected
      if (formats.length > 0) {
        const bookFormats = book.formats || [];
        if (!formats.some(format => bookFormats.includes(format))) {
          return false;
        }
      }
      
      // Apply search filter if query exists
      if (query) {
        const bookTitle = book.title.toLowerCase();
        const bookAuthor = book.author.toLowerCase();
        const bookCategory = (book.category || '').toLowerCase();
        const searchLower = query.toLowerCase();
        
        return bookTitle.includes(searchLower) || 
               bookAuthor.includes(searchLower) || 
               bookCategory.includes(searchLower);
      }
      
      return true;
    });
    
    setFilteredBooks(filtered);
  }, []);

  const loadBooks = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedBooks = await fetchBooks();
      setBooks(fetchedBooks);

      // Group books by category - using the memoized function instead of nested useMemo
      const categoryMap = createCategoryMap(fetchedBooks);
      
      setBooksByCategory(categoryMap);
      applyFilters(fetchedBooks, searchQuery, selectedCategory, selectedFormats);
    } catch (error) {
      const logInfo = {
        component: 'BrowseLibrary',
        action: 'loadBooks',
        timestamp: new Date().toISOString(),
        errorType: error instanceof Error ? error.constructor.name : 'Unknown'
      };
      console.error(JSON.stringify(logInfo));
      
      toast.error('Failed to load books');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedFormats, createCategoryMap, applyFilters]);

  const handleSearch = useCallback((query: string, results?: Book[]) => {
    setSearchQuery(query);
    
    // If results are provided directly from the search component, use them
    if (results) {
      // Apply category and format filters to the search results
      applyFilters(results, query, selectedCategory, selectedFormats);
      
      // When searching, switch to vertical view for better results display
      if (query) {
        setViewMode('vertical');
      }
    } else if (!query) {
      // If query is cleared, revert to all books with other filters applied
      applyFilters(books, '', selectedCategory, selectedFormats);
      setViewMode('horizontal');
    }
  }, [books, selectedCategory, selectedFormats]);

  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category);
    applyFilters(books, searchQuery, category, selectedFormats);
  }, [books, searchQuery, selectedFormats]);

  const handleFormatToggle = useCallback((format: string) => {
    const newFormats = selectedFormats.includes(format)
      ? selectedFormats.filter(f => f !== format)
      : [...selectedFormats, format];
    
    setSelectedFormats(newFormats);
    applyFilters(books, searchQuery, selectedCategory, newFormats);
  }, [books, searchQuery, selectedCategory, selectedFormats]);

  const handleBookClick = useCallback((bookId: string) => {
    if (onBookClick) {
      onBookClick(bookId);
    } else {
      navigate(`/books/${bookId}`);
    }
  }, [navigate, onBookClick]);

  // Memoized navigation handler for authentication
  const handleAuthRedirect = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  // Add a force update function using useState trick
  const [, forceRender] = useState({});
  const forceUpdate = useCallback(() => {
    forceRender({});
  }, []);

  // Optimize category selection for a smooth transition to grid view
  const directCategorySelect = useCallback((category: string) => {
    // Handle the state updates in a specific order for smoother transitions
    
    // First update the category selection
    setSelectedCategory(category);
    
    // Then change the view mode with a smooth transition
    setViewMode('vertical');
    
    // Apply filters with the selected category
    applyFilters(books, searchQuery, category, selectedFormats);
    
    // Scroll to top with smooth animation for better UX
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
  }, [books, searchQuery, selectedFormats, applyFilters]);

  // Add handler for view mode toggle
  const handleViewModeToggle = useCallback(() => {
    setViewMode(prev => prev === 'horizontal' ? 'vertical' : 'horizontal');
    // Reset category selection when switching back to horizontal view
    if (viewMode === 'vertical') {
      setSelectedCategory('All Categories');
    }
  }, [viewMode]);

  // Memoize the horizontal view rendering to improve performance
  const renderHorizontalCategoryView = useCallback(() => {
    if (Object.keys(booksByCategory).length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-300">No books found in any category.</p>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        {Object.entries(booksByCategory).map(([category, books]) => (
          <CategorySection
            key={category}
            category={category}
            books={books}
            scrollContainerRefs={scrollContainerRefs}
            onBookClick={handleBookClick}
            onViewAll={directCategorySelect} // Use the new direct handler here
            isActiveCategory={selectedCategory === category}
          />
        ))}
      </div>
    );
  }, [booksByCategory, handleBookClick, directCategorySelect, selectedCategory]);

  // Ensure consistent handling of the vertical book grid
  const renderVerticalBookGrid = useCallback(() => {
    if (filteredBooks.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <BookOpen className="h-16 w-16 text-gray-400 dark:text-gray-600 mb-4" />
          <h3 className="text-xl font-semibold dark:text-white mb-2">No books found</h3>
          <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
            We couldn't find any books matching your criteria. Try adjusting your filters or search query.
          </p>
        </div>
      );
    }
    
    return (
      <>
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setSelectedCategory('All Categories');
                setViewMode('horizontal');
                // Apply filters to show all books when going back
                applyFilters(books, searchQuery, 'All Categories', selectedFormats);
              }}
              className="flex items-center px-4 py-2 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600 shadow-sm"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Categories
            </motion.button>
            <h2 className="text-xl font-semibold dark:text-white">
              {selectedCategory} • {filteredBooks.length} {filteredBooks.length === 1 ? 'Book' : 'Books'}
            </h2>
          </div>
        </div>
        
        <motion.div
          ref={ref}
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {filteredBooks.map(book => (
            <BookCard key={book.id} book={book} onBookClick={handleBookClick} />
          ))}
        </motion.div>
      </>
    );
  }, [filteredBooks, handleBookClick, inView, ref, selectedCategory, books, searchQuery, selectedFormats, applyFilters]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 pt-16 overflow-x-hidden">
      {/* Search bar with fixed positioning using the new CSS class */}
      <div className="fixed-search-container bg-white/95 dark:bg-gray-800/95 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="w-full md:w-1/2 lg:w-2/5">
              <SearchBar onSearch={handleSearch} />
            </div>
            <div className="flex items-center gap-2 self-end md:self-auto">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleViewModeToggle}
                className="p-2.5 bg-white dark:bg-gray-700 rounded-lg flex items-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600 shadow-sm"
                title={viewMode === 'horizontal' ? 'Switch to Grid View' : 'Switch to Category View'}
              >
                {viewMode === 'horizontal' ? (
                  <Grid className="h-5 w-5" />
                ) : (
                  <LayoutGrid className="h-5 w-5" />
                )}
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2.5 bg-white dark:bg-gray-700 rounded-lg lg:hidden flex items-center hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600 shadow-sm"
              >
                <Filter className="h-5 w-5 mr-2 dark:text-white" />
                <span className="dark:text-white">Filters</span>
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content with appropriate spacing to prevent overlap */}
      <div className="content-with-fixed-header max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        <div className="flex gap-8 relative">
          {/* Mobile Sidebar Overlay */}
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden backdrop-blur-sm"
                onClick={() => setIsSidebarOpen(false)}
              />
            )}
          </AnimatePresence>

          {/* Sidebar with better positioning to account for fixed header */}
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: -100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed top-0 left-0 h-full w-3/4 sm:w-1/2 md:w-1/3 bg-white dark:bg-gray-800 z-40 pt-48 px-4 overflow-y-auto lg:static lg:h-auto lg:w-64 lg:flex-shrink-0 lg:pt-0 lg:px-0 lg:z-0 lg:sticky lg:top-48 lg:max-h-[calc(100vh-192px)] shadow-xl lg:shadow-lg rounded-r-xl lg:rounded-xl border-r lg:border border-gray-200 dark:border-gray-700"
              >
                <motion.button 
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsSidebarOpen(false)}
                  className="absolute top-40 right-4 p-2 rounded-full bg-gray-200 dark:bg-gray-700 lg:hidden hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  <X className="h-5 w-5 dark:text-white" />
                </motion.button>
                
                <div className="lg:pb-8">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-4 dark:text-white flex items-center">
                      <Filter className="h-5 w-5 mr-2 text-blue-500" />
                      Categories
                    </h2>
                    <div className="space-y-2">
                      {categories.map(category => (
                        <motion.button
                          key={category}
                          whileHover={{ scale: 1.02, x: 3 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            handleCategoryChange(category);
                            if (window.innerWidth < 1024) setIsSidebarOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 rounded-lg transition-all ${
                            selectedCategory === category
                              ? 'bg-blue-500 text-white font-medium shadow-md'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {category}
                        </motion.button>
                      ))}
                    </div>

                    <h2 className="text-xl font-semibold mt-8 mb-4 dark:text-white flex items-center">
                      <Download className="h-5 w-5 mr-2 text-green-500" />
                      Format
                    </h2>
                    <div className="space-y-2">
                      {formats.map(format => (
                        <motion.button
                          key={format}
                          whileHover={{ scale: 1.02, x: 3 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleFormatToggle(format)}
                          className={`w-full text-left px-4 py-2.5 rounded-lg transition-all ${
                            selectedFormats.includes(format)
                              ? 'bg-blue-500 text-white font-medium shadow-md'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {format}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Books Section - Improve loading state and empty states */}
          <div className="flex-1 relative w-full">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-64">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <LoadingSpinner size="large" color="#3B82F6" />
                </motion.div>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="mt-4 text-gray-600 dark:text-gray-300 text-center"
                >
                  Loading amazing books for you...
                </motion.p>
              </div>
            ) : viewMode === 'horizontal' ? (
              <div className="w-full">
                {renderHorizontalCategoryView()}
              </div>
            ) : (
              renderVerticalBookGrid()
            )}
          </div>
        </div>
      </div>
      
      {/* Chatbox Component */}
      <Chatbox />
    </div>
  );
};

export default BrowseLibrary;