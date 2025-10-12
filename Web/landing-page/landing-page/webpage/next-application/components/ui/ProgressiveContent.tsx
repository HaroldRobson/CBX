'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from './button';

interface ContentItem {
  id: string;
  content: React.ReactNode;
}

interface ProgressiveContentProps {
  items: ContentItem[];
  initialCount?: number;
  loadMoreCount?: number;
  hasMore?: boolean;
  onLoadMore?: () => Promise<ContentItem[]>;
  loading?: boolean;
  error?: string;
  className?: string;
  loadMoreText?: string;
  noMoreText?: string;
  enableInfiniteScroll?: boolean;
}

export function ProgressiveContent({
  items,
  initialCount = 10,
  loadMoreCount = 10,
  hasMore = false,
  onLoadMore,
  loading = false,
  error,
  className = '',
  loadMoreText = 'Load More',
  noMoreText = 'No more items to load',
  enableInfiniteScroll = false
}: ProgressiveContentProps) {
  const [displayedItems, setDisplayedItems] = useState<ContentItem[]>([]);
  const [currentCount, setCurrentCount] = useState(initialCount);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLButtonElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Initialize displayed items
  useEffect(() => {
    setDisplayedItems(items.slice(0, currentCount));
  }, [items, currentCount]);

  // Load more function
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    
    try {
      if (onLoadMore) {
        const newItems = await onLoadMore();
        setDisplayedItems(prev => [...prev, ...newItems]);
      } else {
        // Load from existing items
        const newCount = currentCount + loadMoreCount;
        setCurrentCount(newCount);
        setDisplayedItems(items.slice(0, newCount));
      }
    } catch (err) {
      console.error('Error loading more items:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, onLoadMore, currentCount, loadMoreCount, items]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!enableInfiniteScroll || !sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !isLoadingMore) {
          handleLoadMore();
        }
      },
      {
        rootMargin: '100px',
        threshold: 0.1
      }
    );

    observer.observe(sentinelRef.current);

    return () => observer.disconnect();
  }, [enableInfiniteScroll, hasMore, isLoadingMore, handleLoadMore]);

  // Keyboard navigation for load more button
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleLoadMore();
    }
  };

  // Focus management after loading more content
  useEffect(() => {
    if (!isLoadingMore && loadMoreRef.current) {
      // Announce to screen readers that new content has loaded
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = `Loaded ${loadMoreCount} more items. ${displayedItems.length} items total.`;
      document.body.appendChild(announcement);
      
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
    }
  }, [isLoadingMore, loadMoreCount, displayedItems.length]);

  return (
    <div className={className}>
      {/* Content grid/list */}
      <div className="space-y-4" role="feed" aria-label="Content feed">
        {displayedItems.map((item, index) => (
          <article
            key={item.id}
            className="focus-within:ring-2 focus-within:ring-green-500 focus-within:ring-offset-2 rounded-lg"
            aria-posinset={index + 1}
            aria-setsize={hasMore ? -1 : displayedItems.length}
          >
            {item.content}
          </article>
        ))}
      </div>

      {/* Loading state */}
      {(loading || isLoadingMore) && (
        <div className="flex items-center justify-center py-8" role="status" aria-label="Loading more content">
          <Loader2 className="w-6 h-6 animate-spin text-green-600 mr-2" />
          <span className="text-gray-600">Loading more content...</span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="flex items-center justify-center py-8 text-red-600" role="alert">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>{error}</span>
        </div>
      )}

      {/* Load more button (manual loading) */}
      {!enableInfiniteScroll && hasMore && !loading && !error && (
        <div className="flex justify-center py-8">
          <Button
            ref={loadMoreRef}
            onClick={handleLoadMore}
            onKeyDown={handleKeyDown}
            disabled={isLoadingMore}
            className="bg-green-600 hover:bg-green-700 text-white"
            aria-describedby="load-more-description"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Loading...
              </>
            ) : (
              loadMoreText
            )}
          </Button>
          <div id="load-more-description" className="sr-only">
            Click to load {loadMoreCount} more items. Currently showing {displayedItems.length} items.
          </div>
        </div>
      )}

      {/* No more content message */}
      {!hasMore && displayedItems.length > 0 && (
        <div className="text-center py-8 text-gray-600" role="status">
          {noMoreText}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      {enableInfiniteScroll && hasMore && (
        <div
          ref={sentinelRef}
          className="h-10 flex items-center justify-center"
          aria-hidden="true"
        >
          {isLoadingMore && <Loader2 className="w-6 h-6 animate-spin text-green-600" />}
        </div>
      )}

      {/* Skip to end link for screen readers */}
      {displayedItems.length > 10 && (
        <div className="sr-only">
          <a href="#content-end" className="focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-green-600 text-white px-4 py-2 rounded">
            Skip to end of content
          </a>
        </div>
      )}
      
      <div id="content-end" aria-hidden="true"></div>
    </div>
  );
}