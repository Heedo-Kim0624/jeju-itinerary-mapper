import { Place } from '@/types/supabase';
//import { supabase } from '@/lib/supabaseClient';
import { supabaseDirect } from '@/lib/supabaseDirectClient'; // ✅
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
 * @param id 장소 ID (숫자)
 * @returns Place 객체 또는 null (정보가 없을 경우)
 */
export async function fetchPlaceDetails(category: CategoryType, id: number): Promise<Place | null> {
  console.log(`🔍 [fetchPlaceDetails] 상세 정보 조회 시작 - 카테고리: ${category}, ID: ${id}`);
  
  try {
    const prefix = mapCategoryToPrefix(category);
    
    const infoTable = `${prefix}_information`;
    const ratingTable = `${prefix}_rating`;
    const reviewTable = `${prefix}_review`;
    const linkTable = `${prefix}_link`;
    const categoryTable = `${prefix}_categories`;

    console.log(`📁 [fetchPlaceDetails] 조회 테이블: ${infoTable}, ${linkTable}`);
    
    // 병렬로 데이터 조회
    const [infoResult, ratingResult, reviewResult, linkResult, categoryResult] = await Promise.all([
      supabase.from(infoTable).select('*').eq('id', id).maybeSingle(),
      supabase.from(ratingTable).select('*').eq('id', id).maybeSingle(),
      supabase.from(reviewTable).select('*').eq('id', id).maybeSingle(),
      supabase.from(linkTable).select('*').eq('id', id).maybeSingle(),
      supabase.from(categoryTable).select('*').eq('id', id).maybeSingle()
    ]);

    if (infoResult.error || !infoResult.data) {
      console.error(`❌ [fetchPlaceDetails] 기본 정보 없음: ${infoResult.error?.message || '데이터 없음'}`);
      return null;
    }

    if (linkResult.error) {
      console.error(`❌ [fetchPlaceDetails] 링크 조회 에러:`, linkResult.error);
    }

    const info = infoResult.data;
    const rating = ratingResult.data;
    const review = reviewResult.data;
    const link = linkResult.data;
    const categories = categoryResult.data;
    console.log('🧩 [fetchPlaceDetails] linkResult.data:', link);
    console.log('🧩 [fetchPlaceDetails] normalizeField(link, ["link"]):', normalizeField(link, ['link']));
    console.log(`✅ [fetchPlaceDetails] 데이터 조회 완료:`, {
      정보: info ? '있음' : '없음',
      평점: rating ? '있음' : '없음',
      리뷰: review ? '있음' : '없음',
      링크: link ? '있음' : '없음',
      카테고리: categories ? '있음' : '없음'
    });

    // naverLink / instaLink 정상 디버깅 추가
    const naverLink = link ? normalizeField(link, ['link']) || '' : '';
    const instaLink = link ? normalizeField(link, ['instagram']) || '' : '';

    console.log(`🔗 [fetchPlaceDetails] 링크 정보`, { naverLink, instaLink });

    const place: Place = {
      id: id,
      name: normalizeField(info, ['place_name', 'Place_Name']) || 'Unknown',
      address: normalizeField(info, ['road_address', 'Road_Address', 'lot_address', 'Lot_Address']) || '',
      category: prefix,
      categoryDetail: categories ? (normalizeField(categories, ['categories_details', 'Categories_Details']) || '') : '',
      rating: rating ? parseFloat(String(normalizeField(rating, ['rating']) || '0')) : 0,
      reviewCount: rating ? parseInt(String(normalizeField(rating, ['visitor_review_count']) || '0'), 10) : 0,
      weight: review ? parseFloat(String(normalizeField(review, ['visitor_norm']) || '0')) : 0,
      naverLink: link?.link ?? '',          
      instaLink: link?.instagram ?? '',      
      raw: {
        info,
        rating,
        review,
        link,
        categories
      }
    };
    

    console.log(`✅ [fetchPlaceDetails] 최종 Place 객체:`, place);

    return place;
  } catch (error) {
    console.error('❌ [fetchPlaceDetails] 데이터 조회 오류:', error);
    return null;
  }
}
