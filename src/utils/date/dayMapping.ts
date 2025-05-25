
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
  // Ensure dayString is a valid key
  if (dayString in DAY_TO_INDEX_MAP) {
    return DAY_TO_INDEX_MAP[dayString];
  }
  // Check for numeric strings if they represent days directly (e.g. "1" for day 1)
  const numericDay = parseInt(dayString, 10);
  if (!isNaN(numericDay) && numericDay >= 1 && numericDay <= 7) {
      // If it's already a number that could be an index, and we want to map it from a string key like "1"
      // This case might need clarification based on expected inputs.
      // For now, assume dayString is "Mon", "Tue" etc.
  }
  // Fallback for cases where dayString might be like "Day1", "1일차" etc. - needs more robust parsing if so.
  // For now, strict mapping.
  return null; // Return null if not found to indicate an issue.
};

// 숫자 인덱스를 요일 문자열로 변환
export const indexToDayString = (index: number): string | null => {
  if (index in INDEX_TO_DAY_MAP) {
    return INDEX_TO_DAY_MAP[index];
  }
  return null; // Return null if not found.
};
