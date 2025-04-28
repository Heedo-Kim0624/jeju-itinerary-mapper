import { supabase } from '@/lib/supabaseClient';
import { TravelCategory } from '@/types/travel';
import { categoryTableMap, categoryRatingMap } from '@/lib/jeju/dbMapping';

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
  // 장소의 ID를 숫자로 확보
  const placeId = place.id;
  const placeName = place.place_name || place.Place_Name || '';
  
  console.log(`Processing place: ${placeName} (ID: ${placeId})`);
  
  // ID를 숫자로 사용하여 정확한 매칭
  // 평점 데이터 찾기 - id 필드로만 찾기
  const rating = ratings.find(r => r.id === placeId);
  
  // 리뷰 데이터 찾기
  const review = reviews.find(r => r.id === placeId);
  
  // 카테고리 데이터 찾기
  const category = categories.find(c => c.id === placeId);
  
  // 링크 데이터 찾기
  const link = links.find(l => l.id === placeId);
  
  console.log(`Data lookup results for ${placeName} (ID: ${placeId}):`, {
    ratingFound: !!rating,
    reviewFound: !!review,
    categoryFound: !!category,
    linkFound: !!link
  });
  
  // 평점과 리뷰 수 추출
  let ratingValue = 0;
  let reviewCount = 0;
  
  if (rating) {
    ratingValue = parseFloat(String(rating.rating || '0'));
    reviewCount = parseInt(String(rating.visitor_review_count || '0'));
    
    console.log(`Rating data for ${placeName}: rating=${ratingValue}, reviews=${reviewCount}`);
  }
  
  // 가중치 계산
  let weight = 0;
  if (review) {
    // visitor_norm 값이 있으면 이를 기반으로 가중치 계산
    if (review.visitor_norm !== undefined) {
      weight = parseFloat(String(review.visitor_norm));
      console.log(`Using visitor_norm for weight calculation: ${weight}`);
    }
    
    // 가중치가 없으면 리뷰 수와 평점을 기반으로 간단한 가중치 계산
    if (!weight && ratingValue && reviewCount) {
      weight = (ratingValue / 5) * 0.5 + (Math.min(reviewCount, 100) / 100) * 0.5;
      console.log(`Calculated weight from rating and reviews: ${weight}`);
    }
  } else if (ratingValue && reviewCount) {
    // 리뷰 데이터가 없어도 평점과 리뷰 수가 있으면 가중치 계산
    weight = (ratingValue / 5) * 0.5 + (Math.min(reviewCount, 100) / 100) * 0.5;
    console.log(`Calculated weight without review data: ${weight}`);
  }
  
  // 카테고리 세부 정보 추출
  const categoryDetail = category ? 
    (category.categories_details || category.Categories_Details || category.categories || category.Categories || '') : '';
  
  // 링크 정보 추출
  const naverLink = link ? (link.link || '') : '';
  const instaLink = link ? (link.instagram || '') : '';
  
  // 결과 로깅
  console.log(`Processed place: ${placeName}`, {
    rating: ratingValue,
    reviews: reviewCount,
    weight,
    categoryDetail: categoryDetail || '(없음)',
    hasLinks: !!(naverLink || instaLink)
  });
  
  return {
    rating: ratingValue,
    reviewCount: reviewCount,
    categoryDetail,
    naverLink,
    instaLink,
    weight: weight
  };
}
