
import React, { useEffect, useRef } from 'react';
import { ExternalLink, MapPin, Star, MessageCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Pagination } from './Pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface PlaceListProps {
  places: Place[];
  loading: boolean;
  onSelectPlace: (place: Place) => void;
  selectedPlace: Place | null;
  page: number;
  onPageChange: (page: number) => void;
  totalPages: number;
  orderedIds?: string[]; // 프롬프트에서 정렬된 ID 순서
}

interface Place {
  id: string;
  name: string;
  address: string;
  operatingHours: string;
  naverLink: string;
  instaLink: string;
  rating: number;
  reviewCount: number;
  category: string;
  x: number;
  y: number;
  operationTimeData?: {
    [key: string]: number; // 요일_시간: 0(영업안함), 1(영업중), 999(정보없음)
  };
  nodeId?: string; // OSM 노드 ID
}

// 일정 생성을 위한 테이블 타입 정의
interface ScheduleTable {
  [dayHour: string]: Place | null; // 요일_시간: Place 객체 또는 null
}

/**
 * 정렬된 ID 순서대로 장소 목록 표시를 위한 컴포넌트
 * 
 * @remarks
 * - 상위 200개 장소를 페이지당 20개씩 장소 표시
 * - 5단위 페이지네이션 지원
 * - 각 장소별로 이름, 주소, 운영시간, 네이버 링크, 인스타 링크, 평점, 리뷰수 표시
 * - 링크는 클릭하면 외부로 이동
 * - 프롬프트에서 정렬된 ID 순서대로 표시 가능
 * 
 * @future
 * - HuggingFace LLM 모델 통합 지점: orderedIds 배열을 LLM에서 생성된 순서로 받아 정렬
 * - 일정 생성 알고리즘은 다음 규칙을 따름:
 *   1. 영업시간 준수 (0=영업안함, 1=영업중, 999=정보없음)
 *   2. 카테고리별 시간 배치:
 *      - 식당: 각 요일 12시/13시, 18시/19시에 배치
 *      - 관광지: 각 요일 9-11시, 14-17시, 20-21시에 2-4칸 배치
 *      - 카페: 각 요일 13시/14시에 배치 
 *   3. 경로 최적화: OSM node, link, turntype 데이터로 최단 경로 계산
 *   4. 점수 계산: 기본 1000점 + (경로길이 × -0.001)
 */
const PlaceList: React.FC<PlaceListProps> = ({
  places,
  loading,
  onSelectPlace,
  selectedPlace,
  page,
  onPageChange,
  totalPages,
  orderedIds = [],
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 페이지 변경 시 스크롤 상단으로 이동
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [page]);

  // 프롬프트에서 정렬된 ID 값의 순서대로 장소 정렬
  const sortedPlaces = React.useMemo(() => {
    if (orderedIds.length > 0) {
      // LLM 프롬프트에서 생성된 ID 순서대로 정렬
      return sortPlacesByIds(places, orderedIds);
    }
    return places;
  }, [places, orderedIds]);

  const handlePlaceClick = (place: Place) => {
    onSelectPlace(place);
  };

  // ID값 순서대로 정렬하는 함수
  const sortPlacesByIds = (places: Place[], orderedIds: string[]): Place[] => {
    // 장소 ID와 인덱스 매핑
    const placeMap = places.reduce((map, place) => {
      map[place.id] = place;
      return map;
    }, {} as Record<string, Place>);
    
    // orderedIds에 있는 ID 순서대로 정렬
    return orderedIds
      .filter(id => placeMap[id]) // 존재하는 장소만 필터링
      .map(id => placeMap[id]);
  };

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center">
        <div className="animate-pulse">
          <div className="h-6 w-40 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 w-full bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (sortedPlaces.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
        <p>장소를 검색하거나 카테고리를 선택해주세요</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="text-sm text-muted-foreground mb-2">
        검색 결과: {sortedPlaces.length}개의 장소
      </div>
      
      <ScrollArea className="flex-1 pr-2" ref={scrollRef as any}>
        <div className="space-y-2">
          {sortedPlaces.slice((page - 1) * 20, page * 20).map((place) => (
            <div
              key={place.id}
              className={`place-item p-3 border rounded hover:bg-gray-50 cursor-pointer transition-colors ${
                selectedPlace?.id === place.id ? 'bg-blue-50 border-blue-200' : ''
              }`}
              onClick={() => handlePlaceClick(place)}
            >
              <div className="flex items-start justify-between">
                <h3 className="font-medium">{place.name}</h3>
                <div className="flex items-center gap-1 text-amber-500">
                  <Star className="h-3 w-3 fill-current" />
                  <span className="text-xs">{place.rating.toFixed(1)}</span>
                </div>
              </div>
              
              <div className="flex items-center text-xs text-muted-foreground mt-1 gap-1">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{place.address}</span>
              </div>
              
              <div className="flex items-center text-xs text-muted-foreground mt-1 gap-1">
                <Clock className="h-3 w-3" />
                <span>{place.operatingHours}</span>
              </div>
              
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MessageCircle className="h-3 w-3" />
                  <span>리뷰 {place.reviewCount}개</span>
                </div>
                
                <div className="flex items-center gap-2">
                  {place.naverLink && (
                    <a
                      href={place.naverLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      네이버
                    </a>
                  )}
                  
                  {place.instaLink && (
                    <a
                      href={place.instaLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-purple-500 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      인스타
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      
      <div className="mt-4 pt-2 border-t">
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  );
};

export default PlaceList;
