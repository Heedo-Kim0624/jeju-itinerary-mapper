
export * from '@/types/travel';
export * from './dbMapping';
export * from './promptParser';
export * from './weightCalculator';
export * from './placeNormalizer';
export * from './placeScoring';
export * from './interfaces';

// Explicitly re-export PlaceResult to resolve ambiguity
export type { PlaceResult } from '@/types/travel';

// Re-export functions needed by components
export { calculatePlaceScore } from './placeScoring';
export { fetchWeightedResults } from './promptParser';

// Add the missing convertToPlace function
export function convertToPlace(placeResult: any) {
  console.log('🔄 [Convert] Place 객체로 변환 중:', placeResult.place_name || placeResult.id || '이름 없음');
  
  const place = {
    id: placeResult.id || '',
    name: placeResult.place_name || '',
    address: placeResult.road_address || '',
    category: placeResult.category || '',
    categoryDetail: placeResult.categoryDetail || '',
    x: placeResult.x || 0,
    y: placeResult.y || 0,
    rating: placeResult.rating || 0,
    reviewCount: placeResult.visitor_review_count || 0,
    weight: placeResult.visitor_norm || 0,
    naverLink: placeResult.naverLink || '',
    instaLink: placeResult.instaLink || ''
  };
  
  console.log('✅ [Convert] 변환 완료:', { 
    id: place.id, 
    이름: place.name, 
    주소: place.address.substring(0, 20) + (place.address.length > 20 ? '...' : ''),
    평점: place.rating
  });
  
  return place;
}
