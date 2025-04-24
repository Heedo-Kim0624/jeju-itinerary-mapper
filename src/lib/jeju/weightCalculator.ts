
interface KeywordWeight {
  keyword: string;
  weight: number;
}

export function calculateWeights(
  rankedKeywords: string[],
  unrankedKeywords: string[],
): KeywordWeight[] {
  const weights: KeywordWeight[] = [];
  
  // 순위별 가중치 (1순위: 0.4, 2순위: 0.3, 3순위: 0.2)
  const rankedWeights = [0.4, 0.3, 0.2];
  
  // 랭크된 키워드에 가중치 할당
  rankedKeywords.forEach((keyword, index) => {
    if (index < rankedWeights.length) {
      weights.push({
        keyword,
        weight: rankedWeights[index]
      });
    }
  });

  // 남은 가중치 계산
  const usedWeight = weights.reduce((sum, item) => sum + item.weight, 0);
  const remainingWeight = Math.max(0, 1 - usedWeight);
  
  // 순위 없는 키워드들에 동일한 가중치 분배
  if (unrankedKeywords.length > 0) {
    const equalWeight = remainingWeight / unrankedKeywords.length;
    unrankedKeywords.forEach(keyword => {
      weights.push({
        keyword,
        weight: equalWeight
      });
    });
  }

  return weights;
}

// 정규화된 점수 계산 함수 (키워드 가중치와 리뷰 정규화 값 적용)
export function calculatePlaceScore(
  place: any,
  keywordWeights: KeywordWeight[],
  reviewNorm: number
): number {
  let totalScore = 0;

  // 각 키워드에 대한 점수 계산
  keywordWeights.forEach(({ keyword, weight }) => {
    // 키워드에 대한 점수 조회 (대소문자/언더스코어 무관)
    const keywordValue = findKeywordValue(place, keyword);
    
    // 가중치와 키워드 점수를 곱하여 합산
    totalScore += keywordValue * weight;
  });

  // 최종 점수에 리뷰 정규화 값을 곱함
  return totalScore * reviewNorm;
}

// 대소문자와 언더스코어를 무시하고 객체에서 키를 찾는 헬퍼 함수
function findKeywordValue(obj: any, keyword: string): number {
  // 정확히 일치하는 키가 있는지 확인
  if (obj[keyword] !== undefined) {
    return parseFloat(obj[keyword]) || 0;
  }
  
  // 대소문자와 언더스코어 차이를 무시하고 검색
  const normalizedKeyword = keyword.toLowerCase().replace(/_/g, '');
  
  for (const key in obj) {
    if (key.toLowerCase().replace(/_/g, '') === normalizedKeyword) {
      return parseFloat(obj[key]) || 0;
    }
  }
  
  return 0; // 키워드를 찾지 못한 경우 0 반환
}
