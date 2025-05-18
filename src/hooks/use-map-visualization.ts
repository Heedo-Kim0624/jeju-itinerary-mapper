
import { useEffect, useCallback } from 'react';
import { useMapContext } from '@/components/rightpanel/MapContext';
import { MapVisualizationData, useMapFormatter } from './use-map-formatter';
import { ItineraryDay } from '@/types/schedule'; // 프롬프트 1의 ItineraryDay

export const useMapVisualization = (itineraryDays: ItineraryDay[] | null) => {
  const {
    map, // Naver Map instance
    addMarkers: addMapMarkers, // useMapCore에서 제공하는 마커 추가 함수
    renderGeoJsonRoute, // useMapCore에서 제공하는 GeoJSON 경로 렌더링 함수
    clearMarkersAndUiElements, // useMapCore에서 제공하는 마커 및 UI 요소 제거 함수
    clearAllRoutes, // useMapCore에서 제공하는 모든 경로 제거 함수
    // panTo, // 필요시 사용
  } = useMapContext();
  const { formatItineraryForMap } = useMapFormatter();

  const drawMapElements = useCallback((data: MapVisualizationData) => {
    if (!map) return;

    console.log('[useMapVisualization] Clearing previous map elements');
    clearMarkersAndUiElements(); // 기존 마커 및 UI 요소들 (경로 제외) 제거
    clearAllRoutes(); // 기존 모든 경로 제거

    console.log('[useMapVisualization] Adding new markers:', data.markers.length);
    // addMapMarkers를 사용하여 마커들을 추가합니다.
    // useMapCore의 addMarkers는 Place[]를 받으므로, MapMarkerData를 Place[]로 변환하거나,
    // addMarkers 함수 시그니처를 더 일반적인 형태로 수정해야 할 수 있습니다.
    // 임시로 Place 타입과 유사하게 변환하여 전달합니다.
    const placesForMarkers = data.markers.map(marker => ({
        id: String(marker.id),
        name: marker.name,
        x: marker.lng,
        y: marker.lat,
        category: marker.category || '기타',
        // Place 타입에 필요한 나머지 최소 필드들
        address: '',
        phone: '',
        description: '',
        rating: 0,
        image_url: '',
        road_address: '',
        homepage: '',
    }));
    addMapMarkers(placesForMarkers, { isItinerary: true });


    console.log('[useMapVisualization] Rendering new routes:', data.routes.length);
    // 경로 렌더링: MapRouteSegmentData의 path를 GeoJSON LineString으로 변환하여 renderGeoJsonRoute 사용
    // renderGeoJsonRoute는 nodeIds, linkIds를 받으므로, 이 부분은 MapContext의 경로 기능을 직접 활용해야 함.
    // useMapFormatter에서 생성된 routes는 [{lat,lng}] 배열이므로 직접 사용하기 어려움.
    // 대신, ItineraryDay에 포함된 interleaved_route나 routeData (서버 원본)를
    // MapContext의 renderItineraryRoute 또는 관련 함수에 전달하는 방식이 더 적합할 수 있음.
    // 프롬프트 2에서는 MapVisualizationData를 사용하도록 했으므로,
    // renderGeoJsonRoute가 [{lat,lng}] path를 받을 수 있도록 하거나, 새로운 경로 렌더링 함수 필요.
    // 여기서는 임시로 renderGeoJsonRoute가 수정되었다고 가정하지 않고,
    // MapContext가 직접 ItineraryDay를 받아 처리하는 기존 방식을 유지하는 것이 나을 수 있음을 주석으로 남깁니다.
    // For now, this part needs to align with how renderGeoJsonRoute or equivalent works.
    // A simple line for each segment (if renderGeoJsonRoute can take raw paths):
    /*
    data.routes.forEach(route => {
      // This is a placeholder. renderGeoJsonRoute expects node/link IDs.
      // A function to convert {lat,lng} path to something renderGeoJsonRoute understands is needed.
      // Or, use a different map drawing function for simple paths.
      console.log(`Attempting to render route: ${route.id}`);
    });
    */
   // 올바른 접근: ItineraryDay[]가 변경되면, MapContext의 renderItineraryRoute를 호출하도록 하는 것.
   // MapProvider 내부의 useMapCore가 selectedItineraryDay가 변경될 때 renderItineraryRoute를 호출하는 로직이 있다면
   // 여기서는 데이터를 포맷팅하여 상태로만 관리하고, 실제 그리기는 해당 컨텍스트에 위임할 수 있음.
   // 프롬프트는 이 훅에서 직접 그리도록 유도하고 있으므로, MapContext의 함수를 활용해야함.

  }, [map, addMapMarkers, clearMarkersAndUiElements, clearAllRoutes, renderGeoJsonRoute]);

  useEffect(() => {
    if (itineraryDays && itineraryDays.length > 0) {
      console.log('[useMapVisualization] Itinerary updated, formatting and drawing map elements.');
      const vizData = formatItineraryForMap(itineraryDays);
      drawMapElements(vizData);
    } else {
      console.log('[useMapVisualization] Itinerary empty or null, clearing map elements.');
      if(map) { // map이 초기화된 경우에만 clear 실행
        clearMarkersAndUiElements();
        clearAllRoutes();
      }
    }
  }, [itineraryDays, formatItineraryForMap, drawMapElements, map, clearMarkersAndUiElements, clearAllRoutes]);

  // 이 훅은 시각화를 트리거하고, 실제 데이터는 외부(예: 상태 관리)에서 주입받습니다.
  // 반환 값은 필요에 따라 추가할 수 있습니다.
};
