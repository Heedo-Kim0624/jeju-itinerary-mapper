
import { Place } from '@/types/supabase';
import { supabase } from '@/lib/supabaseClient';
import { normalizeField } from '@/lib/jeju/placeNormalizer';

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

    const [infoResult, ratingResult, linkResult, categoryResult] = await Promise.all([
      supabase.from(`${prefix}_information`).select('*').eq('id', numericId).maybeSingle(),
      supabase.from(`${prefix}_rating`).select('*').eq('id', numericId).maybeSingle(),
      supabase.from(`${prefix}_link`).select('*').eq('id', numericId).maybeSingle(),
      supabase.from(`${prefix}_categories`).select('*').eq('id', numericId).maybeSingle(),
    ]);

    if (infoResult.error || !infoResult.data) {
      console.error('❌ 기본 정보 없음:', infoResult.error?.message || '정보 없음');
      return null;
    }

    console.log('📋 [fetchPlaceDetails] 데이터 조회 결과:', {
      info: infoResult.data,
      rating: ratingResult.data,
      link: linkResult.data,
      category: categoryResult.data
    });

    // 기본 정보 변환
    const info = infoResult.data;
    const rating = ratingResult.data || {};
    const link = linkResult.data || {};
    const categoryData = categoryResult.data || {}; 

    // 좌표 변환
    const longitude = normalizeField(info, ['longitude', 'Longitude', 'x', 'X']) || 0;
    const latitude = normalizeField(info, ['latitude', 'Latitude', 'y', 'Y']) || 0;
    
    // 평점 정보
    const ratingValue = normalizeField(rating, ['rating', 'Rating']) || 0;
    const reviewCount = normalizeField(rating, ['visitor_review_count', 'Visitor_Review_Count']) || 0;
    const weight = normalizeField(rating, ['visitor_norm']) || 0;
    
    // 카테고리 정보
    const categoryDetail = normalizeField(categoryData, ['categories_details', 'Categories_Details']) || '';
    
    // 링크 정보
    const naverLink = normalizeField(link, ['link', 'Link']) || '';
    const instaLink = normalizeField(link, ['instagram', 'Instagram']) || '';

    // 장소명과 주소
    const name = normalizeField(info, ['place_name', 'Place_Name']) || 'Unknown';
    const roadAddress = normalizeField(info, ['road_address', 'Road_Address']) || '';
    const lotAddress = normalizeField(info, ['lot_address', 'Lot_Address']) || '';
    const address = roadAddress || lotAddress || '';

    const place: Place = {
      id: numericId,
      name: name,
      address: address,
      category: prefix,
      categoryDetail: categoryDetail,
      rating: parseFloat(String(ratingValue)),
      reviewCount: parseInt(String(reviewCount), 10),
      weight: parseFloat(String(weight)),
      naverLink: naverLink,
      instaLink: instaLink,
      x: parseFloat(String(longitude)),
      y: parseFloat(String(latitude)),
      operatingHours: ''
    };

    console.log('✅ [fetchPlaceDetails] 최종 매핑 결과:', place);
    return place;
  } catch (error) {
    console.error('❌ [fetchPlaceDetails] 에러:', error);
    return null;
  }
}
