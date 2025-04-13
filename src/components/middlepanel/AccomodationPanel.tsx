// AccomodationPanel.tsx
import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface AccomodationPanelProps {
  selectedKeywords: string[]; // 중복 선택 허용 (영어 값)
  onToggleKeyword: (keyword: string) => void;
  directInputValue: string;
  onDirectInputChange: (value: string) => void;
  onConfirmAccomodation: (finalKeywords: string[]) => void;
  onClose: () => void;
}

const defaultKeywords = [
  { eng: 'kind_service', kr: '친절함' },
  { eng: 'cleanliness', kr: '청결도' },
  { eng: 'good_view', kr: '좋은 뷰' },
  { eng: 'quiet_and_relax', kr: '방음' },
  { eng: 'good_bedding', kr: '침구' },
  { eng: 'stylish_interior', kr: '인테리어' },
  { eng: 'good_aircon_heating', kr: '냉난방' },
  { eng: 'well_equipped_bathroom', kr: '욕실' },
  { eng: 'good_breakfast', kr: '조식' },
  { eng: 'easy_parking', kr: '주차' },
];

// defaultKeywords를 이용해 영어→한글 매핑 생성 (변경됨)
const keywordMapping: Record<string, string> = defaultKeywords.reduce((acc, curr) => {
  acc[curr.eng] = curr.kr;
  return acc;
}, {} as Record<string, string>);

const AccomodationPanel: React.FC<AccomodationPanelProps> = ({
  selectedKeywords,
  onToggleKeyword,
  directInputValue,
  onDirectInputChange,
  onConfirmAccomodation,
  onClose,
}) => {
  // 순위 목록: 드래그 앤 드롭으로 순서를 조정 (최대 3개)
  const [ranking, setRanking] = useState<string[]>([]);

  // 선택된 키워드 중 순위에 추가되지 않은 항목을 순위에 추가하는 함수
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

  // 최종 확인 시, 순위에 지정된 키워드를 한글로 변환 후 하나의 문자열로 결합하고,
  // 순위에 포함되지 않은 선택된 키워드도 한글로 변환하여 결합한 최종 배열을 생성
  const handleConfirm = () => {
    const rankedSet = new Set(ranking);
    const unranked = selectedKeywords.filter((kw) => !rankedSet.has(kw));
    
    // 순위에 지정된 키워드를 한글로 변환하고 합치기 (예: {친절함,깔끔함})
    const translatedRanked = ranking.map((kw) => keywordMapping[kw] || kw);
    const rankedString = translatedRanked.length > 0 ? `{${translatedRanked.join(',')}}` : '';
    
    // 순위에 없는 키워드도 한글로 변환
    const translatedUnranked = unranked.map((kw) => keywordMapping[kw] || kw);
    
    const finalKeywords: string[] = [];
    if (rankedString) {
      finalKeywords.push(rankedString);
    }
    finalKeywords.push(...translatedUnranked);
    if (directInputValue.trim() !== '') {
      finalKeywords.push(directInputValue.trim());
    }
    onConfirmAccomodation(finalKeywords);
  };

  // 변경됨: 닫기 버튼 클릭 시, 내부 상태(순위, 직접 입력값 등)를 초기화한 후 부모의 onClose를 호출하는 함수
  const handleClose = () => {
    setRanking([]); // 순위 초기화
    onDirectInputChange(''); // 직접입력값 초기화
    // 추가적으로, 만약 선택된 키워드 초기화가 필요하면 부모를 통해 처리하거나 콜백 호출
    onClose(); // 패널 닫기 처리
  };

  return (
    <div className="fixed top-0 left-[300px] w-[300px] h-full bg-white border-l border-r border-gray-200 z-40 shadow-md p-4 overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">숙소 키워드 선택</h2>
        {/* 변경됨: onClose 대신 handleClose 호출 */}
        <button onClick={handleClose} className="text-sm text-blue-600 hover:underline">
          닫기
        </button>
      </div>

      {/* 키워드 버튼 그룹 (선택은 버튼 클릭) */}
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

      {/* 직접 입력 영역 (이전보다 위쪽에 위치하도록 이동됨 - 변경됨) */}
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

      {/* 선택된 키워드 목록에서 순위에 추가할 항목 표시 */}
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

      {/* 드래그 앤 드롭을 통한 순위 영역 (세로 배열, 라벨 추가) */}
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

export default AccomodationPanel;
