import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { CartProvider } from './context/CartContext';
import { router } from './routes';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <CartProvider>
          <RouterProvider router={router} />
          <Toaster position="top-center" />
        </CartProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App