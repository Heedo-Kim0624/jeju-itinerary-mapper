
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
export const dayStringToIndex = (dayString: string): number | null => {
  // Ensure dayString is one of the keys in DAY_TO_INDEX_MAP
  if (dayString in DAY_TO_INDEX_MAP) {
    return DAY_TO_INDEX_MAP[dayString];
  }
  // Try to parse if it's already a number string like "1", "2"
  const numericDay = parseInt(dayString, 10);
  if (!isNaN(numericDay) && numericDay >= 1 && numericDay <= 7) {
    return numericDay;
  }
  console.warn(`[dayStringToIndex] Unknown day string: ${dayString}`);
  return null; // Return null for invalid input
};

// 숫자 인덱스를 요일 문자열로 변환
export const indexToDayString = (index: number): string | null => {
  if (index in INDEX_TO_DAY_MAP) {
    return INDEX_TO_DAY_MAP[index];
  }
  console.warn(`[indexToDayString] Unknown day index: ${index}`);
  return null; // Return null for invalid input
};
