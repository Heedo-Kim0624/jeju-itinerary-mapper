// LandmarkPanel.tsx (이 행 삭제 금지)
import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface LandmarkPanelProps {
  selectedKeywords: string[]; // 중복 선택 허용 (영어 값)
  onToggleKeyword: (keyword: string) => void;
  directInputValue: string;
  onDirectInputChange: (value: string) => void;
  onConfirmLandmark: (finalKeywords: string[]) => void;
  onClose: () => void;
}

const defaultKeywords = [
  { eng: 'Many_Attractions', kr: '볼거리가 많아요' },
  { eng: 'Photogenic_Spot', kr: '사진이 잘 나와요' },
  { eng: 'Easy_Parking', kr: '주차하기 편해요' },
  { eng: 'Well_Maintained_Walking_Trails', kr: '산책로가 잘 되어있어요' },
  { eng: 'Kid_Friendly', kr: '아이와 가기 좋아요' },
  { eng: 'Great_View', kr: '뷰가 좋아요' },
  { eng: 'Reasonable_Pricing', kr: '가격이 합리적이에요' },
  { eng: 'Diverse_Experience_Programs', kr: '체험 프로그램이 다양해요' },
  { eng: 'Large_Scale', kr: '규모가 커요' },
  { eng: 'Friendly_Staff', kr: '설명이 잘 되어있어요' },
];

// 영어 → 한글 매핑 딕셔너리 생성
const keywordMapping: Record<string, string> = defaultKeywords.reduce((acc, curr) => {
  acc[curr.eng] = curr.kr;
  return acc;
}, {} as Record<string, string>);

const LandmarkPanel: React.FC<LandmarkPanelProps> = ({
  selectedKeywords,
  onToggleKeyword,
  directInputValue,
  onDirectInputChange,
  onConfirmLandmark,
  onClose,
}) => {
  // 순위 목록: 드래그 앤 드롭으로 순서를 조정 (최대 3개)
  const [ranking, setRanking] = useState<string[]>([]);

  // 선택된 키워드를 순위 목록에 추가 (최대 3개)
  const addToRanking = (keyword: string) => {
    if (!ranking.includes(keyword) && ranking.length < 3) {
      setRanking([...ranking, keyword]);
    }
  };

  // 순위 항목에서 제거하는 함수
  const removeFromRanking = (keyword: string) => {
    setRanking((prev) => prev.filter((item) => item !== keyword));
  };

  // 드래그 앤 드롭 순서 재정렬 처리
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const newRank = Array.from(ranking);
    const [removed] = newRank.splice(result.source.index, 1);
    newRank.splice(result.destination.index, 0, removed);
    setRanking(newRank);
  };

  // 직접 입력 버튼 클릭 시: 입력값을 selectedKeywords에 추가
  const handleAddDirectInput = () => {
    if (directInputValue.trim() !== '') {
      onToggleKeyword(directInputValue.trim());
      onDirectInputChange('');
    }
  };

  // 확인 버튼 클릭 시: 순위 및 직접 입력값을 반영한 최종 키워드를 계산하여 전달
  const handleConfirm = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    // 순위가 지정된 키워드들 추출
    const rankedSet = new Set(ranking);
    // 순위가 지정되지 않은 나머지 키워드들 추출
    const unranked = selectedKeywords.filter((kw) => !rankedSet.includes(kw));

    const allKeywords: string[] = [];
    if (ranking.length > 0) {
      // 순위 부분은 그룹화하여 중괄호로 감싼다
      const rankedString = `{${ranking.join(',')}}`;
      allKeywords.push(rankedString);
    }
    
    // 나머지 선택된 키워드들 추가
    allKeywords.push(...unranked);
    
    // 직접 입력한 키워드가 있다면 추가
    if (directInputValue.trim() !== '') {
      allKeywords.push(directInputValue.trim());
    }

    // 최종 결과: "관광지[영어키워드,영어키워드,...]"
    // 키워드가 없는 경우에도 빈 배열 []을 사용하여 안전한 문자열 생성
    const groupFinalKeyword = `관광지[${allKeywords.join(',')}]`;
    console.log('최종 키워드:', groupFinalKeyword);

    // 수정: onConfirmLandmark가 string[] 타입을 받으므로 배열로 감싸서 전달
    setRanking([]);
    onDirectInputChange('');
    onConfirmLandmark([groupFinalKeyword]);
  };

  // 닫기 버튼 클릭 시 내부 상태 초기화 후 부모 onClose 콜백 호출
  const handleClose = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setRanking([]);
    onDirectInputChange('');
    onClose();
  };

  return (
    <div className="fixed top-0 left-[300px] w-[300px] h-full bg-white border-l border-r border-gray-200 z-40 shadow-md p-4 overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">관광지 키워드 선택</h2>
        <button type="button" onClick={handleClose} className="text-sm text-blue-600 hover:underline">
          닫기
        </button>
      </div>

      {/* 기본 키워드 버튼 그룹 */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {defaultKeywords.map((keyword) => {
          const isSelected = selectedKeywords.includes(keyword.eng);
          return (
            <button
              type="button"
              key={keyword.eng}
              onClick={() => onToggleKeyword(keyword.eng)}
              className={`px-2 py-1 rounded border text-sm transition-colors duration-150 whitespace-nowrap overflow-hidden text-ellipsis ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200'
              }`}
            >
              {keyword.kr}
            </button>
          );
        })}
      </div>

      {/* 직접 입력 영역 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">직접 입력</label>
        <input
          type="text"
          value={directInputValue}
          onChange={(e) => onDirectInputChange(e.target.value)}
          placeholder="키워드를 입력하세요"
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring focus:border-blue-300"
        />
        <div className="mt-2">
          <button
            type="button"
            onClick={handleAddDirectInput}
            className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            확인
          </button>
        </div>
      </div>

      {/* 선택된 키워드 목록 (순위 추가 가능) */}
      {selectedKeywords.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold mb-2">선택된 키워드 (순위 추가)</h3>
          <div className="flex flex-wrap gap-2">
            {selectedKeywords.map((kw) => {
              const item = defaultKeywords.find((i) => i.eng === kw);
              const displayText = item ? item.kr : kw;
              return (
                <div key={kw} className="flex items-center gap-1">
                  <span className="px-2 py-1 bg-gray-200 rounded text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                    {displayText}
                  </span>
                  {!ranking.includes(kw) && ranking.length < 3 && (
                    <button
                      type="button"
                      onClick={() => addToRanking(kw)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      순위 추가
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 드래그 앤 드롭을 통한 순위 영역 (취소 버튼 포함) */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold mb-2">키워드 순위 (최대 3개)</h3>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="ranking">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="flex flex-col space-y-2">
                {ranking.map((kw, index) => {
                  const item = defaultKeywords.find((i) => i.eng === kw);
                  const displayText = item ? item.kr : kw;
                  return (
                    <Draggable key={kw} draggableId={kw} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="flex items-center space-x-2 p-2 border rounded border-dashed border-gray-300"
                        >
                          <span className="text-xs text-gray-500">{index + 1}순위:</span>
                          <span className="text-sm text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis">
                            {displayText}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFromRanking(kw)}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            취소
                          </button>
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {/* 최종 확인 버튼 */}
      <button
        type="button"
        onClick={handleConfirm}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 text-sm"
      >
        확인
      </button>
    </div>
  );
};

export default LandmarkPanel;
