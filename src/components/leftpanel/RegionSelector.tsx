import React from 'react';

interface RegionSelectorProps {
  selectedRegions: string[];
  onToggle: (region: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

const REGION_GROUPS = [
  {
    title: "제주시",
    regions: ["제주", "구좌", "애월", "한경/한림"],
  },
  {
    title: "서귀포시",
    regions: ["서귀포", "남원/표선", "성산", "안덕/대정", "중문"],
  },
];

const RegionSelector: React.FC<RegionSelectorProps> = ({
  selectedRegions,
  onToggle,
  onClose,
  onConfirm, 
}) => {
  return (
    <div className="fixed top-0 right-0 w-[280px] h-full bg-white shadow-lg z-50 p-4 border-l border-gray-200">

      {/* 헤더 */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">지역 선택</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-black">닫기</button>
      </div>

      {/* 안내 문구 */}
      <p className="text-sm text-gray-500 mb-4">중복 선택 가능</p>

      {/* 지역 버튼 목록 */}
      <div className="space-y-6">
        {REGION_GROUPS.map((group) => (
          <div key={group.title}>
            {/* 그룹 제목 */}
            <h4 className="text-sm text-gray-500 font-medium mb-2">{group.title}</h4>

            {/* 버튼 리스트 (세로 정렬) */}
            <div className="flex flex-col gap-2">
              {group.regions.map((region) => {
                const isSelected = selectedRegions.includes(region);
                return (
                  <button
                    key={region}
                    onClick={() => onToggle(region)}
                    className={`w-full text-left px-4 py-2 rounded border text-sm transition ${
                      isSelected
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200"
                    }`}
                  >
                    {region}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 확인 버튼 */}
      <div className="absolute bottom-4 right-4">
        <button
          onClick={onConfirm}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
        >
          확인
        </button>
      </div>
    </div>
  );
};

export default RegionSelector;
