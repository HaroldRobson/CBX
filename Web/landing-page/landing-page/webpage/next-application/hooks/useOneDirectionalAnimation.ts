'use client';

import { useRef, useEffect, useState, useCallback } from 'react';

interface UseOneDirectionalAnimationOptions {
  threshold?: number;
  rootMargin?: string;
}

interface AnimationState {
  hasAnimated: boolean;
  isVisible: boolean;
  shouldAnimate: boolean;
}

let lastScrollY = 0;
let scrollDirection: 'up' | 'down' = 'down';
let hasReachedBottom = false;
let isScrollListenerSetup = false;

// Track scroll direction globally to avoid multiple listeners
const setupScrollListener = () => {
  if (typeof window === 'undefined' || isScrollListenerSetup) return;
  
  const updateScrollDirection = () => {
    const currentScrollY = window.scrollY;
    scrollDirection = currentScrollY > lastScrollY ? 'down' : 'up';
    
    // Check if user has reached the bottom of the page
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollPosition = currentScrollY + windowHeight;
    
    // Consider "bottom" as being within 100px of actual bottom
    if (scrollPosition >= documentHeight - 100) {
      hasReachedBottom = true;
    }
    
    lastScrollY = currentScrollY;
  };

  let ticking = false;
  const requestScrollUpdate = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateScrollDirection();
        ticking = false;
      });
      ticking = true;
    }
  };

  window.addEventListener('scroll', requestScrollUpdate, { passive: true });
  isScrollListenerSetup = true;
};

export function useOneDirectionalAnimation<T extends HTMLElement = HTMLElement>(options: UseOneDirectionalAnimationOptions = {}) {
  const { threshold = 0.1, rootMargin = '-5% 0px -5% 0px' } = options;
  const ref = useRef<T>(null);
  const [state, setState] = useState<AnimationState>({
    hasAnimated: false,
    isVisible: false,
    shouldAnimate: false
  });

  // Set up scroll listener on first use
  useEffect(() => {
    setupScrollListener();
  }, []);

  const updateAnimationState = useCallback((isIntersecting: boolean) => {
    setState(prevState => {
      // If already animated, don't change anything
      if (prevState.hasAnimated) {
        return prevState;
      }

      // Prevent animations when scrolling up after reaching bottom
      if (hasReachedBottom && scrollDirection === 'up') {
        return prevState;
      }

      // Only animate if scrolling down and element is visible
      const shouldAnimate = isIntersecting && scrollDirection === 'down';
      
      return {
        hasAnimated: shouldAnimate ? true : prevState.hasAnimated,
        isVisible: isIntersecting,
        shouldAnimate: shouldAnimate
      };
    });
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        updateAnimationState(entry.isIntersecting);
      },
      {
        threshold,
        rootMargin
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin, updateAnimationState]);

  return {
    ref,
    shouldAnimate: state.shouldAnimate || state.hasAnimated,
    hasAnimated: state.hasAnimated,
    isVisible: state.isVisible
  };
}

// Simplified hook for elements that should only animate once
export function useAnimateOnce<T extends HTMLElement = HTMLElement>(options: UseOneDirectionalAnimationOptions = {}) {
  const { shouldAnimate, ref } = useOneDirectionalAnimation<T>(options);
  return { ref, isVisible: shouldAnimate };
} 