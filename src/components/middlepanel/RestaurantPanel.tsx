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
  { eng: 'Good_value_for_money', kr: '가성비' },
  { eng: 'Great_for_group_gatherings', kr: '단체' },
  { eng: 'Spacious_store', kr: '공간감' },
  { eng: 'Clean_store', kr: '깔끔함' },
  { eng: 'Nice_view', kr: '좋은 뷰' },
  { eng: 'Large_portions', kr: '푸짐함' },
  { eng: 'Delicious_food', kr: '맛' },
  { eng: 'Stylish_interior', kr: '세련됨' },
  { eng: 'Fresh_ingredients', kr: '신선함' },
  { eng: 'Easy_parking', kr: '주차' },
  { eng: 'Friendly', kr: '친절함' },
  { eng: 'Special_menu_available', kr: '특별함' },
  { eng: 'Good_for_solo_dining', kr: '혼밥' },
];

const RestaurantPanel: React.FC<RestaurantPanelProps> = ({
  selectedKeywords,
  onToggleKeyword,
  directInputValue,
  onDirectInputChange,
  onConfirmRestaurant,
  onClose,
}) => {
  // 드래그 앤 드롭을 통한 순위 지정 (최대 3개)
  const [ranking, setRanking] = useState<string[]>([]);

  // 아직 순위 목록에 없는 선택된 키워드를 순위에 추가하는 함수 (버튼 클릭)
  const addToRanking = (keyword: string) => {
    if (!ranking.includes(keyword) && ranking.length < 3) {
      setRanking([...ranking, keyword]);
    }
  };

  // 드래그 앤 드롭 순서 재정렬 처리
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const newRank = Array.from(ranking);
    const [removed] = newRank.splice(result.source.index, 1);
    newRank.splice(result.destination.index, 0, removed);
    setRanking(newRank);
  };

  // 확인 버튼 누르면 최종 키워드 배열 생성
  const handleConfirm = () => {
    const rankedSet = new Set(ranking);
    const unranked = selectedKeywords.filter((kw) => !rankedSet.has(kw));
    const finalKeywords = ranking.map((kw) => `{${kw}}`).concat(unranked);
    if (directInputValue.trim() !== '') {
      finalKeywords.push(directInputValue.trim());
    }
    onConfirmRestaurant(finalKeywords);
  };

  return (
    <div className="fixed top-0 left-[300px] w-[300px] h-full bg-white border-l border-r border-gray-200 z-40 shadow-md p-4 overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">음식점 키워드 선택</h2>
        <button onClick={onClose} className="text-sm text-blue-600 hover:underline">
          닫기
        </button>
      </div>

      {/* 기본 키워드 버튼 그룹 */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {defaultKeywords.map((keyword) => {
          const isSelected = selectedKeywords.includes(keyword.eng);
          return (
            <button
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
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring focus:border-blue-300 whitespace-nowrap overflow-hidden text-ellipsis"
        />
      </div>

      {/* 선택된 키워드 목록에서 순위 추가 */}
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

    {/* 드래그 앤 드롭을 통한 순위 영역 (세로 배열, 순위 라벨 추가) */}
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

      {/* 확인 버튼 */}
      <button
        onClick={handleConfirm}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 text-sm"
      >
        확인
      </button>
    </div>
  );
};

export default RestaurantPanel;
