import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Books from './pages/Books';
import BookDetails from './pages/BookDetails';
import Collections from './pages/Collections';
import CollectionDetails from './pages/CollectionDetails';
import About from './pages/About';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import { useAuth } from './context/AuthContext';

// Auth wrapper component to handle redirects
const AuthWrapper = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  return user ? <Navigate to="/books" replace /> : <>{children}</>;
};

// Create router with future flag for React 18 concurrent features
export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <Layout />,
      children: [
        { 
          index: true, 
          element: <AuthWrapper><Home /></AuthWrapper>
        },
        { path: 'books', element: <Books /> },
        { path: 'books/:id', element: <BookDetails /> },
        { path: 'collections', element: <Collections /> },
        { path: 'collections/:id', element: <CollectionDetails /> },
        { 
          path: 'about', 
          element: <AuthWrapper><About /></AuthWrapper>
        },
        { path: 'cart', element: <Cart /> },
        { path: 'checkout', element: <Checkout /> },
        { path: 'signin', element: <SignIn /> },
        { path: 'signup', element: <SignUp /> },
        { path: 'profile', element: <Profile /> },
        { path: '*', element: <NotFound /> }
      ]
    }
  ]
  // Future flag removed temporarily while TypeScript type issues are resolved
);