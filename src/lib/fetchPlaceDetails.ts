import { Place } from '@/types/supabase';
import { supabase } from '@/lib/supabaseClient';

// 카테고리 타입 정의
type CategoryType = '숙소' | '관광지' | '음식점' | '카페' | 'accommodation' | 'landmark' | 'restaurant' | 'cafe';

// 카테고리를 영문 prefix로 변환
function mapCategoryToPrefix(category: CategoryType): string {
  const mapping: Record<CategoryType, string> = {
    '숙소': 'accommodation',
    '관광지': 'landmark',
    '음식점': 'restaurant',
    '카페': 'cafe',
    'accommodation': 'accommodation',
    'landmark': 'landmark',
    'restaurant': 'restaurant',
    'cafe': 'cafe'
  };
  return mapping[category];
}

/**
 * 장소 상세 정보 조회
 */
export async function fetchPlaceDetails(category: CategoryType, id: number | string): Promise<Place | null> {
  console.log(`🔍 [fetchPlaceDetails] 시작 - category: ${category}, id: ${id}`);
  
  try {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    if (isNaN(numericId)) {
      console.error('❌ ID가 숫자가 아닙니다:', id);
      return null;
    }

    const prefix = mapCategoryToPrefix(category);

    const [infoResult, ratingResult, reviewResult, linkResult, categoryResult] = await Promise.all([
      supabase.from(`${prefix}_information`).select('*').eq('id', numericId).maybeSingle(),
      supabase.from(`${prefix}_rating`).select('*').eq('id', numericId).maybeSingle(),
      supabase.from(`${prefix}_review`).select('*').eq('id', numericId).maybeSingle(),
      supabase.from(`${prefix}_link`).select('*').eq('id', numericId).maybeSingle(),
      supabase.from(`${prefix}_categories`).select('*').eq('id', numericId).maybeSingle(),
    ]);

    if (infoResult.error || !infoResult.data) {
      console.error('❌ 기본 정보 없음:', infoResult.error?.message || '정보 없음');
      return null;
    }

    const info = infoResult.data;
    const rating = ratingResult.data;
    const review = reviewResult.data;
    const link = linkResult.data;
    const categoryData = categoryResult.data; // ✅ 이름을 바꿔야 충돌 없음

    console.log('🧩 [fetchPlaceDetails] 쿼리 결과:', {
      info: !!info, rating: !!rating, review: !!review, link: !!link, category: !!categoryData,
    });

    const longitude = typeof info.longitude === 'number' ? info.longitude :
                      typeof info.Longitude === 'number' ? info.Longitude : 0;
    const latitude = typeof info.latitude === 'number' ? info.latitude :
                     typeof info.Latitude === 'number' ? info.Latitude : 0;

    const place: Place = {
      id: numericId,
      name: info.place_name ?? 'Unknown',
      address: info.road_address ?? info.lot_address ?? '',
      category: prefix,
      categoryDetail: categoryData?.categories_details ?? '',
      rating: rating?.rating ?? 0,
      reviewCount: rating?.visitor_review_count ?? 0,
      weight: review?.visitor_norm ?? 0,
      naverLink: link?.link ?? '',
      instaLink: link?.instagram ?? '',
      x: longitude,
      y: latitude,
      raw: {
        info,
        rating,
        review,
        link,
        category: categoryData
      }
    };

    console.log('✅ [fetchPlaceDetails] 최종 매핑 결과:', place);

    return place;
  } catch (error) {
    console.error('❌ [fetchPlaceDetails] 에러:', error);
    return null;
  }
}
