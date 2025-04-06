

export interface RestaurantInformation {
  id: number;
  Place_Name?: string;
  Road_Address?: string;
  Lot_Address?: string;
  Longitude?: number;
  Latitude?: number;
}

export interface RestaurantLink {
  id: number;
  link?: string;
  instagram?: string;
}

export interface RestaurantCategory {
  id: number;
  Categories?: string;
  Categories_Details?: string;
}

export interface RestaurantReview {
  id: number;
  Rating?: number;
  review_count?: number;
}

export interface RestaurantOpeningHours {
  Id: number;
  [key: string]: any; // 요일_시간대 형태의 키(Mon_09, Mon_10 등)
}

export interface RestaurantNotes {
  id: number;
  Note?: string;
}

// accomodation with one 'c' (철자 주의)
export interface AccommodationInformation {
  ID: number;
  Place_name?: string;
  Road_address?: string;
  Lot_Address?: string;
  Longitude?: number;
  Latitude?: number;
}

export interface AccommodationLink {
  ID: number;
  link?: string;
  instagram?: string;
}

export interface AccommodationReview {
  id: number; // 주의: 소문자 'id'
  Rating?: number;
  visitor_review?: number; // 리뷰 수를 나타내는 필드
}

export interface AccommodationCategory {
  id: number;
  Categories?: string;
  Categories_Details?: string;
}

// 관광지(landmark) 정보를 위한 인터페이스 추가
export interface LandmarkInformation {
  id: number; // 주의: 소문자 'id'
  Place_Name?: string;
  Road_Address?: string;
  Lot_Address?: string;
  Longitude?: number;
  Latitude?: number;
}

export interface LandmarkLink {
  id: number; // 주의: 소문자 'id'
  link?: string;
  instagram?: string;
}

export interface LandmarkReview {
  id: number; // 주의: 소문자 'id'
  Rating?: number;
  visitor_review?: number;
}

