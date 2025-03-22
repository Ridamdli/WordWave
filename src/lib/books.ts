import { supabase, getSupabase, getStorageOptions } from './supabase';

export interface Book {
  id: string;
  title: string;
  author: string;
  cover_url: string;
  summary: string;
  category: string;
  rating: number;
  downloads: number;
  likes_count: number;
  formats: string[];
  created_at: string;
  updated_at: string;
}

export interface UserBook {
  id: string;
  user_id: string;
  book_id: string;
  progress: number;
  is_favorite: boolean;
  is_saved: boolean;
  last_read: string;
  created_at: string;
  book?: Book;
}

export interface BookLink {
  id: string;
  book_id: string;
  download_url: string;
  read_url: string;
  created_at: string;
}

export interface Review {
  id: string;
  user_id: string;
  book_id: string;
  rating: number;
  comment: string;
  created_at: string;
  user?: {
    email: string;
    user_metadata?: {
      username?: string;
    };
  };
}

export const fetchBooks = async (): Promise<Book[]> => {
  if (!supabase) throw new Error('Supabase client not initialized');
  
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const fetchBookById = async (id: string): Promise<Book> => {
  if (!supabase) throw new Error('Supabase client not initialized');
  
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

export const toggleLike = async (userId: string, bookId: string): Promise<boolean> => {
  if (!supabase) throw new Error('Supabase client not initialized');

  const { data: existing } = await supabase
    .from('user_likes')
    .select('id')
    .eq('user_id', userId)
    .eq('book_id', bookId)
    .single();

  if (existing) {
    const { error } = await supabase
      .from('user_likes')
      .delete()
      .eq('id', existing.id);

    if (error) throw error;
    return false;
  } else {
    const { error } = await supabase
      .from('user_likes')
      .insert({ user_id: userId, book_id: bookId });

    if (error) throw error;
    return true;
  }
};

export const checkIfLiked = async (userId: string, bookId: string): Promise<boolean> => {
  if (!supabase) throw new Error('Supabase client not initialized');

  const { data } = await supabase
    .from('user_likes')
    .select('id')
    .eq('user_id', userId)
    .eq('book_id', bookId)
    .single();

  return !!data;
};

export const toggleSave = async (userId: string, bookId: string): Promise<boolean> => {
  if (!supabase) throw new Error('Supabase client not initialized');

  const { data: existing } = await supabase
    .from('user_books')
    .select('id, is_saved')
    .eq('user_id', userId)
    .eq('book_id', bookId)
    .single();

  if (existing) {
    const newSavedState = !existing.is_saved;
    const { error } = await supabase
      .from('user_books')
      .update({ is_saved: newSavedState })
      .eq('id', existing.id);

    if (error) throw error;
    return newSavedState;
  } else {
    const { error } = await supabase
      .from('user_books')
      .insert({
        user_id: userId,
        book_id: bookId,
        is_saved: true
      });

    if (error) throw error;
    return true;
  }
};

export const checkIfSaved = async (userId: string, bookId: string): Promise<boolean> => {
  if (!supabase) throw new Error('Supabase client not initialized');

  const { data } = await supabase
    .from('user_books')
    .select('is_saved')
    .eq('user_id', userId)
    .eq('book_id', bookId)
    .single();

  return data?.is_saved || false;
};

/**
 * Search books by title or author with case-insensitive matching
 * @param query Search query string
 * @returns Matching books array
 */
export const searchBooks = async (query: string): Promise<Book[]> => {
  if (!supabase) throw new Error('Supabase client not initialized');
  
  if (!query.trim()) return [];
  
  // Normalize the query to lowercase for consistent matching
  const normalizedQuery = query.toLowerCase();
  
  // Use %query% to match anywhere in the text, not just at the beginning
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .or(`title.ilike.%${normalizedQuery}%,author.ilike.%${normalizedQuery}%`)
    .order('title', { ascending: true })
    .limit(50);

  if (error) throw error;
  return data;
};

/**
 * Utility function to get the properly formatted cover URL
 * Handles both relative storage URLs and absolute URLs
 */
export const getBookCoverUrl = (coverUrl: string | null): string => {
  const DEFAULT_COVER = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80';
  
  if (!coverUrl) {
    return DEFAULT_COVER;
  }
  
  // Handle Google Drive URLs with a more reliable approach
  if (coverUrl.includes('drive.google.com')) {
    try {
      // Extract Google Drive file ID
      let fileId = '';
      
      // Handle various Google Drive URL formats
      if (coverUrl.includes('id=')) {
        // Format: drive.google.com/thumbnail?id=FILE_ID
        const match = coverUrl.match(/[?&]id=([^&]+)/);
        if (match && match[1]) fileId = match[1];
      } else if (coverUrl.includes('/file/d/')) {
        // Format: drive.google.com/file/d/FILE_ID/view
        fileId = coverUrl.split('/file/d/')[1]?.split('/')[0] || '';
      } else if (coverUrl.includes('/open?id=')) {
        // Format: drive.google.com/open?id=FILE_ID
        fileId = coverUrl.split('open?id=')[1]?.split('&')[0] || '';
      }
      
      if (fileId) {
        // Use a more reliable direct link format
        return `https://lh3.googleusercontent.com/d/${fileId}`;
      }
    } catch (error) {
      console.error('Error processing Google Drive URL:', error);
    }
  }
  
  // If the URL is already absolute and not Google Drive, return it as is
  if (coverUrl.startsWith('http://') || coverUrl.startsWith('https://')) {
    return coverUrl;
  }
  
  // If it's a relative path for Supabase storage
  const supabaseClient = getSupabase();
  if (supabaseClient) {
    // Get the public URL with custom fetch options to avoid 406 errors
    const { data } = supabaseClient.storage
      .from('covers')
      .getPublicUrl(coverUrl, getStorageOptions());
    
    return data?.publicUrl || DEFAULT_COVER;
  }
  
  // Fallback to default image if Supabase client is not available
  return DEFAULT_COVER;
};