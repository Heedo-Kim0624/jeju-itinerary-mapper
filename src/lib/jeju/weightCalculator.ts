
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

  // 가중치 계산 로그
  console.log('가중치 계산 결과:');
  weights.forEach(w => {
    console.log(`- ${w.keyword}: ${w.weight.toFixed(3)} (${(w.weight * 100).toFixed(1)}%)`);
  });

  return weights;
}

/**
 * Helper function to extract values from objects regardless of field case
 */
function getFieldValue(obj: any, fieldNames: string[]): any {
  // Try exact matches first
  for (const field of fieldNames) {
    if (obj[field] !== undefined) return obj[field];
  }
  
  // Try case-insensitive match
  const lowerFieldNames = fieldNames.map(f => f.toLowerCase());
  for (const key of Object.keys(obj)) {
    const lowerKey = key.toLowerCase();
    const index = lowerFieldNames.findIndex(f => f === lowerKey);
    if (index >= 0) {
      return obj[key];
    }
  }
  
  return 0; // Default value
}

export function calculatePlaceScore(
  place: any,
  keywordWeights: KeywordWeight[],
  reviewNorm: number
): number {
  let totalScore = 0;
  let foundKeywords = 0;
  let matchedKeywords: { keyword: string; value: number }[] = [];

  // 디버깅을 위해 입력 값 출력
  console.log(`장소 가중치 계산 시작 (리뷰 정규화: ${reviewNorm})`);
  console.log('장소 객체 속성:', Object.keys(place));

  // 각 키워드에 대한 점수 계산
  keywordWeights.forEach(({ keyword, weight }) => {
    // 키워드에 대한 점수 조회 (여러 가능한 필드 이름 시도)
    // 예: "coffee", "Coffee", "coffee_score", "Coffee_Score" 등
    const possibleFields = [
      keyword, 
      keyword.toLowerCase(), 
      keyword.toUpperCase(),
      `${keyword}_score`,
      `${keyword.toLowerCase()}_score`,
      `${keyword}_rating`,
      `${keyword.toLowerCase()}_rating`
    ];
    
    const keywordValue = getFieldValue(place, possibleFields);
    
    if (keywordValue > 0) {
      foundKeywords++;
      matchedKeywords.push({ keyword, value: keywordValue });
      console.log(`  - 키워드 '${keyword}' 값: ${keywordValue}, 가중치: ${weight.toFixed(3)}, 곱: ${(keywordValue * weight).toFixed(3)}`);
    } else {
      console.log(`  - 키워드 '${keyword}' 값: 없음 (0)`);
    }
    
    // 가중치와 키워드 점수를 곱하여 합산
    totalScore += keywordValue * weight;
  });

  // 키워드를 하나도 못찾았다면 가중치를 0으로 설정
  if (foundKeywords === 0 && keywordWeights.length > 0) {
    console.log(`  - 일치하는 키워드가 없습니다. 점수 0 반환`);
    return 0;
  }

  // 최종 점수에 리뷰 정규화 값을 곱함
  const finalScore = totalScore * reviewNorm;

  // 계산 결과 로깅
  console.log('가중치 계산 결과:', {
    place_name: place.place_name || place.Place_Name || '이름 없음',
    matched_keywords: matchedKeywords,
    total_score: totalScore,
    review_norm: reviewNorm,
    final_score: finalScore
  });

  return finalScore;
}
