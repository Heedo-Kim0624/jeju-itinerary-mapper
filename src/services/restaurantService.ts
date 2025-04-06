
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
    // 숙소 정보 가져오기
    const { data: accommodations, error: accommodationError } = await supabase
      .from('accomodation_information')
      .select('id, Place_Name, Road_Address, Lot_Address, Longitude, Latitude');

    if (accommodationError) {
      console.error('숙소 정보 가져오기 오류:', accommodationError);
      return [];
    }

    // 숙소 링크 정보 가져오기
    const { data: links, error: linkError } = await supabase
      .from('accomodation_link')
      .select('id, link, instagram');

    if (linkError) {
      console.error('숙소 링크 가져오기 오류:', linkError);
    }

    // 숙소 리뷰 정보 가져오기
    const { data: reviews, error: reviewError } = await supabase
      .from('accomodation_review')
      .select('id, Rating, visitor_review');

    if (reviewError) {
      console.error('숙소 리뷰 가져오기 오류:', reviewError);
    }

    // 링크 정보 맵 생성
    const linkMap = links ? links.reduce((map, link) => {
      map[link.id.toString()] = link;
      return map;
    }, {} as Record<string, any>) : {};

    // 리뷰 정보 맵 생성
    const reviewMap = reviews ? reviews.reduce((map, review) => {
      map[review.id.toString()] = review;
      return map;
    }, {} as Record<string, any>) : {};

    // 데이터 변환
    return accommodations.map(accommodation => ({
      id: accommodation.id.toString(),
      name: accommodation.Place_Name || '이름 없음',
      address: accommodation.Road_Address || accommodation.Lot_Address || '주소 없음',
      category: 'accommodation', // 숙소 카테고리 고정
      rating: reviewMap[accommodation.id]?.Rating || 4 + Math.random(), // 리뷰 정보 또는 임시 평점
      reviewCount: reviewMap[accommodation.id]?.visitor_review || Math.floor(Math.random() * 200) + 10, // 리뷰 수 또는 임시 리뷰 수
      operatingHours: '24시간', // 숙소 운영 시간
      naverLink: linkMap[accommodation.id]?.link || 'https://map.naver.com',
      instaLink: linkMap[accommodation.id]?.instagram || '',
      x: accommodation.Longitude || 126.5311884, // 제주도 중심 좌표 기본값
      y: accommodation.Latitude || 33.3846216, // 제주도 중심 좌표 기본값
    }));
  } catch (error) {
    console.error('숙소 데이터 가져오기 오류:', error);
    return [];
  }
};
