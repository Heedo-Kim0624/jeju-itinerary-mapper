
import { Place } from '@/types/supabase';
import { supabase } from '@/lib/supabaseClient';
import { normalizeField } from '@/services/utils/supabaseUtils';

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

    // 데이터 가져오기
    const [infoResult, ratingResult, linkResult, categoryResult, reviewResult] = await Promise.all([
      supabase.from(`${prefix}_information`).select('*').eq('id', numericId).maybeSingle(),
      supabase.from(`${prefix}_rating`).select('*').eq('id', numericId).maybeSingle(),
      supabase.from(`${prefix}_link`).select('*').eq('id', numericId).maybeSingle(),
      supabase.from(`${prefix}_categories`).select('*').eq('id', numericId).maybeSingle(),
      supabase.from(`${prefix}_review`).select('*').eq('id', numericId).maybeSingle(),
    ]);

    // 필요한 데이터만 추출
    const info = infoResult.data;
    const rating = ratingResult.data;
    const link = linkResult.data;
    const categories = categoryResult.data;
    const review = reviewResult.data;

    if (!info) {
      console.error('❌ 기본 정보 없음:', infoResult.error?.message || '정보 없음');
      return null;
    }

    // 기본 정보에서 필드 추출 (대소문자 구분 없음)
    const place_name = normalizeField(info, ['place_name', 'Place_Name', 'name', 'Name']) || '';
    const road_address = normalizeField(info, ['road_address', 'Road_Address', 'roadAddress']) || '';
    const lot_address = normalizeField(info, ['lot_address', 'Lot_Address', 'lotAddress']) || '';
    const address = road_address || lot_address || '';
    const longitude = parseFloat(String(normalizeField(info, ['longitude', 'Longitude', 'x', 'X']) || 0));
    const latitude = parseFloat(String(normalizeField(info, ['latitude', 'Latitude', 'y', 'Y']) || 0));
    
    // 평점 정보 추출
    const ratingValue = rating ? parseFloat(String(normalizeField(rating, ['rating', 'Rating']) || 0)) : 0;
    const reviewCount = rating ? parseInt(String(normalizeField(rating, ['visitor_review_count', 'Visitor_Review_Count']) || 0)) : 0;
    
    // 카테고리 및 링크 정보 추출
    const categoryDetail = categories ? String(normalizeField(categories, ['categories_details', 'Categories_Details']) || '') : '';
    const naverLink = link ? String(normalizeField(link, ['link', 'Link']) || '') : '';
    const instaLink = link ? String(normalizeField(link, ['instagram', 'Instagram']) || '') : '';
    
    // 가중치 정보 추출
    const weight = review ? parseFloat(String(normalizeField(review, ['visitor_norm']) || 0)) : 0;

    // Place 객체 생성
    const place: Place = {
      id,
      name: place_name,
      address,
      category: prefix,
      categoryDetail,
      rating: ratingValue,
      reviewCount,
      weight,
      naverLink,
      instaLink,
      x: longitude,
      y: latitude,
      operatingHours: '',
      raw: {
        info,
        rating,
        link,
        categories,
        review
      }
    };

    console.log('✅ [fetchPlaceDetails] 완료:', { 
      이름: place.name, 
      평점: place.rating, 
      리뷰수: place.reviewCount,
      좌표: `${place.x}, ${place.y}`
    });

    return place;
  } catch (error) {
    console.error('❌ [fetchPlaceDetails] 에러:', error);
    return null;
  }
}
