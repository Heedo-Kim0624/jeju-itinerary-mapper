
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

export interface AccommodationInformation {
  id: number;
  Place_Name?: string;
  Road_Address?: string;
  Lot_Address?: string;
  Longitude?: number;
  Latitude?: number;
}

export interface AccommodationLink {
  id: number;
  link?: string;
  instagram?: string;
}

export interface AccommodationReview {
  id: number;
  Rating?: number;
  visitor_review?: number;
}

export interface AccommodationCategory {
  id: number;
  Categories?: string;
  Categories_Details?: string;
}
