
import { supabase } from './supabaseClient';

// PlaceResult 타입 정의
export interface PlaceResult {
  id: string;
  place_name: string;
  road_address: string;
  rating: number;
  visitor_review_count: number;
  category: 'accommodation' | 'landmark' | 'restaurant' | 'cafe';
  // Map API 관련 필드 추가
  x: number;
  y: number;
  name?: string;
  address?: string;
}

// 키워드 → 컬럼명 매핑 (DB 조회용)
export async function mapKeywordToColumn(
  keyword: string,
  category: 'accommodation' | 'landmark' | 'restaurant' | 'cafe'
): Promise<string | null> {
  try {
    // similarity_matching 테이블 조회 로직…
    const { data, error } = await supabase
      .from('similarity_matching')
      .select('field_name')
      .eq('user_keyword', keyword)
      .eq('table_name', category)
      .single();

    if (error) throw error;
    return data?.field_name || null;
  } catch (error) {
    console.error(`키워드 매핑 오류 (${keyword}, ${category}):`, error);
    return null;
  }
}

// 가중치 기반 장소 조회
export async function fetchWeightedResults(
  category: 'accommodation' | 'landmark' | 'restaurant' | 'cafe',
  locations: string[],
  keywords: string[]
): Promise<PlaceResult[]> {
  try {
    // Mock implementation for now
    return [{
      id: '1',
      place_name: 'Test Place',
      road_address: 'Test Address',
      rating: 4.5,
      visitor_review_count: 100,
      category: category,
      x: 126.5, // Jeju coordinates
      y: 33.5,
      name: 'Test Place',
      address: 'Test Address'
    }];
  } catch (error) {
    console.error(`결과 조회 오류 (${category}):`, error);
    return [];
  }
}
