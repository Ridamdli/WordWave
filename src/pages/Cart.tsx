import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash, ShoppingCart, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const Cart: React.FC = () => {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
  const { user } = useAuth();

  const handleCheckout = () => {
    if (!user) {
      navigate('/signin?redirect=checkout');
    } else {
      navigate('/checkout');
    }
  };

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <ShoppingCart className="h-16 w-16 mx-auto text-gray-400 dark:text-gray-600" />
            <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">Your cart is empty</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Looks like you haven't added any books to your cart yet.
            </p>
            <button
              onClick={() => navigate('/books')}
              className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Browse Books
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold dark:text-white mb-8">Your Cart</h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cart Items */}
          <div className="lg:w-2/3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between">
                <h2 className="text-xl font-semibold dark:text-white">Items ({cart.items.length})</h2>
                <button
                  onClick={clearCart}
                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 flex items-center"
                >
                  <Trash className="h-4 w-4 mr-1" />
                  Clear Cart
                </button>
              </div>

              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {cart.items.map((item) => (
                  <div key={item.book.id} className="p-6 flex flex-col sm:flex-row">
                    <div className="sm:w-24 sm:h-32 flex-shrink-0 mb-4 sm:mb-0">
                      <img
                        src={item.book.cover_url}
                        alt={item.book.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                    <div className="sm:ml-6 flex-1">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="text-lg font-medium dark:text-white">{item.book.title}</h3>
                          <p className="text-gray-600 dark:text-gray-400">{item.book.author}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                            Format: {item.format}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold dark:text-white">
                            ${(item.book.rating * item.quantity).toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-500">
                            ${item.book.rating.toFixed(2)} each
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-between items-center">
                        <div className="flex items-center">
                          <button
                            onClick={() => updateQuantity(item.book.id, Math.max(1, item.quantity - 1))}
                            className="p-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                          <span className="mx-2 w-8 text-center dark:text-white">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.book.id, item.quantity + 1)}
                            className="p-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.book.id)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:w-1/3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 sticky top-24">
              <h2 className="text-xl font-semibold mb-4 dark:text-white">Order Summary</h2>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span className="dark:text-white">${cart.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Tax</span>
                  <span className="dark:text-white">${(cart.total * 0.1).toFixed(2)}</span>
                </div>
                {cart.discount && (
                  <div className="flex justify-between text-green-600 dark:text-green-400">
                    <span>Discount</span>
                    <span>-${cart.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex justify-between font-semibold">
                  <span className="dark:text-white">Total</span>
                  <span className="text-xl dark:text-white">
                    ${(cart.total * 1.1 - (cart.discount || 0)).toFixed(2)}
                  </span>
                </div>
              </div>
              <button
                onClick={handleCheckout}
                className="w-full mt-6 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center"
              >
                Proceed to Checkout
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
              <button
                onClick={() => navigate('/books')}
                className="w-full mt-4 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white py-3 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;