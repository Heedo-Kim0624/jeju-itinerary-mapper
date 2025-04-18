// RestaurantPanel.tsx (이 행 삭제 금지)
import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface RestaurantPanelProps {
  selectedKeywords: string[]; // 중복 선택 허용 (영어 값)
  onToggleKeyword: (keyword: string) => void;
  directInputValue: string;
  onDirectInputChange: (value: string) => void;
  onConfirmRestaurant: (finalKeywords: string[]) => void;
  onClose: () => void;
}

const defaultKeywords = [
  { eng: 'Good_value_for_money', kr: '가성비가 좋아요' },
  { eng: 'Great_for_group_gatherings', kr: '단체모임 하기 좋아요' },
  { eng: 'Spacious_store', kr: '매장이 넓어요' },
  { eng: 'Clean_store', kr: '매장이 청결해요' },
  { eng: 'Nice_view', kr: '뷰가 좋아요' },
  { eng: 'Large_portions', kr: '양이 푸짐해요' },
  { eng: 'Delicious_food', kr: '음식이 맛있어요' },
  { eng: 'Stylish_interior', kr: '인테리어가 멋져요' },
  { eng: 'Fresh_ingredients', kr: '재료가 신선해요' },
  { eng: 'Easy_parking', kr: '주차하기 편해요' },
  { eng: 'Friendly', kr: '친절해요' },
  { eng: 'Special_menu_available', kr: '특별한 메뉴가 있어요' },
  { eng: 'Good_for_solo_dining', kr: '혼밥하기 좋아요' },
];

// defaultKeywords를 기반으로 영어 → 한글 매핑 딕셔너리 생성
const keywordMapping: Record<string, string> = defaultKeywords.reduce((acc, curr) => {
  acc[curr.eng] = curr.kr;
  return acc;
}, {} as Record<string, string>);

const RestaurantPanel: React.FC<RestaurantPanelProps> = ({
  selectedKeywords,
  onToggleKeyword,
  directInputValue,
  onDirectInputChange,
  onConfirmRestaurant,
  onClose,
}) => {
  // 드래그 앤 드롭으로 순위 지정 (최대 3개)
  const [ranking, setRanking] = useState<string[]>([]);

  // 선택된 키워드 중 아직 순위에 없는 항목을 순위 목록에 추가하는 함수
  const addToRanking = (keyword: string) => {
    if (!ranking.includes(keyword) && ranking.length < 3) {
      setRanking([...ranking, keyword]);
    }
  };

  // 순위 항목에서 제거하는 함수 (취소)
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

  // 직접 입력 버튼 클릭 시 : 입력값을 selectedKeywords에 추가
  const handleAddDirectInput = () => {
    if (directInputValue.trim() !== '') {
      onToggleKeyword(directInputValue.trim());
      onDirectInputChange('');
    }
  };

  // 확인 버튼 클릭 시: 순위에 지정된 키워드를 한글로 번역 후 결합하고,
  // 순위에 없는 선택된 키워드를 번역 후 결합하여 최종 키워드를 부모에 전달
  const handleConfirm = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    // 순위와 나머지 선택 키워드(영어 값)를 사용
    const rankedSet = new Set(ranking);
    const unranked = selectedKeywords.filter((kw) => !rankedSet.includes(kw));

    const allKeywords: string[] = [];
    if (ranking.length > 0) {
      // 순위 부분은 그룹화하여 중괄호로 감싼다
      const rankedString = `{${ranking.join(',')}}`;
      allKeywords.push(rankedString);
    }
    allKeywords.push(...unranked);
    if (directInputValue.trim() !== '') {
      allKeywords.push(directInputValue.trim());
    }

    // 최종 결과: "음식점[영어키워드,영어키워드,...]"
    const groupFinalKeyword = `음식점[${allKeywords.join(',')}]`;
    console.log('최종 키워드:', groupFinalKeyword);

    // 초기화 후 부모 콜백 호출 (영어 키워드 그룹을 배열로 전달)
    setRanking([]);
    onDirectInputChange('');
    onConfirmRestaurant([groupFinalKeyword]);
  };

  // 닫기 버튼 클릭 시: 내부 상태 초기화 후 부모 onClose 콜백 호출
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
        <h2 className="text-lg font-semibold">음식점 키워드 선택</h2>
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

export default RestaurantPanel;
