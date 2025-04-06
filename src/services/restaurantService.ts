

import { supabase } from '@/integrations/supabase/client';
import { 
  AccommodationInformation, 
  AccommodationLink, 
  AccommodationReview,
  LandmarkInformation,
  LandmarkLink,
  LandmarkReview
} from '@/types/supabase';

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
      return [];
    }

    console.log('숙소 기본 정보 가져옴:', accommodations?.length || 0);
    
    if (!accommodations || accommodations.length === 0) {
      console.error('가져온 숙소 데이터가 없습니다!');
      return [];
    }
    
    console.log('첫 번째 숙소 샘플:', JSON.stringify(accommodations[0]));

    // 숙소 링크 정보 가져오기
    const { data: links, error: linkError } = await supabase
      .from('accomodation_link')
      .select('*');

    if (linkError) {
      console.error('숙소 링크 가져오기 오류:', linkError);
    } else {
      console.log('숙소 링크 정보 가져옴:', links?.length || 0);
    }

    // 숙소 리뷰 정보 가져오기
    const { data: reviews, error: reviewError } = await supabase
      .from('accomodation_review')
      .select('*');

    if (reviewError) {
      console.error('숙소 리뷰 가져오기 오류:', reviewError);
    } else {
      console.log('숙소 리뷰 정보 가져옴:', reviews?.length || 0);
      if (reviews && reviews.length > 0) {
        console.log('첫번째 리뷰 샘플:', JSON.stringify(reviews[0]));
      }
    }

    // 링크와 리뷰 정보 맵 생성
    const linkMap: Record<string, any> = {};
    const reviewMap: Record<string, any> = {};
    
    if (links) {
      links.forEach(link => {
        linkMap[link.ID.toString()] = link;
      });
    }
    
    if (reviews) {
      reviews.forEach(review => {
        reviewMap[review.id.toString()] = review;
      });
    }
    
    console.log('데이터 맵 생성 완료. 변환 시작...');
    
    // 데이터 변환하여 반환
    const result = accommodations.map((accommodation: AccommodationInformation) => {
      const id = accommodation.ID.toString();
      const reviewData = reviewMap[id];
      
      // 리뷰 데이터가 있는 경우 콘솔에 출력 (디버깅)
      if (reviewData) {
        console.log(`숙소 ID ${id}의 리뷰 데이터:`, reviewData);
      }
      
      return {
        id: id,
        name: accommodation.Place_name || '이름 없음',
        address: accommodation.Road_address || accommodation.Lot_Address || '주소 없음',
        category: 'accommodation', // 숙소 카테고리 고정
        rating: reviewData?.Rating || null,
        reviewCount: reviewData?.visitor_review || reviewData?.visitor_review_count || null,
        operatingHours: '24시간', // 숙소 운영 시간 
        naverLink: linkMap[id]?.link || '',
        instaLink: linkMap[id]?.instagram || '',
        x: accommodation.Longitude || 126.5311884,
        y: accommodation.Latitude || 33.3846216,
      };
    });
    
    console.log('숙소 데이터 변환 완료:', result.length);
    console.log('첫 번째 변환된 숙소:', result.length > 0 ? JSON.stringify(result[0]) : '없음');
    
    return result;
  } catch (error) {
    console.error('숙소 데이터 가져오기 오류:', error);
    return [];
  }
};

// 관광지(landmark) 데이터를 가져오는 함수
export const fetchLandmarks = async (): Promise<RestaurantData[]> => {
  try {
    console.log('관광지 데이터 가져오기 시작...');
    
    // 관광지 정보 가져오기
    const { data: landmarks, error: landmarkError } = await supabase
      .from('landmark_information')
      .select('*');

    if (landmarkError) {
      console.error('관광지 정보 가져오기 오류:', landmarkError);
      return [];
    }

    console.log('관광지 기본 정보 가져옴:', landmarks?.length || 0);
    
    if (!landmarks || landmarks.length === 0) {
      console.error('가져온 관광지 데이터가 없습니다!');
      return [];
    }
    
    console.log('첫 번째 관광지 샘플:', JSON.stringify(landmarks[0]));

    // 관광지 링크 정보 가져오기
    const { data: links, error: linkError } = await supabase
      .from('landmark_link')
      .select('*');

    if (linkError) {
      console.error('관광지 링크 가져오기 오류:', linkError);
    } else {
      console.log('관광지 링크 정보 가져옴:', links?.length || 0);
    }

    // 관광지 리뷰 정보 가져오기
    const { data: reviews, error: reviewError } = await supabase
      .from('landmark_rating')  // landmark_rating으로 테이블명 변경
      .select('*');

    if (reviewError) {
      console.error('관광지 리뷰 가져오기 오류:', reviewError);
    } else {
      console.log('관광지 리뷰 정보 가져옴:', reviews?.length || 0);
    }

    // 링크와 리뷰 정보 맵 생성
    const linkMap: Record<string, any> = {};
    const reviewMap: Record<string, any> = {};
    
    if (links) {
      links.forEach(link => {
        linkMap[link.id.toString()] = link;
      });
    }
    
    if (reviews) {
      reviews.forEach(review => {
        reviewMap[review.id.toString()] = review;
      });
    }
    
    console.log('데이터 맵 생성 완료. 변환 시작...');
    
    // 데이터 변환하여 반환
    const result = landmarks.map((landmark: LandmarkInformation) => {
      const id = landmark.id.toString();
      
      return {
        id: id,
        name: landmark.Place_Name || '이름 없음',
        address: landmark.Road_Address || landmark.Lot_Address || '주소 없음',
        category: 'attraction', // 관광지 카테고리 고정
        rating: reviewMap[id]?.Rating || null,
        reviewCount: reviewMap[id]?.visitor_review || null,
        operatingHours: '09:00 - 18:00', // 관광지 기본 운영 시간
        naverLink: linkMap[id]?.link || '',
        instaLink: linkMap[id]?.instagram || '',
        x: landmark.Longitude || 126.5311884,
        y: landmark.Latitude || 33.3846216,
      };
    });
    
    console.log('관광지 데이터 변환 완료:', result.length);
    console.log('첫 번째 변환된 관광지:', result.length > 0 ? JSON.stringify(result[0]) : '없음');
    
    return result;
  } catch (error) {
    console.error('관광지 데이터 가져오기 오류:', error);
    return [];
  }
};

