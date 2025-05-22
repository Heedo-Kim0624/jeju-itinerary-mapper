
import React from 'react';
import RefactorButton from '../ui/refactor-button';
import { Separator } from '../ui/separator';

const RefactorMenu: React.FC = () => {
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white p-4 rounded-lg shadow-lg border border-gray-200 w-80">
      <h3 className="text-lg font-medium mb-2">리팩토링 메뉴</h3>
      <p className="text-sm text-gray-500 mb-4">다음 영역의 코드 리팩토링을 시작하십시오:</p>
      
      <div className="space-y-3">
        <RefactorButton
          onClick={() => alert('Left Panel Hooks 리팩토링을 선택하셨습니다.')}
          target="Left Panel Hooks"
          label="구조 개선"
        />
        
        <Separator className="my-2" />
        
        <RefactorButton
          onClick={() => alert('CategoryName 타입 정리를 선택하셨습니다.')}
          target="CategoryName"
          label="타입 정의 통합"
        />
        
        <Separator className="my-2" />
        
        <RefactorButton
          onClick={() => alert('상태관리 최적화를 선택하셨습니다.')}
          target="State Management"
          label="상태관리 최적화"
        />
      </div>
      
      <p className="text-xs text-gray-400 mt-4">
        리팩토링은 기능 변경 없이 코드 구조만 개선합니다.
      </p>
    </div>
  );
};

export default RefactorMenu;
