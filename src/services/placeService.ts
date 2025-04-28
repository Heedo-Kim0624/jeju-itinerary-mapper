
import { supabase } from '@/lib/supabaseClient';
import { TravelCategory } from '@/types/travel';
import { categoryTableMap, categoryRatingMap } from '@/lib/jeju/dbMapping';

// 필드 값을 대소문자 구분 없이 가져오는 유틸리티 함수
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

// 여러 가능한 필드명을 시도해서 값을 가져오는 확장 유틸리티 함수
function getFieldValue(obj: any, possibleFields: string[]): any {
  for (const field of possibleFields) {
    const value = normalizeField(obj, field);
    if (value !== undefined) {
      return value;
    }
  }
  return undefined;
}

export async function fetchPlaceData(
  category: TravelCategory,
  locations: string[]
) {
  // 테이블 참조 정보 가져오기
  const infoTable = categoryTableMap[category];
  const ratingTable = categoryRatingMap[category];
  const linkTable = `${category}_link`;
  const categoryTable = `${category}_categories`;
  const reviewTable = `${category}_review`;
  
  if (!infoTable || !ratingTable) {
    console.error(`Invalid category: ${category}`);
    return { places: [], ratings: [], categories: [], links: [], reviews: [] };
  }
  
  console.log(`Fetching data for category: ${category}, tables:`, { 
    infoTable, 
    ratingTable,
    linkTable,
    categoryTable,
    reviewTable
  });
  
  try {
    // 장소 정보 조회 (위치 필터 적용)
    let query = supabase.from(infoTable).select('*');
    
    if (locations.length > 0) {
      query = query.in('location', locations);
    }

    const { data: places, error: placesError } = await query;
    
    if (placesError) {
      console.error(`Places fetch error for table ${infoTable}:`, placesError);
      return { places: [], ratings: [], categories: [], links: [], reviews: [] };
    }
    
    if (!places || places.length === 0) {
      console.log(`No places found in table ${infoTable} matching the criteria`);
      return { places: [], ratings: [], categories: [], links: [], reviews: [] };
    }

    console.log(`Found ${places.length} places in ${infoTable}`);
    console.log('Sample place data:', places[0]);
    
    // ID 목록 추출 (대소문자 구분 없이)
    const placeIds = places.map(p => {
      const id = normalizeField(p, 'ID') || normalizeField(p, 'id');
      return id;
    }).filter(id => id !== undefined);
    
    console.log(`Extracted ${placeIds.length} valid IDs`);
    if (placeIds.length > 0) {
      console.log('Sample IDs:', placeIds.slice(0, 3));
    }
    
    // 추가 데이터 병렬 조회 - 에러 핸들링 추가
    const fetchTable = async (tableName: string) => {
      try {
        console.log(`Fetching data from ${tableName}...`);
        const { data, error } = await supabase.from(tableName).select('*');
        
        if (error) {
          console.error(`Error fetching from ${tableName}:`, error);
          return [];
        }
        
        console.log(`Successfully fetched ${data?.length || 0} rows from ${tableName}`);
        if (data && data.length > 0) {
          console.log(`Sample data from ${tableName}:`, data[0]);
        }
        
        return data || [];
      } catch (err) {
        console.error(`Exception when fetching ${tableName}:`, err);
        return [];
      }
    };
    
    const [ratings, categories, links, reviews] = await Promise.all([
      fetchTable(ratingTable),
      fetchTable(categoryTable),
      fetchTable(linkTable),
      fetchTable(reviewTable)
    ]);
    
    return { places, ratings, categories, links, reviews };
  } catch (error) {
    console.error('Error in fetchPlaceData:', error);
    return { places: [], ratings: [], categories: [], links: [], reviews: [] };
  }
}

// 장소 정보와 관련 데이터를 정규화하여 가공하는 함수
export function processPlaceData(
  place: any, 
  ratings: any[], 
  categories: any[], 
  links: any[], 
  reviews: any[]
): any {
  const placeId = normalizeField(place, 'ID') || normalizeField(place, 'id');
  const placeName = normalizeField(place, 'place_name') || normalizeField(place, 'Place_Name') || '';
  
  console.log(`Processing place: ${placeName} (ID: ${placeId})`);
  
  // 평점 데이터 찾기
  const rating = ratings.find(r => {
    const ratingId = normalizeField(r, 'ID') || normalizeField(r, 'id');
    return String(ratingId) === String(placeId);
  });
  
  // 리뷰 데이터 찾기
  const review = reviews.find(r => {
    const reviewId = normalizeField(r, 'ID') || normalizeField(r, 'id');
    return String(reviewId) === String(placeId);
  });
  
  // 카테고리 데이터 찾기
  const category = categories.find(c => {
    const categoryId = normalizeField(c, 'ID') || normalizeField(c, 'id');
    return String(categoryId) === String(placeId);
  });
  
  // 링크 데이터 찾기
  const link = links.find(l => {
    const linkId = normalizeField(l, 'ID') || normalizeField(l, 'id');
    return String(linkId) === String(placeId);
  });
  
  console.log(`Data lookup results for ${placeName}:`, {
    ratingFound: !!rating,
    reviewFound: !!review,
    categoryFound: !!category,
    linkFound: !!link
  });
  
  // 평점과 리뷰 수 추출
  const ratingValue = rating ? 
    parseFloat(String(normalizeField(rating, 'rating') || '0')) : 0;
  
  const reviewCount = rating ? 
    parseInt(String(normalizeField(rating, 'visitor_review_count') || '0')) : 0;
  
  // 가중치 계산
  let weight = 0;
  if (review) {
    // visitor_norm 값이 있으면 이를 기반으로 가중치 계산
    const visitorNorm = normalizeField(review, 'visitor_norm');
    if (visitorNorm !== undefined) {
      weight = parseFloat(String(visitorNorm));
    }
    
    // 가중치가 없으면 리뷰 수와 평점을 기반으로 간단한 가중치 계산
    if (!weight && ratingValue && reviewCount) {
      weight = (ratingValue / 5) * 0.5 + (Math.min(reviewCount, 100) / 100) * 0.5;
    }
  } else if (ratingValue && reviewCount) {
    // 리뷰 데이터가 없어도 평점과 리뷰 수가 있으면 가중치 계산
    weight = (ratingValue / 5) * 0.5 + (Math.min(reviewCount, 100) / 100) * 0.5;
  }
  
  const categoryDetail = category ? 
    (normalizeField(category, 'categories_details') || 
     normalizeField(category, 'Categories_Details') || '') : '';
     
  const naverLink = link ? (normalizeField(link, 'link') || '') : '';
  const instaLink = link ? (normalizeField(link, 'instagram') || '') : '';
  
  // 결과 로깅
  console.log(`Processed place: ${placeName}`, {
    rating: ratingValue,
    reviews: reviewCount,
    weight,
    categoryDetail: categoryDetail || '(없음)',
    hasLinks: !!(naverLink || instaLink)
  });
  
  return {
    rating: ratingValue || 0,
    reviewCount: reviewCount || 0,
    categoryDetail,
    naverLink,
    instaLink,
    weight: weight || 0
  };
}
