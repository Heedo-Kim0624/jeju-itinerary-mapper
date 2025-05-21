
/**
 * 두 문자열의 유사도를 계산하는 함수 (0~1 사이 값, 1이 완전 일치)
 * 레벤슈타인 거리를 사용합니다.
 */
export const calculateStringSimilarity = (str1: string, str2: string): number => {
  // 모두 소문자로 변환하고 공백 제거
  const normalizedStr1 = str1.toLowerCase().replace(/\s+/g, '');
  const normalizedStr2 = str2.toLowerCase().replace(/\s+/g, '');

  if (normalizedStr1 === normalizedStr2) return 1; // 완전 일치
  if (normalizedStr1.length === 0 || normalizedStr2.length === 0) return 0;

  const matrix: number[][] = [];

  for (let i = 0; i <= normalizedStr1.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= normalizedStr2.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= normalizedStr1.length; i++) {
    for (let j = 1; j <= normalizedStr2.length; j++) {
      const cost = normalizedStr1[i - 1] === normalizedStr2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // 삭제
        matrix[i][j - 1] + 1, // 삽입
        matrix[i - 1][j - 1] + cost // 대체
      );
    }
  }

  const distance = matrix[normalizedStr1.length][normalizedStr2.length];
  const maxLength = Math.max(normalizedStr1.length, normalizedStr2.length);

  // 유사도 = 1 - (편집거리 / 최대길이)
  return 1 - distance / maxLength;
};

/**
 * 문자열 배열에서 주어진 문자열과 가장 유사한 항목을 찾는 함수
 */
export const findMostSimilarString = (
  target: string,
  candidates: string[],
  threshold = 0.7 // 유사도 임계값 (0.7 이상이면 유사하다고 판단)
): { match: string | null; similarity: number } => {
  if (!candidates.length) return { match: null, similarity: 0 };

  let bestMatch = null;
  let highestSimilarity = 0;

  for (const candidate of candidates) {
    const similarity = calculateStringSimilarity(target, candidate);
    if (similarity > highestSimilarity) {
      highestSimilarity = similarity;
      bestMatch = candidate;
    }
  }

  return {
    match: highestSimilarity >= threshold ? bestMatch : null,
    similarity: highestSimilarity,
  };
};
