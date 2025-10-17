'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from './button';

interface AccessiblePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  showPrevNext?: boolean;
  siblingCount?: number;
  className?: string;
  itemsPerPage?: number;
  totalItems?: number;
  itemName?: string;
}

export function AccessiblePagination({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
  showPrevNext = true,
  siblingCount = 1,
  className = '',
  itemsPerPage,
  totalItems,
  itemName = 'items'
}: AccessiblePaginationProps) {
  const [jumpToPage, setJumpToPage] = useState('');

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    
    // Always show first page
    pages.push(1);
    
    // Calculate range around current page
    const startPage = Math.max(2, currentPage - siblingCount);
    const endPage = Math.min(totalPages - 1, currentPage + siblingCount);
    
    // Add ellipsis after first page if needed
    if (startPage > 2) {
      pages.push('ellipsis');
    }
    
    // Add pages around current page
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    // Add ellipsis before last page if needed
    if (endPage < totalPages - 1) {
      pages.push('ellipsis');
    }
    
    // Always show last page (if more than 1 page)
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    
    return pages;
  };

  const handleJumpToPage = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(jumpToPage);
    if (pageNum >= 1 && pageNum <= totalPages) {
      onPageChange(pageNum);
      setJumpToPage('');
    }
  };

  const getItemRange = () => {
    if (!itemsPerPage || !totalItems) return null;
    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, totalItems);
    return { start, end };
  };

  const itemRange = getItemRange();

  return (
    <nav
      role="navigation"
      aria-label="Pagination navigation"
      className={`flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 ${className}`}
    >
      {/* Results summary */}
      {itemRange && (
        <div className="text-sm text-gray-700">
          Showing <span className="font-medium">{itemRange.start}</span> to{' '}
          <span className="font-medium">{itemRange.end}</span> of{' '}
          <span className="font-medium">{totalItems}</span> {itemName}
        </div>
      )}

      {/* Pagination controls */}
      <div className="flex items-center space-x-2">
        {/* First page button */}
        {showFirstLast && currentPage > 1 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            aria-label="Go to first page"
          >
            First
          </Button>
        )}

        {/* Previous page button */}
        {showPrevNext && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            aria-label="Go to previous page"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="sr-only sm:not-sr-only sm:ml-1">Previous</span>
          </Button>
        )}

        {/* Page numbers */}
        <div className="flex items-center space-x-1">
          {getPageNumbers().map((page, index) => {
            if (page === 'ellipsis') {
              return (
                <span key={`ellipsis-${index}`} className="px-2 py-1 text-gray-500">
                  <MoreHorizontal className="w-4 h-4" />
                  <span className="sr-only">More pages</span>
                </span>
              );
            }

            const isCurrentPage = page === currentPage;
            return (
              <Button
                key={page}
                variant={isCurrentPage ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(page)}
                aria-label={`Go to page ${page}`}
                aria-current={isCurrentPage ? "page" : undefined}
                className={isCurrentPage ? "bg-green-600 hover:bg-green-700" : ""}
              >
                {page}
              </Button>
            );
          })}
        </div>

        {/* Next page button */}
        {showPrevNext && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            aria-label="Go to next page"
          >
            <span className="sr-only sm:not-sr-only sm:mr-1">Next</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}

        {/* Last page button */}
        {showFirstLast && currentPage < totalPages && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            aria-label="Go to last page"
          >
            Last
          </Button>
        )}
      </div>

      {/* Jump to page form */}
      <form onSubmit={handleJumpToPage} className="flex items-center space-x-2">
        <label htmlFor="jump-to-page" className="text-sm text-gray-700">
          Go to page:
        </label>
        <input
          id="jump-to-page"
          type="number"
          min="1"
          max={totalPages}
          value={jumpToPage}
          onChange={(e) => setJumpToPage(e.target.value)}
          className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          aria-label={`Jump to page (1 to ${totalPages})`}
        />
        <Button type="submit" size="sm" variant="outline">
          Go
        </Button>
      </form>

      {/* Screen reader announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Page {currentPage} of {totalPages}
        {itemRange && `, showing ${itemName} ${itemRange.start} to ${itemRange.end} of ${totalItems}`}
      </div>
    </nav>
  );
}