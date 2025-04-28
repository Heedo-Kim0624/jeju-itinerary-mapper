import { supabase } from '@/lib/supabaseClient';
import { TravelCategory } from '@/types/travel';
import { categoryTableMap, categoryRatingMap } from '@/lib/jeju/dbMapping';

/**
 * 필드명을 소문자 기준으로 찾아주는 보조 함수
 */
function normalizeField(obj: any, field: string): any {
  if (obj[field] !== undefined) return obj[field];

  const lowerField = field.toLowerCase();
  for (const key in obj) {
    if (key.toLowerCase() === lowerField) {
      return obj[key];
    }
  }

  return undefined;
}

export async function fetchPlaceData(
  category: TravelCategory,
  locations: string[]
) {
  if (!categoryTableMap[category] || !categoryRatingMap[category]) {
    console.error(`Invalid category: ${category}`);
    return { places: [], ratings: [], categories: [], links: [], reviews: [] };
  }

  const infoTable = categoryTableMap[category];
  const ratingTable = categoryRatingMap[category];
  const reviewTable = `${category}_review`;

  try {
    // 👉 장소 기본 정보 가져오기
    let query = supabase.from(infoTable).select('*');
    if (locations.length > 0) {
      query = query.in('location', locations);
    }

    const { data: places, error: placesError } = await query;
    if (placesError) {
      console.error('Places fetch error:', placesError);
      return { places: [], ratings: [], categories: [], links: [], reviews: [] };
    }
    if (!places || places.length === 0) {
      console.log('No places found matching the criteria');
      return { places: [], ratings: [], categories: [], links: [], reviews: [] };
    }

    // 👉 여기서 주의: 원본 숫자형 id만 추출
    const placeIds = places
      .map(p => normalizeField(p, 'id')) // id 필드를 정확히 찾아서
      .filter(id => typeof id === 'number' || !isNaN(Number(id)))
      .map(id => Number(id)); // 숫자로 확실히 변환

    // 👉 추가 데이터 병렬로 가져오기
    const [ratingsResult, categoriesResult, linksResult, reviewsResult] = await Promise.all([
      supabase.from(ratingTable).select('*').in('id', placeIds),
      supabase.from(`${category}_categories`).select('*').in('id', placeIds),
      supabase.from(`${category}_link`).select('*').in('id', placeIds),
      supabase.from(reviewTable).select('*').in('id', placeIds),
    ]);

    // 👉 결과 정리
    return {
      places: places.map((info: any) => ({
        dbId: normalizeField(info, 'id'), // DB 매칭용 id (숫자)
        id: `${category}-${normalizeField(info, 'id')}`, // 표시용 id (문자열)
        name: normalizeField(info, 'place_name') || '',
        address: normalizeField(info, 'road_address') || normalizeField(info, 'lot_address') || '',
        category,
        categoryDetail: '', // 이후 매칭해서 채울 수 있음
        x: parseFloat(normalizeField(info, 'longitude') || '0'),
        y: parseFloat(normalizeField(info, 'latitude') || '0'),
        naverLink: '',
        instaLink: '',
        rating: 0,
        reviewCount: 0,
        operatingHours: '',
        weight: 0,
      })),
      ratings: ratingsResult.data || [],
      categories: categoriesResult.data || [],
      links: linksResult.data || [],
      reviews: reviewsResult.data || [],
    };
  } catch (error) {
    console.error('Error in fetchPlaceData:', error);
    return { places: [], ratings: [], categories: [], links: [], reviews: [] };
  }
}
