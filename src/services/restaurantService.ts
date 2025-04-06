
import { supabase } from '@/integrations/supabase/client';
import { AccommodationInformation, AccommodationLink, AccommodationReview } from '@/types/supabase';

export interface RestaurantData {
  id: string;
  name: string;
  address: string;
  category: string;
  rating?: number;
  reviewCount?: number;
  operatingHours?: string;
  naverLink?: string;
  instaLink?: string;
  x: number;
  y: number;
}

export const fetchRestaurants = async (): Promise<RestaurantData[]> => {
  try {
    // 레스토랑 정보 가져오기
    const { data: restaurants, error: restaurantError } = await supabase
      .from('restaurant_information')
      .select('id, Place_Name, Road_Address, Lot_Address, Longitude, Latitude');

    if (restaurantError) {
      console.error('레스토랑 정보 가져오기 오류:', restaurantError);
      return [];
    }

    // 링크 정보 가져오기
    const { data: links, error: linkError } = await supabase
      .from('restaurant_link')
      .select('id, link, instagram');

    if (linkError) {
      console.error('레스토랑 링크 가져오기 오류:', linkError);
    }

    // 레스토랑 정보와 링크 정보 병합
    const linkMap = links ? links.reduce((map, link) => {
      map[link.id.toString()] = link;
      return map;
    }, {} as Record<string, any>) : {};

    // 데이터 변환
    return restaurants.map(restaurant => ({
      id: restaurant.id.toString(),
      name: restaurant.Place_Name || '이름 없음',
      address: restaurant.Road_Address || restaurant.Lot_Address || '주소 없음',
      category: 'restaurant', // 레스토랑 카테고리 고정
      rating: 4 + Math.random(), // 임시 평점
      reviewCount: Math.floor(Math.random() * 500) + 10, // 임시 리뷰 수
      operatingHours: '09:00 - 21:00', // 임시 운영 시간
      naverLink: linkMap[restaurant.id]?.link || 'https://map.naver.com',
      instaLink: linkMap[restaurant.id]?.instagram || '',
      x: restaurant.Longitude || 126.5311884, // 제주도 중심 좌표 기본값
      y: restaurant.Latitude || 33.3846216, // 제주도 중심 좌표 기본값
    }));
  } catch (error) {
    console.error('레스토랑 데이터 가져오기 오류:', error);
    return [];
  }
};

export const fetchAccommodations = async (): Promise<RestaurantData[]> => {
  try {
    console.log('숙소 데이터 가져오기 시작...');
    
    // 숙소 정보 가져오기 (accomodation with one 'c')
    const { data: accommodations, error: accommodationError } = await supabase
      .from('accomodation_information')
      .select('*');

    if (accommodationError) {
      console.error('숙소 정보 가져오기 오류:', accommodationError);
      console.error('오류 세부 정보:', JSON.stringify(accommodationError));
      return [];
    }

    console.log('숙소 기본 정보 가져옴:', accommodations?.length || 0);
    if (accommodations && accommodations.length > 0) {
      console.log('첫 번째 숙소 데이터 샘플:', JSON.stringify(accommodations[0]));
    } else {
      console.error('가져온 숙소 데이터가 없거나 비어 있습니다!');
      return [];
    }

    // 숙소 링크 정보 가져오기 (accomodation with one 'c')
    const { data: links, error: linkError } = await supabase
      .from('accomodation_link')
      .select('*');

    if (linkError) {
      console.error('숙소 링크 가져오기 오류:', linkError);
    } else {
      console.log('숙소 링크 정보 가져옴:', links?.length || 0);
    }

    // 숙소 리뷰 정보 가져오기 (accomodation with one 'c')
    const { data: reviews, error: reviewError } = await supabase
      .from('accomodation_review')
      .select('*');

    if (reviewError) {
      console.error('숙소 리뷰 가져오기 오류:', reviewError);
    } else {
      console.log('숙소 리뷰 정보 가져옴:', reviews?.length || 0);
    }

    // 링크 정보 맵 생성
    const linkMap = links ? links.reduce((map: Record<string, any>, link: any) => {
      // 링크 정보의 ID를 문자열로 변환하여 키로 사용
      map[link.id.toString()] = link;
      return map;
    }, {}) : {};

    // 리뷰 정보 맵 생성
    const reviewMap = reviews ? reviews.reduce((map: Record<string, any>, review: any) => {
      // 리뷰 정보의 ID를 문자열로 변환하여 키로 사용
      map[review.id.toString()] = review;
      return map;
    }, {}) : {};

    console.log('데이터 변환 시작...');

    // 데이터 변환하여 반환 (비어있으면 빈 배열 반환)
    if (!accommodations || accommodations.length === 0) {
      console.log('변환할 숙소 정보가 없음');
      return [];
    }
    
    const result = accommodations.map((accommodation: any) => {
      const id = accommodation.id.toString();
      
      // 리뷰와 링크 정보 로그
      if (reviewMap[id]) {
        console.log(`숙소 ID ${id}의 리뷰 정보:`, JSON.stringify(reviewMap[id]));
      }
      if (linkMap[id]) {
        console.log(`숙소 ID ${id}의 링크 정보:`, JSON.stringify(linkMap[id]));
      }
      
      const item: RestaurantData = {
        id: id,
        name: accommodation.Place_Name || '이름 없음',
        address: accommodation.Road_Address || accommodation.Lot_Address || '주소 없음',
        category: 'accommodation',
        rating: reviewMap[id]?.Rating || null,
        reviewCount: reviewMap[id]?.visitor_review || null,
        operatingHours: '24시간', // 숙소 운영 시간
        naverLink: linkMap[id]?.link || '',
        instaLink: linkMap[id]?.instagram || '',
        x: accommodation.Longitude || 126.5311884,
        y: accommodation.Latitude || 33.3846216,
      };
      
      return item;
    });
    
    console.log('숙소 데이터 변환 완료:', result.length);
    if (result.length > 0) {
      console.log('첫 번째 변환된 데이터 샘플:', JSON.stringify(result[0]));
    }
    
    return result;
  } catch (error) {
    console.error('숙소 데이터 가져오기 오류:', error);
    console.error('오류 세부 정보:', error instanceof Error ? error.message : JSON.stringify(error));
    return [];
  }
};
