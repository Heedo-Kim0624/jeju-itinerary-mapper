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
 * 두 ID가 동일한지 비교. 
 * 서버 ID는 숫자일 수 있고, 클라이언트 ID는 문자열일 수 있으므로,
 * 문자열로 변환하여 비교하거나, parseIntId 결과를 비교합니다.
 * 여기서는 parseIntId 결과를 비교하는 현재 로직을 유지하되, 
 * 모든 ID가 문자열로 관리된다면 직접 문자열 비교가 더 안전합니다.
 * @param id1 첫 번째 ID
 * @param id2 두 번째 ID
 * @returns 두 ID가 동일하면 true, 아니면 false
 */
export const isSameId = (id1: string | number | undefined | null, id2: string | number | undefined | null): boolean => {
  const strId1 = id1 !== undefined && id1 !== null ? String(id1) : null;
  const strId2 = id2 !== undefined && id2 !== null ? String(id2) : null;

  if (strId1 === null || strId2 === null) {
    return false;
  }
  
  // "N<number>" 형태와 그냥 "<number>" 형태를 동일하게 취급하기 위한 정규화
  const normalize = (id: string) => id.startsWith('N') ? id.substring(1) : id;

  return normalize(strId1) === normalize(strId2);
};
