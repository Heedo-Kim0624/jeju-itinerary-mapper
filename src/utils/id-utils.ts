
/**
 * ID를 정수형으로 변환
 * @param id 문자열 또는 숫자 형태의 ID
 * @returns 정수형 ID, 변환 불가능한 경우 null 반환
 */
export const parseIntId = (id: string | number | undefined | null): number | null => {
  if (id === undefined || id === null) return null;
  
  try {
    // 문자열인 경우 정수로 변환
    if (typeof id === 'string') {
      // "N<number>" 형태의 ID (예: "N123") 처리
      if (id.startsWith('N') && id.length > 1) {
        const numericPart = id.substring(1);
        const parsedNumericPart = parseInt(numericPart, 10);
        return isNaN(parsedNumericPart) ? null : parsedNumericPart;
      }
      const parsedId = parseInt(id, 10);
      return isNaN(parsedId) ? null : parsedId;
    }
    
    // 이미 숫자인 경우 그대로 반환 (정수 확인)
    if (typeof id === 'number') {
      return Number.isInteger(id) ? id : Math.floor(id); // 소수점 버림 처리도 포함
    }
    
    return null; // 그 외 타입은 null 처리
  } catch (e) {
    console.warn(`[parseIntId] ID 변환 실패: ${id}`, e);
    return null;
  }
};

/**
 * 두 ID가 동일한지 비교 (정수형 변환 후)
 * @param id1 첫 번째 ID
 * @param id2 두 번째 ID
 * @returns 두 ID가 동일하면 true, 아니면 false
 */
export const isSameId = (id1: string | number | undefined | null, id2: string | number | undefined | null): boolean => {
  const parsedId1 = parseIntId(id1);
  const parsedId2 = parseIntId(id2);
  
  // 둘 다 null이 아니고 값이 같으면 true
  return parsedId1 !== null && parsedId2 !== null && parsedId1 === parsedId2;
};

