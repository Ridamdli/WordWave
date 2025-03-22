import { Book } from './book';

export interface CartItem {
  book: Book;
  quantity: number;
  format: string;
}

export interface Cart {
  items: CartItem[];
  total: number;
  discount?: number;
}