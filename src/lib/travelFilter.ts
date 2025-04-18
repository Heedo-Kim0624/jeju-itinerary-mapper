import { supabase } from './supabaseClient';

// PlaceResult 타입 정의
export interface PlaceResult {
  id: string;
  place_name: string;
  road_address: string;
  rating: number;
  visitor_review_count: number;
  category: 'accommodation' | 'landmark' | 'restaurant' | 'cafe';
}

// 키워드 → 컬럼명 매핑 (DB 조회용)
export async function mapKeywordToColumn(
  keyword: string,
  category: 'accommodation' | 'landmark' | 'restaurant' | 'cafe'
): Promise<string | null> {
  // similarity_matching 테이블 조회 로직…
}

// 가중치 기반 장소 조회
export async function fetchWeightedResults(
  category: 'accommodation' | 'landmark' | 'restaurant' | 'cafe',
  locations: string[],
  keywords: string[]
): Promise<PlaceResult[]> {
  // 1) 키워드가 비어 있으면 위치+평점 기반 기본 쿼리
  // 2) 아니면 mapKeywordToColumn → validColumns  
  // 3) 리뷰 테이블 조회 → 가중치 계산  
  // 4) 상위 N개 ID → 정보·평점 테이블 조회  
  // 5) PlaceResult[] 로 반환
}
