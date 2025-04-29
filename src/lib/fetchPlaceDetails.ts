
import { Place } from '@/types/supabase';
import { supabase } from '@/lib/supabaseClient'; // ✅
import { normalizeField } from '@/lib/jeju/placeNormalizer';

// 카테고리 타입 정의
type CategoryType = '숙소' | '관광지' | '음식점' | '카페' | 'accommodation' | 'landmark' | 'restaurant' | 'cafe';

// 카테고리를 영문 테이블 prefix로 변환하는 함수
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
 * 장소 상세 정보를 조회하는 함수
 * @param category 카테고리 이름 (숙소, 관광지, 음식점, 카페 또는 영문)
 * @param id 장소 ID (숫자 또는 문자열)
 * @returns Place 객체 또는 null (정보가 없을 경우)
 */
export async function fetchPlaceDetails(category: CategoryType, id: number | string): Promise<Place | null> {
  console.log(`🔍 [fetchPlaceDetails] 상세 정보 조회 시작 - 카테고리: ${category}, ID: ${id}`);
  
  try {
    // ID가 문자열로 들어올 경우 숫자로 변환
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    
    if (isNaN(numericId)) {
      console.error(`❌ [fetchPlaceDetails] 유효하지 않은 ID: ${id}`);
      return null;
    }
    
    const prefix = mapCategoryToPrefix(category);
    
    const infoTable = `${prefix}_information`;
    const ratingTable = `${prefix}_rating`;
    const reviewTable = `${prefix}_review`;
    const linkTable = `${prefix}_link`;
    const categoryTable = `${prefix}_categories`;

    console.log(`📁 [fetchPlaceDetails] 조회 테이블: ${infoTable}, ${ratingTable}, ${reviewTable}, ${linkTable}, ${categoryTable}`);
    
    const [infoResult, ratingResult, reviewResult, linkResult, categoryResult] = await Promise.all([
      supabase.from(infoTable).select('*').eq('id', numericId).maybeSingle(),
      supabase.from(ratingTable).select('*').eq('id', numericId).maybeSingle(),
      supabase.from(reviewTable).select('*').eq('id', numericId).maybeSingle(),
      supabase.from(linkTable).select('*').eq('id', numericId).maybeSingle(),
      supabase.from(categoryTable).select('*').eq('id', numericId).maybeSingle()
    ]);

    // 기본 정보가 없으면 null 반환
    if (infoResult.error || !infoResult.data) {
      console.error(`❌ [fetchPlaceDetails] 기본 정보 없음: ${infoResult.error?.message || '데이터 없음'}`);
      return null;
    }

    // 각 쿼리 결과에서 data 필드를 추출
    const info = infoResult.data;
    const rating = ratingResult.data;
    const review = reviewResult.data;
    const link = linkResult.data;
    const categories = categoryResult.data;

    console.log('🧩 [fetchPlaceDetails] 데이터 추출 결과:', {
      info: info ? '있음' : '없음',
      rating: rating ? '있음' : '없음',
      review: review ? '있음' : '없음', 
      link: link ? '있음' : '없음',
      categories: categories ? '있음' : '없음'
    });

    // 좌표 추출
    const longitude = parseFloat(String(normalizeField(info, ['longitude', 'Longitude']) || '0'));
    const latitude = parseFloat(String(normalizeField(info, ['latitude', 'Latitude']) || '0'));

    // 데이터 매핑 및 Place 객체 생성
    const place: Place = {
      id: numericId,
      name: normalizeField(info, ['place_name', 'Place_Name']) || 'Unknown',
      address: normalizeField(info, ['road_address', 'Road_Address', 'lot_address', 'Lot_Address']) || '',
      category: prefix,
      categoryDetail: categories ? (normalizeField(categories, ['categories_details', 'Categories_Details']) || '') : '',
      rating: rating ? parseFloat(String(normalizeField(rating, ['rating']) || '0')) : 0,
      reviewCount: rating ? parseInt(String(normalizeField(rating, ['visitor_review_count']) || '0'), 10) : 0,
      weight: review ? parseFloat(String(normalizeField(review, ['visitor_norm']) || '0')) : 0,
      naverLink: link ? normalizeField(link, ['link']) || '' : '', 
      instaLink: link ? normalizeField(link, ['instagram']) || '' : '',
      x: longitude,
      y: latitude,
      operatingHours: '', // 기본값 추가
      raw: {
        info,
        rating,
        review,
        link,
        categories
      }
    };

    // 최종 데이터 검증 로그
    console.log(`✅ [fetchPlaceDetails] 최종 매핑 결과:`, {
      id: place.id,
      name: place.name || '❌ 이름 매핑 실패',
      address: place.address || '❌ 주소 매핑 실패',
      category: place.category,
      categoryDetail: place.categoryDetail || '(카테고리 상세 없음)',
      rating: place.rating || '❌ 평점 매핑 실패',
      reviewCount: place.reviewCount || '❌ 리뷰 수 매핑 실패',
      weight: place.weight || '(가중치 없음)',
      naverLink: place.naverLink || '(네이버 링크 없음)',
      instaLink: place.instaLink || '(인스타 링크 없음)',
      x: place.x || '❌ 경도 매핑 실패',
      y: place.y || '❌ 위도 매핑 실패'
    });

    return place;
  } catch (error) {
    console.error('❌ [fetchPlaceDetails] 데이터 조회 오류:', error);
    return null;
  }
}
