import { supabase } from './supabase';
import { Book, UserBook } from '../types/book';

export const booksApi = {
  getAll: async (): Promise<Book[]> => {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  getById: async (id: string): Promise<Book> => {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  getUserBooks: async (userId: string): Promise<UserBook[]> => {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('user_books')
      .select(`
        *,
        book:books(*)
      `)
      .eq('user_id', userId)
      .order('last_read', { ascending: false });

    if (error) throw error;
    return data;
  },

  toggleFavorite: async (userId: string, bookId: string): Promise<boolean> => {
    if (!supabase) throw new Error('Supabase client not initialized');

    const { data: existing } = await supabase
      .from('user_books')
      .select('*')
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .single();

    if (existing) {
      const { error } = await supabase
        .from('user_books')
        .update({ is_favorite: !existing.is_favorite })
        .eq('id', existing.id);

      if (error) throw error;
      return !existing.is_favorite;
    } else {
      const { error } = await supabase
        .from('user_books')
        .insert({
          user_id: userId,
          book_id: bookId,
          is_favorite: true
        });

      if (error) throw error;
      return true;
    }
  },

  updateProgress: async (userId: string, bookId: string, progress: number): Promise<void> => {
    if (!supabase) throw new Error('Supabase client not initialized');

    const { data: existing } = await supabase
      .from('user_books')
      .select('*')
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .single();

    if (existing) {
      const { error } = await supabase
        .from('user_books')
        .update({ 
          progress,
          last_read: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('user_books')
        .insert({
          user_id: userId,
          book_id: bookId,
          progress,
          last_read: new Date().toISOString()
        });

      if (error) throw error;
    }
  }
};