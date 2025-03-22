import { useState, useEffect } from 'react';

// Default fallback image URL
const DEFAULT_FALLBACK = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80';

/**
 * Custom hook to handle image loading with fallback
 * 
 * @param src Primary image source to try loading
 * @param fallbackSrc Fallback image if primary fails
 * @returns The final image src to use
 */
export const useImageWithFallback = (
  src: string | null | undefined, 
  fallbackSrc: string = DEFAULT_FALLBACK
): string => {
  const [imgSrc, setImgSrc] = useState<string>(fallbackSrc);
  
  useEffect(() => {
    if (!src) {
      setImgSrc(fallbackSrc);
      return;
    }
    
    // Preload the image to check if it loads correctly
    const img = new Image();
    
    // Initially display the source URL
    setImgSrc(src);
    
    // Add a timeout to prevent hanging on slow image loads
    const timeoutId = setTimeout(() => {
      console.warn(`Image load timeout: ${src}`);
      img.src = ""; // Cancel the request
      setImgSrc(fallbackSrc);
    }, 8000); // 8 second timeout
    
    img.onload = () => {
      clearTimeout(timeoutId);
      setImgSrc(src);
    };
    
    img.onerror = () => {
      clearTimeout(timeoutId);
      console.warn(`Failed to load image: ${src}`);
      setImgSrc(fallbackSrc);
    };
    
    // Set the source after setting up the event handlers
    img.src = src;
    
    return () => {
      clearTimeout(timeoutId);
      img.onload = null;
      img.onerror = null;
    };
  }, [src, fallbackSrc]);
  
  return imgSrc;
}; 