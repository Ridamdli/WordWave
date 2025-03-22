export interface Book {
  id: string;
  title: string;
  author: string;
  cover_url: string;
  summary: string;
  category: string;
  rating: number;
  downloads: number;
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
  last_read: string;
  created_at: string;
  book?: Book;
}