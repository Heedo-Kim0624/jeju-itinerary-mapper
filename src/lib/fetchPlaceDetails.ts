import { Place } from '@/types/supabase';
import { supabase } from '@/lib/supabaseClient';
import { normalizeField } from '@/lib/jeju/placeNormalizer';

// 카테고리 타입 정의
type CategoryType = '숙소' | '관광지' | '음식점' | '카페' | 'accommodation' | 'landmark' | 'restaurant' | 'cafe';

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

export async function fetchPlaceDetails(category: CategoryType, id: number | string): Promise<Place | null> {
  console.log(`🔍 [fetchPlaceDetails] 시작 - category: ${category}, id: ${id}`);

  try {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    if (isNaN(numericId)) {
      console.error(`❌ [fetchPlaceDetails] 잘못된 ID: ${id}`);
      return null;
    }

    const prefix = mapCategoryToPrefix(category);
    const infoTable = `${prefix}_information`;
    const ratingTable = `${prefix}_rating`;
    const reviewTable = `${prefix}_review`;
    const linkTable = `${prefix}_link`;
    const categoryTable = `${prefix}_categories`;

    const [infoResult, ratingResult, reviewResult, linkResult, categoryResult] = await Promise.all([
      supabase.from(infoTable).select('*').eq('id', numericId).maybeSingle(),
      supabase.from(ratingTable).select('*').eq('id', numericId).maybeSingle(),
      supabase.from(reviewTable).select('*').eq('id', numericId).maybeSingle(),
      supabase.from(linkTable).select('*').eq('id', numericId).maybeSingle(),
      supabase.from(categoryTable).select('*').eq('id', numericId).maybeSingle()
    ]);

    if (infoResult.error || !infoResult.data) {
      console.error(`❌ [fetchPlaceDetails] 정보 없음: ${infoResult.error?.message}`);
      return null;
    }

    const info = infoResult.data;
    const rating = ratingResult.data;
    const review = reviewResult.data;
    const link = linkResult.data;
    const categories = categoryResult.data;

    // 안전 매핑
    const longitude = parseFloat(String(normalizeField(info, ['longitude', 'Longitude']) ?? '0'));
    const latitude = parseFloat(String(normalizeField(info, ['latitude', 'Latitude']) ?? '0'));

    const nameRaw = normalizeField(info, ['place_name', 'Place_Name']);
    const addressRaw = normalizeField(info, ['road_address', 'Road_Address', 'lot_address', 'Lot_Address']);

    const ratingRaw = rating ? normalizeField(rating, ['rating']) : undefined;
    const reviewCountRaw = rating ? normalizeField(rating, ['visitor_review_count']) : undefined;
    const weightRaw = review ? normalizeField(review, ['visitor_norm']) : undefined;
    const naverLinkRaw = link ? normalizeField(link, ['link']) : undefined;
    const instaLinkRaw = link ? normalizeField(link, ['instagram']) : undefined;
    const categoryDetailRaw = categories ? normalizeField(categories, ['categories_details', 'Categories_Details']) : '';

    const place: Place = {
      id: numericId,
      name: typeof nameRaw === 'string' ? nameRaw : 'Unknown',
      address: typeof addressRaw === 'string' ? addressRaw : '',
      category: prefix,
      categoryDetail: typeof categoryDetailRaw === 'string' ? categoryDetailRaw : '',
      rating: ratingRaw !== undefined && !isNaN(Number(ratingRaw)) ? parseFloat(String(ratingRaw)) : 0,
      reviewCount: reviewCountRaw !== undefined && !isNaN(Number(reviewCountRaw)) ? parseInt(String(reviewCountRaw), 10) : 0,
      weight: weightRaw !== undefined && !isNaN(Number(weightRaw)) ? parseFloat(String(weightRaw)) : 0,
      naverLink: typeof naverLinkRaw === 'string' ? naverLinkRaw : '',
      instaLink: typeof instaLinkRaw === 'string' ? instaLinkRaw : '',
      x: longitude,
      y: latitude,
      operatingHours: '',
      raw: {
        info,
        rating,
        review,
        link,
        categories
      }
    };

    console.log(`✅ [fetchPlaceDetails] 최종 결과:`, place);
    return place;
  } catch (error) {
    console.error('❌ [fetchPlaceDetails] 오류 발생:', error);
    return null;
  }
}
