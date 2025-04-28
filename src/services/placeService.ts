import { supabase } from '@/lib/supabaseClient';
import { TravelCategory } from '@/types/travel';
import { categoryTableMap, categoryRatingMap } from '@/lib/jeju/dbMapping';

// 필드명을 유연하게 찾는 함수
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
    return { places: [] };
  }

  const infoTable = categoryTableMap[category];
  const ratingTable = categoryRatingMap[category];
  const reviewTable = `${category}_review`;
  const linkTable = `${category}_link`;
  const categoryDetailTable = `${category}_categories`;

  try {
    // 1. 장소 기본 정보 가져오기
    let query = supabase.from(infoTable).select('*');
    if (locations.length > 0) {
      query = query.in('location', locations);
    }
    const { data: places, error: placesError } = await query;

    if (placesError) {
      console.error('Places fetch error:', placesError);
      return { places: [] };
    }
    if (!places || places.length === 0) {
      console.log('No places found matching the criteria');
      return { places: [] };
    }

    // 2. id 리스트 만들기 (가공 없이 숫자형 그대로)
    const placeIds = places
      .map(p => normalizeField(p, 'id'))
      .filter(id => typeof id === 'number');

    // 3. 추가 데이터 병렬로 가져오기
    const [ratingsResult, linksResult, categoriesResult, reviewsResult] = await Promise.all([
      supabase.from(ratingTable).select('*').in('id', placeIds),
      supabase.from(linkTable).select('*').in('id', placeIds),
      supabase.from(categoryDetailTable).select('*').in('id', placeIds),
      supabase.from(reviewTable).select('*').in('id', placeIds),
    ]);

    const ratings = ratingsResult.data || [];
    const links = linksResult.data || [];
    const categories = categoriesResult.data || [];
    const reviews = reviewsResult.data || [];

    // 4. 최종 place 객체 가공
    const finalPlaces = places.map((info: any) => {
      const id = normalizeField(info, 'id'); // 숫자 id

      // 추가 데이터 매칭
      const ratingInfo = ratings.find((r: any) => normalizeField(r, 'id') === id);
      const linkInfo = links.find((l: any) => normalizeField(l, 'id') === id);
      const categoryInfo = categories.find((c: any) => normalizeField(c, 'id') === id);
      const reviewInfo = reviews.find((rev: any) => normalizeField(rev, 'id') === id);

      return {
        id, // 숫자 id 그대로
        name: normalizeField(info, 'place_name') || '',
        address: normalizeField(info, 'road_address') || normalizeField(info, 'lot_address') || '',
        category,
        categoryDetail: normalizeField(categoryInfo || {}, 'categories_details') || '',
        x: parseFloat(normalizeField(info, 'longitude') || '0'),
        y: parseFloat(normalizeField(info, 'latitude') || '0'),
        naverLink: normalizeField(linkInfo || {}, 'link') || '',
        instaLink: normalizeField(linkInfo || {}, 'instagram') || '',
        rating: ratingInfo ? parseFloat(normalizeField(ratingInfo, 'rating') || '0') : 0,
        reviewCount: ratingInfo ? parseInt(normalizeField(ratingInfo, 'visitor_review_count') || '0') : 0,
        weight: reviewInfo ? parseFloat(normalizeField(reviewInfo, 'visitor_norm') || '0') : 0,
      };
    });

    return { places: finalPlaces };
  } catch (error) {
    console.error('Error in fetchPlaceData:', error);
    return { places: [] };
  }
}
