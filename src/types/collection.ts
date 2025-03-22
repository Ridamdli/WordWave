import { Book } from './book';

export interface Collection {
  id: string;
  title: string;
  description: string;
  cover_url?: string;
  user_id: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  books: Book[];
}