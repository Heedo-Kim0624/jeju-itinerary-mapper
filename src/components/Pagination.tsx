
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
  // 현재 페이지가 속한 5단위 그룹의 시작 페이지 계산
  // currentPage가 1~5면 startPage는 1, 6~10이면 startPage는 6
  const startPage = Math.floor((currentPage - 1) / 5) * 5 + 1;
  
  // 현재 그룹의 끝 페이지 계산 (최대 totalPages)
  const endPage = Math.min(startPage + 4, totalPages);
  
  // 현재 페이지가 속한 그룹 번호
  const currentGroup = Math.floor((currentPage - 1) / 5);
  
  // 이전 그룹으로 이동 가능 여부
  const hasPreviousGroup = currentGroup > 0;
  
  // 다음 그룹으로 이동 가능 여부
  const hasNextGroup = (currentGroup + 1) * 5 < totalPages;

  // 페이지 번호 배열 생성
  const pageNumbers = Array.from(
    { length: endPage - startPage + 1 },
    (_, i) => startPage + i
  );

  return (
    <div className="flex items-center justify-center gap-1">
      {/* 이전 페이지 버튼 */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="이전 페이지"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      {/* 페이지 번호 버튼들 */}
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
      
      {/* 다음 페이지 버튼 */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="다음 페이지"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};
