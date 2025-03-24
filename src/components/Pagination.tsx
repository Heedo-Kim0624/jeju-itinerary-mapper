
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  // Always show 5 page numbers, centered around the current page
  const getPageNumbers = () => {
    if (totalPages <= 5) {
      // If total pages is 5 or less, show all pages
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    // Calculate start and end page numbers
    let startPage = Math.max(1, currentPage - 2);
    let endPage = startPage + 4;
    
    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - 4);
    }
    
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center justify-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      {pageNumbers.map((number) => (
        <Button
          key={number}
          variant={number === currentPage ? "default" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(number)}
        >
          {number}
        </Button>
      ))}
      
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};
