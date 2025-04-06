import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, Filter, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { searchBooks, Book } from '../lib/books';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

interface SearchBarProps {
  onSearch: (query: string, results?: Book[]) => void;
  placeholder?: string;
}

interface SearchFilters {
  category: string;
  format: string[];
  rating: number;
  yearRange: [number, number];
  language: string;
}

const currentYear = new Date().getFullYear();

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = 'Search by title or author...'
}) => {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showAISearch, setShowAISearch] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [aiSearchLoading, setAiSearchLoading] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    category: 'All',
    format: [],
    rating: 0,
    yearRange: [1900, currentYear],
    language: 'All'
  });
  const [isSearching, setIsSearching] = useState(false);

  const filterRef = useRef<HTMLDivElement>(null);
  const aiSearchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
      if (aiSearchRef.current && !aiSearchRef.current.contains(event.target as Node)) {
        setShowAISearch(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        onSearch('');
        return;
      }
      
      setIsSearching(true);
      
      try {
        if (!supabase) throw new Error('Supabase client not initialized');

        // Convert query to lowercase for consistent matching
        const normalizedQuery = searchQuery.toLowerCase();

        // Use %query% to match anywhere in text, not just at the beginning
        const { data, error } = await supabase
          .from('books')
          .select('*')
          .or(`title.ilike.%${normalizedQuery}%,author.ilike.%${normalizedQuery}%`)
          .order('title', { ascending: true })
          .limit(50);

        if (error) throw error;
        
        // Fix TypeScript error by explicitly typing the results
        const typedResults = data as unknown as Book[];
        onSearch(searchQuery, typedResults);
      } catch (error) {
        console.error('Search error:', error);
        onSearch(searchQuery, []);
      } finally {
        setIsSearching(false);
      }
    }, 300), // 300ms debounce delay
    [onSearch]
  );

  const handleSearch = () => {
    debouncedSearch(query);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearSearch = () => {
    setQuery('');
    setFilters({
      category: 'All',
      format: [],
      rating: 0,
      yearRange: [1900, currentYear],
      language: 'All'
    });
    onSearch('');
  };

  const handleAISearch = async () => {
    if (!aiQuery.trim()) return;
    
    setIsProcessingAI(true);
    setAiSearchLoading(true);
    
    try {
      // N8N Webhook URL
      const webhookUrl = 'https://guuusgostavo.app.n8n.cloud/webhook-test/7e40520b-8e1e-4c2d-8a27-231b3b5f8384';
      
      // Set a timeout for the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      // Fetch with retry logic
      let attempts = 0;
      const maxAttempts = 2;
      let responseText = '';
      let success = false;
      
      while (attempts < maxAttempts && !success) {
        attempts++;
        try {
          console.log(`AI Search attempt ${attempts}/${maxAttempts}`);
          // Send POST request to n8n webhook
          const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
              chatInput: aiQuery,
              sessionId: `session_${Date.now()}` // Add a unique session ID
            }),
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(`Failed to get response from AI: ${response.status}`);
          }
          
          // Check if response is empty
          responseText = await response.text();
          if (!responseText || responseText.trim() === '') {
            console.warn('Empty response from webhook, attempt', attempts);
            if (attempts >= maxAttempts) {
              toast.error('AI search returned an empty response. Please try again.');
              onSearch(aiQuery, []);
              return;
            }
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
          
          success = true;
        } catch (fetchError) {
          console.error(`Fetch error on attempt ${attempts}:`, fetchError);
          if (attempts >= maxAttempts) {
            if (fetchError.name === 'AbortError') {
              toast.error('AI search timed out. Please try again later.');
            } else {
              console.error('AI search fetch error:', fetchError);
              toast.error(`AI search failed: ${fetchError.message}`);
            }
            onSearch(aiQuery, []);
            return;
          }
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      if (!success) {
        toast.error('Unable to connect to AI service after multiple attempts');
        return;
      }
      
      // Parse the response data
      let books;
      try {
        books = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError, 'Response was:', responseText);
        toast.error('Invalid response format from AI search');
        onSearch(aiQuery, []);
        return;
      }
      
      // Process the webhook response using the helper function
      const transformedBooks = processWebhookResponse(books);
      
      // If the n8n webhook returned books, pass them to the onSearch function
      if (transformedBooks.length > 0) {
        // Set the query to the AI search term and pass the AI-generated results
        setQuery(aiQuery);
        onSearch(aiQuery, transformedBooks);
      setShowAISearch(false);
      
        toast.success(`Found ${transformedBooks.length} books matching your AI search!`);
      } else {
        // If no books returned, show a message
        toast.info('No books found matching your criteria. Try a different search.');
        onSearch(aiQuery, []);
      }
    } catch (error) {
      console.error('AI search error:', error);
      toast.error('AI search failed. Please try again.');
      onSearch(aiQuery, []);
    } finally {
      setIsProcessingAI(false);
      setAiSearchLoading(false);
    }
  };

  // Effect to trigger search when query changes
  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  return (
    <div className="relative w-full max-w-3xl">
      <div className="relative flex items-center">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            aria-label="Search books"
            className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white shadow-sm"
          />
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          {isSearching && (
            <div className="absolute right-3 top-3 animate-spin">
              <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          )}
          {query && !isSearching && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Clear search"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAISearch(!showAISearch)}
          className="ml-2 p-2.5 rounded-lg bg-purple-100 dark:bg-purple-900 hover:bg-purple-200 dark:hover:bg-purple-800 text-purple-600 dark:text-purple-300 shadow-sm transition-all"
          title="AI-powered search"
          aria-label="AI search"
        >
          <Sparkles className="h-5 w-5" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowFilters(!showFilters)}
          className="ml-2 p-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 shadow-sm transition-all"
          aria-label="Filter search"
        >
          <Filter className="h-5 w-5 dark:text-white" />
        </motion.button>
      </div>

      {/* Display loading state outside the panel if AI search is in progress */}
      {aiSearchLoading && !showAISearch && (
        <div className="absolute mt-2 w-full flex items-center justify-center py-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-purple-700 dark:text-purple-300">AI is searching for books...</span>
          </div>
        </div>
      )}

      {/* AI Search Panel */}
      <AnimatePresence>
        {showAISearch && (
          <motion.div
            ref={aiSearchRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="p-4">
              <div className="flex items-center mb-4">
                <Sparkles className="h-5 w-5 text-purple-500 mr-2" />
                <h3 className="text-lg font-semibold dark:text-white">AI-Powered Search</h3>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Search for books using natural language. Our AI will find the best matches for you.
              </p>
              
              <div className="space-y-2 mb-4">
                <div className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded text-gray-700 dark:text-gray-300">
                  "philosophy books about existentialism"
                </div>
                <div className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded text-gray-700 dark:text-gray-300">
                  "self-improvement books on productivity"
                </div>
                <div className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded text-gray-700 dark:text-gray-300">
                  "classic novels with strong female characters"
                </div>
              </div>
              
              <div className="mb-4">
                <textarea
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  placeholder="What kind of books are you looking for?"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={() => setShowAISearch(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg mr-2"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleAISearch}
                  disabled={isProcessingAI || !aiQuery.trim()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isProcessingAI ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Search with AI
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            ref={filterRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  aria-label="Category filter"
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2 text-gray-900 dark:text-white"
                >
                  <option value="All">All Categories</option>
                  <option value="Fiction">Fiction</option>
                  <option value="Non-Fiction">Non-Fiction</option>
                  <option value="Science">Science</option>
                  <option value="Technology">Technology</option>
                  <option value="Business">Business</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Format
                </label>
                <div className="flex flex-wrap gap-2">
                  {['PDF', 'EPUB', 'MOBI'].map(format => (
                    <button
                      key={format}
                      onClick={() => {
                        const newFormats = filters.format.includes(format)
                          ? filters.format.filter(f => f !== format)
                          : [...filters.format, format];
                        setFilters({ ...filters, format: newFormats });
                      }}
                      className={`px-3 py-1 rounded-full text-sm ${
                        filters.format.includes(format)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {format}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Minimum Rating
                </label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map(rating => (
                    <button
                      key={rating}
                      onClick={() => setFilters({ ...filters, rating })}
                      className={`p-2 rounded-lg ${
                        filters.rating === rating
                          ? 'bg-yellow-400 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Language
                </label>
                <select
                  aria-label="Language filter"
                  value={filters.language}
                  onChange={(e) => setFilters({ ...filters, language: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2 text-gray-900 dark:text-white"
                >
                  <option value="All">All Languages</option>
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="German">German</option>
                  <option value="Chinese">Chinese</option>
                  <option value="Japanese">Japanese</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  onClick={clearSearch}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Clear All
                </button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    handleSearch();
                    setShowFilters(false);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Apply Filters
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Helper function to validate webhook response data
const processWebhookResponse = (data: any): any[] => {
  if (!Array.isArray(data)) {
    console.warn('Unexpected webhook response format:', data);
    // If data is not an array but has a message property (common in API responses)
    if (data && typeof data === 'object' && data.message) {
      console.log('Received message from API:', data.message);
    }
    return [];
  }
  
  // If the array is empty, return an empty array
  if (data.length === 0) return [];
  
  // Map and validate each book object
  return data.filter(book => {
    // Basic validation - must have at least a title
    return book && typeof book === 'object' && book.title;
  }).map((book, index) => ({
    id: `ai-book-${index}`,
    title: book.title || 'Unknown Title',
    author: book.author || 'Unknown Author',
    cover_url: book.cover || '',
    summary: book.summary || '',
    category: book.category || 'AI Recommendations',
    rating: book.rating || 4,
    downloads: 0,
    likes_count: 0,
    formats: book.formats || ['PDF'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));
};

// Debounce utility function
function debounce<F extends (...args: any[]) => any>(func: F, wait: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<F>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default SearchBar;