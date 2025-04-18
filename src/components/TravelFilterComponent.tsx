
import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient'; 

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

  // 프롬프트 제출 핸들러 - 간소화된 버전으로 교체
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // 간소화된 구현
      setParsedPrompt({
        schedule: {
          startDate: '2025-04-23',
          startTime: '10:00',
          endDate: '2025-04-29',
          endTime: '18:00'
        },
        locations: ['제주', '서귀포'],
        keywords: {
          accommodation: ['깨끗함', '뷰 좋음'],
          landmark: ['자연 경관', '사진 명소'],
          restaurant: ['맛있는 음식', '가성비'],
          cafe: ['분위기 좋음', '디저트']
        }
      });
      
      // 더미 데이터로 결과 설정
      setResults({
        accommodation: [
          {id: '1', place_name: '제주 호텔', road_address: '제주시 어딘가', rating: 4.5, visitor_review_count: 120, category: 'accommodation'},
          {id: '2', place_name: '서귀포 리조트', road_address: '서귀포시 어딘가', rating: 4.2, visitor_review_count: 98, category: 'accommodation'}
        ],
        landmark: [
          {id: '3', place_name: '한라산', road_address: '제주시 한라산', rating: 4.8, visitor_review_count: 240, category: 'landmark'},
          {id: '4', place_name: '성산일출봉', road_address: '서귀포시 성산읍', rating: 4.7, visitor_review_count: 210, category: 'landmark'}
        ],
        restaurant: [
          {id: '5', place_name: '흑돼지 맛집', road_address: '제주시 맛있는 거리', rating: 4.6, visitor_review_count: 180, category: 'restaurant'},
          {id: '6', place_name: '해산물 식당', road_address: '서귀포시 맛있는 거리', rating: 4.4, visitor_review_count: 150, category: 'restaurant'}
        ],
        cafe: [
          {id: '7', place_name: '오션뷰 카페', road_address: '제주시 바다가', rating: 4.7, visitor_review_count: 160, category: 'cafe'},
          {id: '8', place_name: '한라산뷰 카페', road_address: '서귀포시 산가', rating: 4.5, visitor_review_count: 130, category: 'cafe'}
        ]
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
      
      <style>
        {`
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
        
        @media (max-width: 768px) {
          .travel-filter-container {
            padding: 15px;
          }
          
          .place-item {
            padding: 12px;
          }
        }
        `}
      </style>
    </div>
  );
};

export default TravelFilterComponent;
