import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Fix for passive event listener warnings - add before app initialization
// This allows preventDefault() to work on wheel events globally
const eventListenerOptions = {
  passive: false,
  capture: false
};

// Override preventDefault behavior for wheel events
try {
  window.addEventListener('test', null as any, {
    get passive() {
      // This will be called when the browser attempts to access the passive property
      document.addEventListener('wheel', (e) => {}, eventListenerOptions);
      return false;
    }
  });
} catch (e) {
  // Fallback if the browser doesn't support the above pattern
  console.log('Passive event listener feature detection failed', e);
}

// Initialize application
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
