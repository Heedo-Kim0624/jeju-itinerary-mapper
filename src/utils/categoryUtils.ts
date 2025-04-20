
export const categoryMap = {
  '숙소': 'accomodation',
  '관광지': 'landmark',
  '음식점': 'restaurant',
  '카페': 'cafe',
} as const;

export type CategoryName = keyof typeof categoryMap;
export type CategoryKeywords = Record<CategoryName, string[]>;
