
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

export function calculatePlaceScore(
  place: any,
  keywordWeights: KeywordWeight[],
  reviewNorm: number
): number {
  let totalScore = 0;

  keywordWeights.forEach(({ keyword, weight }) => {
    // 키워드에 해당하는 리뷰 점수를 가져옴
    const keywordScore = place[keyword] || 0;
    // 가중치와 리뷰 점수를 곱하여 합산
    totalScore += keywordScore * weight;
  });

  // 최종 점수에 리뷰 정규화 값을 곱함
  return totalScore * reviewNorm;
}
