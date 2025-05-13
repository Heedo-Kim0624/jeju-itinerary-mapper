
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
  
  // 추가 필드 정의
  reviewCount?: number;
  naverLink?: string;
  instaLink?: string;
  categoryDetail?: string;
  weight?: number;
  operatingHours?: string;
  isSelected?: boolean;
  isRecommended?: boolean;
  
  // GeoJSON 관련 필드 (매핑 시 추가됨)
  geoNodeId?: string;
  geoNodeDistance?: number;
}

export interface ItineraryDay {
  day: number;
  places: Place[];
  totalDistance: number;
}

export interface ItineraryPlaceWithTime extends Place {
  arrival_time?: string;
  travel_time_to_next?: string;
  time_block?: string; // 추가: 시간대 블록 정보 (오전/오후/저녁)
}

export interface SelectedPlace {
  id: number;
  name: string;
}

export interface SchedulePayload {
  selected_places: SelectedPlace[];
  candidate_places: SelectedPlace[];
  start_datetime: string;
  end_datetime: string;
}

// GeoJSON 관련 인터페이스
export interface GeoJsonNode {
  type: string;
  geometry: {
    type: string;
    coordinates: [number, number]; // [경도, 위도]
  };
  properties: {
    node_id: string;
    node_type?: string;
    node_name?: string;
  };
}

export interface GeoJsonLink {
  type: string;
  geometry: {
    type: string;
    coordinates: [number, number][]; // 선을 구성하는 좌표 배열
  };
  properties: {
    link_id: string;
    from_node: string;
    to_node: string;
    length?: number;
    road_type?: string;
  };
}

export interface GeoJsonMappingResult {
  totalPlaces: number;
  mappedPlaces: number;
  mappingRate: string;
  averageDistance: number | string;
  success: boolean;
  message: string;
}
