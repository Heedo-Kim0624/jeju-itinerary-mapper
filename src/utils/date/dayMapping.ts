
export const DAY_TO_INDEX_MAP: Record<string, number> = {
  'Mon': 1,
  'Tue': 2,
  'Wed': 3,
  'Thu': 4,
  'Fri': 5,
  'Sat': 6,
  'Sun': 7
};

export const INDEX_TO_DAY_MAP: Record<number, string> = {
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
  7: 'Sun'
};

// 요일 문자열을 숫자 인덱스로 변환
export const dayStringToIndex = (dayString: string): number => {
  const upperCaseDayString = dayString.charAt(0).toUpperCase() + dayString.slice(1).toLowerCase();
  return DAY_TO_INDEX_MAP[upperCaseDayString] || 0;
};

// 숫자 인덱스를 요일 문자열로 변환
export const indexToDayString = (index: number): string => {
  return INDEX_TO_DAY_MAP[index] || '';
};
