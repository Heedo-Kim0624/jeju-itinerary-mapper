export interface User {
  id: string;
  email: string;
  created_at?: string;
  updated_at?: string;
  username?: string;
  profile_url?: string;
  is_active?: boolean;
  last_login?: string;
}

export interface Place {
  id: string;
  name: string;
  x: number;
  y: number;
  category: string;
  address: string;
  contact?: string;
  rating?: number;
  opening_hours?: string;
  description?: string;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
  price_level?: number;
  user_ratings_total?: number;
  photo_reference?: string;
  visit_time?: number; // 방문 시간 필드 추가 (분 단위)
}

export interface ItineraryDay {
  day: number;
  places: Place[];
  totalDistance: number;
}
