
import { ItineraryDay, ItineraryPlace } from '@/types/schedule'; // 프롬프트 1에서 정의된 타입 사용
import { Place } from '@/types/supabase'; // 기존 Place 타입도 활용 가능

export interface MapMarkerData {
  id: string | number;
  lat: number;
  lng: number;
  name: string;
  category?: string;
  // 필요에 따라 추가 정보 (예: 주소, 운영 시간 등)
}

export interface MapRouteSegmentData {
  id: string; // 세그먼트 고유 ID (예: "day1-place0-place1")
  path: Array<{ lat: number; lng: number }>; // 위경도 좌표 배열
  // 필요에 따라 추가 정보 (예: 이동 수단, 거리, 시간 등)
}

export interface MapVisualizationData {
  markers: MapMarkerData[];
  routes: MapRouteSegmentData[];
}

export const useMapFormatter = () => {
  const formatItineraryForMap = (itineraryDays: ItineraryDay[] | null): MapVisualizationData => {
    const markers: MapMarkerData[] = [];
    const routes: MapRouteSegmentData[] = [];

    if (!itineraryDays) {
      return { markers, routes };
    }

    itineraryDays.forEach((day, dayIndex) => {
      day.places.forEach((place, placeIndex) => {
        // ItineraryPlace 에 x, y 가 있으므로 사용
        if (typeof place.x === 'number' && typeof place.y === 'number') {
          markers.push({
            id: place.id,
            lat: place.y, // y가 위도(lat)
            lng: place.x, // x가 경도(lng)
            name: place.name,
            category: place.category,
          });
        }

        // 경로 데이터 생성 (routeData 또는 interleaved_route 활용)
        // 프롬프트 1의 ItineraryDay.routeData는 any 타입이므로, 실제 구조를 확인해야 함
        // 예시: routeData가 { segments: [{ path: [{lat,lng},...] }] } 형태라고 가정
        if (placeIndex < day.places.length - 1) {
          const nextPlace = day.places[placeIndex + 1];
          if (day.routeData && day.routeData.first_20_interleaved /* 임시 필드명, 실제 구조 확인 필요 */ ) {
            // 여기서 first_20_interleaved (노드 ID 목록)를 실제 경로 좌표로 변환하는 로직 필요
            // GeoJSON 데이터 또는 별도의 경로 API 결과와 매핑해야 함
            // 이 부분은 실제 데이터 구조에 따라 매우 달라짐
            // 임시로 두 장소 간 직선 경로로 표시
            if (typeof place.x === 'number' && typeof place.y === 'number' &&
                typeof nextPlace.x === 'number' && typeof nextPlace.y === 'number') {
              routes.push({
                id: `day${day.day}-segment${placeIndex}`,
                path: [
                  { lat: place.y, lng: place.x },
                  { lat: nextPlace.y, lng: nextPlace.x },
                ],
              });
            }
          }
        }
      });
    });

    return { markers, routes };
  };

  return { formatItineraryForMap };
};
