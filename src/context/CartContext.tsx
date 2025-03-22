import React, { createContext, useContext, useState } from 'react';
import { Cart, CartItem } from '../types/cart';
import { Book } from '../types/book';
import toast from 'react-hot-toast';

interface CartContextType {
  cart: Cart;
  addToCart: (book: Book, format: string) => void;
  removeFromCart: (bookId: string) => void;
  updateQuantity: (bookId: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType>({
  cart: { items: [], total: 0 },
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
});

export const useCart = () => useContext(CartContext);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<Cart>({ items: [], total: 0 });

  const calculateTotal = (items: CartItem[]): number => {
    return items.reduce((total, item) => total + (item.book.rating * item.quantity), 0);
  };

  const addToCart = (book: Book, format: string) => {
    setCart(currentCart => {
      const existingItem = currentCart.items.find(item => item.book.id === book.id);
      
      if (existingItem) {
        const updatedItems = currentCart.items.map(item =>
          item.book.id === book.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
        toast.success('Updated quantity in cart');
        return {
          items: updatedItems,
          total: calculateTotal(updatedItems)
        };
      }

      const newItems = [...currentCart.items, { book, quantity: 1, format }];
      toast.success('Added to cart');
      return {
        items: newItems,
        total: calculateTotal(newItems)
      };
    });
  };

  const removeFromCart = (bookId: string) => {
    setCart(currentCart => {
      const newItems = currentCart.items.filter(item => item.book.id !== bookId);
      toast.success('Removed from cart');
      return {
        items: newItems,
        total: calculateTotal(newItems)
      };
    });
  };

  const updateQuantity = (bookId: string, quantity: number) => {
    if (quantity < 1) return;
    
    setCart(currentCart => {
      const updatedItems = currentCart.items.map(item =>
        item.book.id === bookId ? { ...item, quantity } : item
      );
      return {
        items: updatedItems,
        total: calculateTotal(updatedItems)
      };
    });
  };

  const clearCart = () => {
    setCart({ items: [], total: 0 });
    toast.success('Cart cleared');
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};