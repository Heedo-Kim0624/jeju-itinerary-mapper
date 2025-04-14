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
  { eng: 'Many_Attractions', kr: '많은 볼거리' },
  { eng: 'Photogenic_Spot', kr: '인생샷' },
  { eng: 'Easy_Parking', kr: '주차' },
  { eng: 'Well_Maintained_Walking_Trails', kr: '산책로' },
  { eng: 'Kid_Friendly', kr: '아이와 함께' },
  { eng: 'Great_View', kr: '뷰' },
  { eng: 'Reasonable_Pricing', kr: '가성비' },
  { eng: 'Diverse_Experience_Programs', kr: '체험활동' },
  { eng: 'Large_Scale', kr: '공간감' },
  { eng: 'Friendly_Staff', kr: '친절함' },
];

// defaultKeywords를 기반으로 영어→한글 매핑 딕셔너리 생성
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

  // 순위 목록에 선택된 키워드를 추가하는 함수
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

  // 확인 버튼 클릭 시: 순위에 지정된 키워드를 한글로 변환 후 결합,
  // 직접 입력값 포함, 내부 상태 초기화 후 부모 onConfirmLandmark 콜백 호출.
  const handleConfirm = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const rankedSet = new Set(ranking);
    const unranked = selectedKeywords.filter((kw) => !rankedSet.has(kw));

    const translatedRanked = ranking.map((kw) => keywordMapping[kw] || kw);
    const rankedString = translatedRanked.length > 0 ? `{${translatedRanked.join(',')}}` : '';

    const translatedUnranked = unranked.map((kw) => keywordMapping[kw] || kw);

    const finalKeywords: string[] = [];
    if (rankedString) {
      finalKeywords.push(rankedString);
    }
    finalKeywords.push(...translatedUnranked);
    if (directInputValue.trim() !== '') {
      finalKeywords.push(directInputValue.trim());
    }

    // 내부 상태 초기화 후 부모 콜백 호출
    setRanking([]);
    onDirectInputChange('');
    onConfirmLandmark(finalKeywords);
  };

  // 닫기 버튼 클릭 시: 내부 상태 초기화 후 부모 onClose 콜백 호출.
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

      {/* 키워드 버튼 그룹 */}
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
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring focus:border-blue-300 whitespace-nowrap overflow-hidden text-ellipsis"
        />
      </div>

      {/* 선택된 키워드 목록에서 순위 추가 가능한 영역 */}
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

      {/* 드래그 앤 드롭을 통한 순위 영역 */}
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
