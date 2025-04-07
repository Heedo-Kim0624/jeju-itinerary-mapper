
import { supabase } from "@/integrations/supabase/client";
import { RestaurantInformation, RestaurantLink, RestaurantCategory, RestaurantReview, RestaurantOpeningHours, RestaurantNotes } from "@/types/supabase";
import { AccommodationInformation, AccommodationLink, AccommodationReview, AccommodationCategory } from "@/types/supabase";
import { LandmarkInformation, LandmarkLink, LandmarkReview, LandmarkCategory } from "@/types/supabase";

export interface Restaurant {
  id: string;
  name: string;
  address: string;
  x: number;
  y: number;
  category: string;
  categoryDetail?: string;
  rating?: number;
  reviewCount?: number;
  naverLink?: string;
  instaLink?: string;
  operatingHours?: string;
}

export interface Accommodation {
  id: string;
  name: string;
  address: string;
  x: number;
  y: number;
  category: string;
  categoryDetail?: string;
  rating?: number;
  reviewCount?: number;
  naverLink?: string;
  instaLink?: string;
}

export interface Landmark {
  id: string;
  name: string;
  address: string;
  x: number;
  y: number;
  category: string;
  categoryDetail?: string;
  rating?: number;
  reviewCount?: number;
  naverLink?: string;
  instaLink?: string;
}

export const fetchRestaurants = async (): Promise<Restaurant[]> => {
  console.log('Fetching restaurants from Supabase...');
  try {
    // 정보 테이블 조회
    const { data: restaurantInfos, error: infoError } = await supabase
      .from('restaurant_information')
      .select('*');

    if (infoError) {
      console.error('Error fetching restaurant information:', infoError);
      throw infoError;
    }

    if (!restaurantInfos || restaurantInfos.length === 0) {
      console.warn('No restaurant information found');
      return [];
    }

    console.log(`Found ${restaurantInfos.length} restaurants`);

    // 링크 테이블 조회
    const { data: restaurantLinks, error: linkError } = await supabase
      .from('restaurant_link')
      .select('*');

    if (linkError) {
      console.error('Error fetching restaurant links:', linkError);
    }

    // 리뷰 테이블 조회
    const { data: restaurantReviews, error: reviewError } = await supabase
      .from('restaurant_review')
      .select('*');

    if (reviewError) {
      console.error('Error fetching restaurant reviews:', reviewError);
    }

    // 카테고리 테이블 조회
    const { data: restaurantCategories, error: categoryError } = await supabase
      .from('restaurant_categories')
      .select('*');

    if (categoryError) {
      console.error('Error fetching restaurant categories:', categoryError);
    }

    // 데이터 변환
    const restaurants = restaurantInfos.map((info: RestaurantInformation) => {
      const link = restaurantLinks?.find(l => l.id === info.id);
      const review = restaurantReviews?.find(r => r.id === info.id);
      const category = restaurantCategories?.find(c => c.id === info.id);

      return {
        id: `restaurant-${info.id}`,
        name: info.Place_Name || '이름 없음',
        address: info.Road_Address || info.Lot_Address || '주소 없음',
        x: info.Longitude || 126.5311884, // 기본값: 제주도 중심
        y: info.Latitude || 33.3846216,  // 기본값: 제주도 중심
        category: 'restaurant',
        categoryDetail: category?.Categories_Details || '',
        rating: review?.Rating,
        reviewCount: review?.review_count,
        naverLink: link?.link || '',
        instaLink: link?.instagram || '',
      };
    });

    return restaurants;
  } catch (error) {
    console.error('Error in fetchRestaurants:', error);
    throw error;
  }
};

export const fetchAccommodations = async (): Promise<Accommodation[]> => {
  console.log('Fetching accommodations from Supabase...');
  try {
    // 정보 테이블 조회
    const { data: accommodationInfos, error: infoError } = await supabase
      .from('accomodation_information')
      .select('*');

    if (infoError) {
      console.error('Error fetching accommodation information:', infoError);
      throw infoError;
    }

    if (!accommodationInfos || accommodationInfos.length === 0) {
      console.warn('No accommodation information found');
      return [];
    }

    console.log(`Found ${accommodationInfos.length} accommodations`);

    // 링크 테이블 조회
    const { data: accommodationLinks, error: linkError } = await supabase
      .from('accomodation_link')
      .select('*');

    if (linkError) {
      console.error('Error fetching accommodation links:', linkError);
    }

    // 리뷰 테이블 조회
    const { data: accommodationReviews, error: reviewError } = await supabase
      .from('accomodation_review')
      .select('*');

    if (reviewError) {
      console.error('Error fetching accommodation reviews:', reviewError);
    }

    // 카테고리 테이블 조회
    const { data: accommodationCategories, error: categoryError } = await supabase
      .from('accomodation_categories')
      .select('*');

    if (categoryError) {
      console.error('Error fetching accommodation categories:', categoryError);
    }

    // 데이터 변환
    const accommodations = accommodationInfos.map((info: AccommodationInformation) => {
      const link = accommodationLinks?.find(l => l.ID === info.ID);
      const review = accommodationReviews?.find(r => r.id === info.ID);
      const category = accommodationCategories?.find(c => c.id === info.ID);

      return {
        id: `accommodation-${info.ID}`,
        name: info.Place_name || '이름 없음',
        address: info.Road_address || info.Lot_Address || '주소 없음',
        x: info.Longitude || 126.5311884, // 기본값: 제주도 중심
        y: info.Latitude || 33.3846216,  // 기본값: 제주도 중심
        category: 'accommodation',
        categoryDetail: category?.Categories_Details || '',
        rating: review?.Rating,
        reviewCount: review?.visitor_review_count,
        naverLink: link?.link || '',
        instaLink: link?.instagram || '',
      };
    });

    return accommodations;
  } catch (error) {
    console.error('Error in fetchAccommodations:', error);
    throw error;
  }
};

export const fetchLandmarks = async (): Promise<Landmark[]> => {
  console.log('Fetching landmarks from Supabase...');
  try {
    // 정보 테이블 조회
    const { data: landmarkInfos, error: infoError } = await supabase
      .from('landmark_information')
      .select('*');

    if (infoError) {
      console.error('Error fetching landmark information:', infoError);
      throw infoError;
    }

    if (!landmarkInfos || landmarkInfos.length === 0) {
      console.warn('No landmark information found');
      return [];
    }

    console.log(`Found ${landmarkInfos.length} landmarks`);

    // 링크 테이블 조회
    const { data: landmarkLinks, error: linkError } = await supabase
      .from('landmark_link')
      .select('*');

    if (linkError) {
      console.error('Error fetching landmark links:', linkError);
    }

    // 카테고리 테이블 조회
    const { data: landmarkCategories, error: categoryError } = await supabase
      .from('landmark_categories')
      .select('*');

    if (categoryError) {
      console.error('Error fetching landmark categories:', categoryError);
    }

    // 리뷰 테이블은 landmark_review가 아닌 다른 테이블명일 수 있으므로 확인 필요
    // const { data: landmarkReviews, error: reviewError } = await supabase
    //   .from('landmark_review')
    //   .select('*');

    // if (reviewError) {
    //   console.error('Error fetching landmark reviews:', reviewError);
    // }

    // 데이터 변환
    const landmarks = landmarkInfos.map((info: LandmarkInformation) => {
      const link = landmarkLinks?.find(l => l.id === info.id);
      // const review = landmarkReviews?.find(r => r.id === info.id);
      const category = landmarkCategories?.find(c => c.id === info.id);

      return {
        id: `landmark-${info.id}`,
        name: info.Place_Name || '이름 없음',
        address: info.Road_Address || info.Lot_Address || '주소 없음',
        x: info.Longitude || 126.5311884, // 기본값: 제주도 중심
        y: info.Latitude || 33.3846216,  // 기본값: 제주도 중심
        category: 'attraction',
        categoryDetail: category?.Categories_Details || '',
        // rating: review?.Rating,
        // reviewCount: review?.visitor_review,
        naverLink: link?.link || '',
        instaLink: link?.instagram || '',
      };
    });

    return landmarks;
  } catch (error) {
    console.error('Error in fetchLandmarks:', error);
    throw error;
  }
};
