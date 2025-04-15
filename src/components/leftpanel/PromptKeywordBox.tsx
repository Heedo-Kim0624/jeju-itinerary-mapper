
import React from 'react';

interface PromptKeywordBoxProps {
  keywords: string[];
}

// LeftPanel 에서 사용하는 UI용 한글 매핑 사전과 동일한 사전을 사용합니다.
const keywordMapping: Record<string, string> = {
  'Many_Attractions': '많은 볼거리',
  'Photogenic_Spot': '인생샷',
  'Easy_Parking': '주차',
  'Well_Maintained_Walking_Trails': '산책로',
  'Kid_Friendly': '아이와 함께',
  'Great_View': '뷰',
  'Reasonable_Pricing': '가성비',
  'Diverse_Experience_Programs': '체험활동',
  'Large_Scale': '공간감',
  'Friendly_Staff': '친절함',
  'kind_service': '친절함',
  'cleanliness': '청결도',
  'good_view': '좋은 뷰',
  'quiet_and_relax': '방음',
  'good_bedding': '침구',
  'stylish_interior': '인테리어',
  'good_aircon_heating': '냉난방',
  'well_equipped_bathroom': '욕실',
  'good_breakfast': '조식',
  'easy_parking': '주차',
  'Good_value_for_money': '가성비',
  'Great_for_group_gatherings': '단체',
  'Spacious_store': '공간감',
  'Clean_store': '깔끔함',
  'Nice_view': '좋은 뷰',
  'Large_portions': '푸짐함',
  'Delicious_food': '맛',
  'Stylish_interior': '세련됨',
  'Fresh_ingredients': '신선함',
  'Friendly': '친절',
  'Special_menu_available': '특별함',
  'Good_for_solo_dining': '혼밥',
  'Tasty_drinks': '음료',
  'Delicious_coffee': '커피',
  'Good_for_photos': '포토존',
  'Delicious_desserts': '디저트',
  'Delicious_bread': '빵'
};

const PromptKeywordBox: React.FC<PromptKeywordBoxProps> = ({ keywords }) => {
  if (keywords.length === 0) return null;

  // mapGroup 함수는 전달받은 그룹 문자열(예: "숙소[kind_service,cleanliness]")를 분석해서
  // 카테고리별 영어 키워드를 keywordMapping 사전을 통해 한글로 변환합니다.
  const mapGroup = (groupStr: string) => {
    try {
      const openBracket = groupStr.indexOf('[');
      const closeBracket = groupStr.indexOf(']');
      if (openBracket === -1 || closeBracket === -1) {
        return groupStr;
      }
      const category = groupStr.slice(0, openBracket);
      const inner = groupStr.slice(openBracket + 1, closeBracket);
      
      // 빈 괄호인 경우 그냥 카테고리만 반환
      if (!inner) {
        return category;
      }
      
      // 중괄호로 감싸진 우선순위 키워드가 있는지 확인 (예: "{key1,key2}")
      if (inner.startsWith('{') && inner.endsWith('}')) {
        const priorityContent = inner.slice(1, -1);
        if (!priorityContent) return category;
        const priorityKeywords = priorityContent.split(',');
        const mappedPriority = priorityKeywords.map((kw) => keywordMapping[kw] || kw);
        return `${category}[${mappedPriority.join(',')}]`;
      }
      
      // 일반적인 키워드 배열인 경우
      const englishKeywords = inner.split(',');
      if (!englishKeywords || englishKeywords.length === 0) {
        return category;
      }
      const mappedKeywords = englishKeywords.map((kw) => keywordMapping[kw] || kw);
      return `${category}[${mappedKeywords.join(',')}]`;
    } catch (error) {
      console.error("Error mapping keyword group:", error, groupStr);
      return groupStr;
    }
  };

  return (
    <div className="border rounded-md p-3 bg-gray-50 w-[300px] max-h-40 overflow-y-auto">
      <h3 className="text-sm font-medium mb-2 text-gray-700">프롬프트 키워드</h3>
      <p className="text-sm text-gray-400">
        {keywords.map((kw, i) => (
          <span key={kw}>
            {i > 0 && ', '}
            {mapGroup(kw)}
          </span>
        ))}
      </p>
    </div>
  );
};

export default PromptKeywordBox;
