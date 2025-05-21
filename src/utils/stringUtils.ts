/**
 * 장소 이름을 정규화하는 함수.
 * 소문자 변환, 양끝 공백 제거, 연속 공백 단일화, 특정 특수문자 제거, 특정 접미사 제거.
 */
export const normalizePlaceName = (name: string): string => {
  if (!name) return '';
  return name.toLowerCase().trim()
    .replace(/\s+/g, ' ')           // 연속된 공백을 하나로
    .replace(/[^\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318FA-Za-z0-9\s]/g, '')   // 한글, 영문, 숫자, 공백 제외한 특수문자 제거
    .replace(/\s*(점|지점|매장|본점|지사|센터)\s*$/, '') // 주요 접미사 제거
    .trim(); // 접미사 제거 후 추가 공백 제거
};

/**
 * 두 문자열의 유사도를 계산하는 함수 (0~1 사이 값, 1이 완전 일치)
 * 레벤슈타인 거리를 사용합니다. 정규화된 이름을 기준으로 비교합니다.
 */
export const calculateStringSimilarity = (str1: string, str2: string): number => {
  // 개선된 정규화 함수 사용
  const normalizedStr1 = normalizePlaceName(str1);
  const normalizedStr2 = normalizePlaceName(str2);

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
  if (maxLength === 0) return 1; // 두 문자열 모두 비어있는 경우

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
