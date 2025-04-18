import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient'; // Supabase 클라이언트 임포트 (경로는 프로젝트 구조에 맞게 조정 필요)

// 결과 데이터 타입 정의
interface PlaceResult {
  id: string;
  place_name: string;
  road_address: string;
  rating: number;
  visitor_review_count: number;
  category: 'accommodation' | 'landmark' | 'restaurant' | 'cafe';
}

// 프롬프트 파싱 결과 타입 정의
interface ParsedPrompt {
  schedule: {
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
  };
  locations: string[];
  keywords: {
    accommodation: string[];
    landmark: string[];
    restaurant: string[];
    cafe: string[];
  };
}

const TravelFilterComponent: React.FC = () => {
  // 상태 관리
  const [prompt, setPrompt] = useState<string>('');
  const [parsedPrompt, setParsedPrompt] = useState<ParsedPrompt | null>(null);
  const [results, setResults] = useState<{
    accommodation: PlaceResult[];
    landmark: PlaceResult[];
    restaurant: PlaceResult[];
    cafe: PlaceResult[];
  }>({
    accommodation: [],
    landmark: [],
    restaurant: [],
    cafe: []
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 프롬프트 파싱 함수
  const parsePrompt = (input: string): ParsedPrompt | null => {
    try {
      // 일정 파싱
      const scheduleMatch = input.match(/일정\[([\d\.]+),([\d:]+),([\d\.]+),([\d:]+)\]/);
      if (!scheduleMatch) {
        throw new Error('일정 형식이 올바르지 않습니다.');
      }

      // 지역 파싱
      const locationsMatch = input.match(/지역\[(.*?)\]/);
      if (!locationsMatch) {
        throw new Error('지역 형식이 올바르지 않습니다.');
      }
      const locations = locationsMatch[1].split(',').map(loc => loc.trim());

      // 카테고리별 키워드 파싱 함수
      const parseKeywords = (category: string): string[] => {
        const regex = new RegExp(`${category}\\[${category}\\[\\{(.*?)\\}\\]\\]`);
        const match = input.match(regex);
        if (!match) return [];
        return match[1].split(',').map(keyword => keyword.trim());
      };

      // 각 카테고리 키워드 파싱
      const accommodationKeywords = parseKeywords('숙소');
      const landmarkKeywords = parseKeywords('관광지');
      const restaurantKeywords = parseKeywords('음식점');
      const cafeKeywords = parseKeywords('카페');

      return {
        schedule: {
          startDate: scheduleMatch[1],
          startTime: scheduleMatch[2],
          endDate: scheduleMatch[3],
          endTime: scheduleMatch[4]
        },
        locations,
        keywords: {
          accommodation: accommodationKeywords,
          landmark: landmarkKeywords,
          restaurant: restaurantKeywords,
          cafe: cafeKeywords
        }
      };
    } catch (error) {
      console.error('프롬프트 파싱 오류:', error);
      setError(`프롬프트 파싱 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      return null;
    }
  };

  // 지역 매핑 함수
  const mapLocation = (location: string): string => {
    const locationMap: Record<string, string> = {
      '서귀포시내': '서귀포',
      '제주시내': '제주'
    };
    return locationMap[location] || location;
  };

  // 키워드 매핑 함수 (similarity_matching 테이블에서 실제 컬럼명 조회)
  const mapKeywordToColumn = async (
    keyword: string, 
    category: 'accommodation' | 'landmark' | 'restaurant' | 'cafe'
  ): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('similarity_matching')
        .select('column_name')
        .eq('keyword', keyword)
        .eq('category', category)
        .single();

      if (error) throw error;
      return data?.column_name || null;
    } catch (error) {
      console.error(`키워드 매핑 오류 (${keyword}, ${category}):`, error);
      return null;
    }
  };

  // 가중치 기반 평가 및 결과 조회 함수
  const fetchWeightedResults = async (
    category: 'accommodation' | 'landmark' | 'restaurant' | 'cafe',
    locations: string[],
    keywords: string[]
  ): Promise<PlaceResult[]> => {
    try {
      // 카테고리별 테이블 매핑
      const tableMap = {
        accommodation: {
          review: 'accomodation_review',
          rating: 'accomodation_rating',
          info: 'information'
        },
        landmark: {
          review: 'landmark',
          rating: 'landmark_rating',
          info: 'information'
        },
        restaurant: {
          review: 'restaurant',
          rating: 'restaurant_rating',
          info: 'information'
        },
        cafe: {
          review: 'cafe',
          rating: 'cafe_rating',
          info: 'information'
        }
      };

      // 키워드를 컬럼명으로 매핑
      const columnPromises = keywords.map(keyword => mapKeywordToColumn(keyword, category));
      const columns = await Promise.all(columnPromises);
      const validColumns = columns.filter(col => col !== null) as string[];

      if (validColumns.length === 0) {
        return [];
      }

      // 매핑된 지역 목록 생성
      const mappedLocations = locations.map(mapLocation);

      // 지역 필터링을 위한 쿼리 준비
      let query = supabase
        .from(tableMap[category].info)
        .select('id')
        .in('location', mappedLocations);

      const { data: locationFilteredIds, error: locationError } = await query;
      
      if (locationError) throw locationError;
      if (!locationFilteredIds || locationFilteredIds.length === 0) {
        return [];
      }

      // 지역 필터링된 ID 목록
      const filteredIds = locationFilteredIds.map(item => item.id);

      // 가중치 계산을 위한 SQL 쿼리 구성
      // 실제 구현에서는 Supabase의 RPC(Remote Procedure Call) 또는 
      // PostgreSQL 함수를 사용하는 것이 더 효율적일 수 있습니다.
      let weightedScores: Record<string, number> = {};
      
      // 각 ID에 대해 가중치 계산
      for (const id of filteredIds) {
        const { data: reviewData, error: reviewError } = await supabase
          .from(tableMap[category].review)
          .select(`id, review_norm, ${validColumns.join(', ')}`)
          .eq('id', id)
          .single();
          
        if (reviewError || !reviewData) continue;
        
        // 가중치 계산
        let score = 0;
        for (let i = 0; i < validColumns.length && i < keywords.length; i++) {
          const column = validColumns[i];
          const weight = i === 0 ? 0.4 : i === 1 ? 0.3 : 0.2;
          score += (reviewData[column] || 0) * weight;
        }
        
        // review_norm 곱하기
        score *= reviewData.review_norm || 1;
        
        weightedScores[id] = score;
      }
      
      // 점수 기준 상위 20개 ID 선택
      const topIds = Object.entries(weightedScores)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([id]) => id);
      
      if (topIds.length === 0) {
        return [];
      }
      
      // 최종 결과 조회
      const { data: finalResults, error: finalError } = await supabase
        .from(tableMap[category].info)
        .select(`
          id,
          place_name,
          road_address,
          ${tableMap[category].rating}(rating, visitor_review_count)
        `)
        .in('id', topIds);
        
      if (finalError) throw finalError;
      
      // 결과 형식 변환
      return (finalResults || []).map(item => ({
        id: item.id,
        place_name: item.place_name,
        road_address: item.road_address,
        rating: item[tableMap[category].rating]?.rating || 0,
        visitor_review_count: item[tableMap[category].rating]?.visitor_review_count || 0,
        category
      }));
    } catch (error) {
      console.error(`${category} 결과 조회 오류:`, error);
      return [];
    }
  };

  // 프롬프트 제출 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // 프롬프트 파싱
      const parsed = parsePrompt(prompt);
      if (!parsed) {
        setIsLoading(false);
        return;
      }

      setParsedPrompt(parsed);

      // 각 카테고리별 결과 조회
      const accommodationResults = await fetchWeightedResults(
        'accommodation',
        parsed.locations,
        parsed.keywords.accommodation
      );

      const landmarkResults = await fetchWeightedResults(
        'landmark',
        parsed.locations,
        parsed.keywords.landmark
      );

      const restaurantResults = await fetchWeightedResults(
        'restaurant',
        parsed.locations,
        parsed.keywords.restaurant
      );

      const cafeResults = await fetchWeightedResults(
        'cafe',
        parsed.locations,
        parsed.keywords.cafe
      );

      // 결과 설정
      setResults({
        accommodation: accommodationResults,
        landmark: landmarkResults,
        restaurant: restaurantResults,
        cafe: cafeResults
      });
    } catch (error) {
      console.error('결과 조회 오류:', error);
      setError(`결과 조회 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 결과 렌더링 함수
  const renderResults = (category: 'accommodation' | 'landmark' | 'restaurant' | 'cafe') => {
    const categoryTitleMap = {
      accommodation: '숙소',
      landmark: '관광지',
      restaurant: '음식점',
      cafe: '카페'
    };

    return (
      <div className="category-results">
        <h3>{categoryTitleMap[category]} 결과 ({results[category].length})</h3>
        {results[category].length > 0 ? (
          <ul>
            {results[category].map(place => (
              <li key={place.id} className="place-item">
                <h4>{place.place_name}</h4>
                <p>주소: {place.road_address}</p>
                <p>평점: {place.rating.toFixed(1)} (리뷰 {place.visitor_review_count}개)</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>검색 결과가 없습니다.</p>
        )}
      </div>
    );
  };

  return (
    <div className="travel-filter-container">
      <h2>여행 필터 검색</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="prompt">검색 프롬프트:</label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="일정[04.23,10:00,04.29,18:00], 지역[조천,애월], 숙소[숙소[{good_bedding,냉난방,good_breakfast}], 관광지[관광지[{Diverse_Experience_Programs,가성비,Large_Scale}], 음식점[음식점[{Delicious_food,좋은 뷰,Good_value_for_money}], 카페[카페[{Special_menu_available,깔끔함,Delicious_desserts}]"
            rows={5}
            required
          />
        </div>
        <button type="submit" disabled={isLoading}>
          {isLoading ? '검색 중...' : '검색하기'}
        </button>
      </form>

      {error && <div className="error-message">{error}</div>}

      {parsedPrompt && (
        <div className="parsed-prompt">
          <h3>검색 조건</h3>
          <p>
            <strong>일정:</strong> {parsedPrompt.schedule.startDate} {parsedPrompt.schedule.startTime} ~ {parsedPrompt.schedule.endDate} {parsedPrompt.schedule.endTime}
          </p>
          <p>
            <strong>지역:</strong> {parsedPrompt.locations.join(', ')}
          </p>
          <div>
            <strong>키워드:</strong>
            <ul>
              <li>숙소: {parsedPrompt.keywords.accommodation.join(', ') || '없음'}</li>
              <li>관광지: {parsedPrompt.keywords.landmark.join(', ') || '없음'}</li>
              <li>음식점: {parsedPrompt.keywords.restaurant.join(', ') || '없음'}</li>
              <li>카페: {parsedPrompt.keywords.cafe.join(', ') || '없음'}</li>
            </ul>
          </div>
        </div>
      )}

      {!isLoading && results.accommodation.length + results.landmark.length + results.restaurant.length + results.cafe.length > 0 && (
        <div className="results-container">
          <h3>검색 결과</h3>
          {renderResults('accommodation')}
          {renderResults('landmark')}
          {renderResults('restaurant')}
          {renderResults('cafe')}
        </div>
      )}

      <style jsx>{`
        .travel-filter-container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 20px;
          font-family: 'Noto Sans KR', sans-serif;
        }
        
        h2 {
          color: #333;
          margin-bottom: 20px;
        }
        
        .form-group {
          margin-bottom: 15px;
        }
        
        label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
        }
        
        textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }
        
        button {
          background-color: #4a90e2;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          transition: background-color 0.3s;
        }
        
        button:hover {
          background-color: #357ae8;
        }
        
        button:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }
        
        .error-message {
          color: #e74c3c;
          margin: 15px 0;
          padding: 10px;
          background-color: #fadbd8;
          border-radius: 4px;
        }
        
        .parsed-prompt {
          margin: 20px 0;
          padding: 15px;
          background-color: #f9f9f9;
          border-radius: 4px;
          border-left: 4px solid #4a90e2;
        }
        
        .results-container {
          margin-top: 30px;
        }
        
        .category-results {
          margin-bottom: 30px;
        }
        
        .place-item {
          padding: 15px;
          margin-bottom: 15px;
          background-color: #fff;
          border-radius: 4px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s;
        }
        
        .place-item:hover {
          transform: translateY(-3px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }
        
        .place-item h4 {
          margin: 0 0 10px 0;
          color: #333;
        }
        
        .place-item p {
          margin: 5px 0;
          color: #666;
        }
        
        /* 반응형 디자인 */
        @media (max-width: 768px) {
          .travel-filter-container {
            padding: 15px;
          }
          
          .place-item {
            padding: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default TravelFilterComponent;
