import { useEffect, useRef, useState, RefObject } from 'react';

interface IntersectionObserverOptions {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
  onIntersect?: () => void;
  enabled?: boolean;
}

/**
 * Custom hook that implements IntersectionObserver to detect when an element becomes visible
 * Useful for implementing infinite scroll and lazy loading
 */
export const useIntersectionObserver = <T extends Element>({
  root = null,
  rootMargin = '0px',
  threshold = 0.1,
  onIntersect,
  enabled = true,
}: IntersectionObserverOptions): [RefObject<T>, boolean] => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const targetRef = useRef<T>(null);
  
  useEffect(() => {
    if (!enabled) {
      setIsIntersecting(false);
      return;
    }
    
    const currentTarget = targetRef.current;
    if (!currentTarget) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        setIsIntersecting(entry.isIntersecting);
        
        if (entry.isIntersecting && onIntersect) {
          onIntersect();
        }
      },
      { root, rootMargin, threshold }
    );
    
    observer.observe(currentTarget);
    
    return () => {
      observer.unobserve(currentTarget);
    };
  }, [root, rootMargin, threshold, onIntersect, enabled]);
  
  return [targetRef, isIntersecting];
};

/**
 * Hook specifically designed for infinite scrolling
 */
export const useInfiniteScroll = <T extends Element>(
  loadMore: () => void,
  {
    threshold = 0.1,
    rootMargin = '0px',
    enabled = true,
    cooldown = 500, // Cooldown to prevent multiple triggers
  } = {}
): [RefObject<T>, boolean] => {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleLoadMore = () => {
    if (isLoading) return;
    
    setIsLoading(true);
    loadMore();
    
    // Reset loading state after cooldown
    setTimeout(() => {
      setIsLoading(false);
    }, cooldown);
  };
  
  const [ref, isIntersecting] = useIntersectionObserver<T>({
    onIntersect: handleLoadMore,
    threshold,
    rootMargin,
    enabled: enabled && !isLoading,
  });
  
  return [ref, isLoading];
}; 