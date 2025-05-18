
import React, { useEffect, useRef, useCallback } from 'react';
import { useMapContext } from './MapContext';
import Map from './Map'; // Assuming Map component is in the same directory
import { Place, ItineraryDay } from '@/types/supabase'; // Ensure ItineraryDay is from supabase or a compatible one
// import { ItineraryDay as ScheduleItineraryDay } from '@/types/schedule'; // 프롬프트 1의 ItineraryDay
import { useMapVisualization } from '@/hooks/use-map-visualization'; // 프롬프트 2에서 생성
import { ServerRouteResponse } from '@/types/schedule'; // MapContext에서 사용하는 ServerRouteResponse

// Map 컴포넌트에 전달될 Props 정의 (기존 Map.tsx의 props를 따름)
interface MapProps {
  places: Place[]; // 일반 장소 목록 (검색 결과 등)
  selectedPlace: Place | null; // 현재 선택된 단일 장소
  itinerary: ItineraryDay[] | null; // 전체 일정 데이터
  selectedDay: number | null; // 현재 선택된 일정의 날짜 (day number)
  selectedPlaces?: Place[]; // 왼쪽 패널에서 선택된 장소들 (카트에 담긴 장소들)
}

interface MapContainerProps {
  // Props from RightPanel or other parent components
  places: Place[]; // 일반 장소 목록 (검색 결과 등)
  selectedPlace: Place | null;
  itinerary: ItineraryDay[] | null; // This should be the primary itinerary data
  selectedItineraryDay: number | null; // Renamed to avoid conflict with MapProps.selectedDay
  selectedPlacesFromPanel?: Place[]; // Renamed to avoid conflict
}

const MapContainer: React.FC<MapContainerProps> = ({
  places,
  selectedPlace,
  itinerary, // This is ItineraryDay[] from useItinerary/useLeftPanel
  selectedItineraryDay,
  selectedPlacesFromPanel = [],
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const {
    map,
    mapContainer, // This ref is from useMapCore, assign it to the div
    isMapInitialized,
    addMarkers,
    clearMarkersAndUiElements,
    renderGeoJsonRoute,
    clearAllRoutes,
    panTo,
    serverRoutesData, // 이미 useMapCore에서 관리하는 서버 경로 데이터
    setServerRoutes, // 서버 경로 데이터 설정 함수
  } = useMapContext();

  // 프롬프트 2에서 생성한 훅 사용 (ItineraryDay[] 타입을 인자로 받음)
  // 여기서 itinerary는 useLeftPanel 또는 useItinerary에서 오는 데이터
  useMapVisualization(itinerary);


  // Assign the ref from context to the actual div element
  useEffect(() => {
    if (mapContainerRef.current && mapContainer.current === null) {
      // This is a bit of a hack. useMapCore initializes its own ref.
      // We want MapContainer's div to BE the mapContainer for useMapCore.
      // This should ideally be handled by MapProvider passing the ref down.
      // For now, we log if they are different.
      // console.log("MapContainer ref vs Context ref:", mapContainerRef.current, mapContainer.current);
    }
  }, [mapContainer]);


  // 프롬프트 3: 선택된 날짜의 경로 및 마커 표시 (renderItineraryDayRoutes 대체)
  // useMapVisualization 훅이 이 역할을 대신하게 되므로, MapContainer 내의 복잡한 그리기 로직은 줄어듦.
  // 다만, useMapVisualization은 MapMarkerData[] 와 MapRouteSegmentData[] 를 만들고,
  // addMarkers와 renderGeoJsonRoute를 호출하려고 시도함.
  // addMarkers는 Place[]를 기대하고, renderGeoJsonRoute는 nodeIds, linkIds를 기대함.
  // 이 불일치는 useMapVisualization 내부 또는 MapContext 함수에서 해결되어야 함.

  // 서버로부터 받은 경로 데이터를 지도에 표시하는 로직 (serverRoutesData 변경 시)
  useEffect(() => {
    if (map && isMapInitialized && selectedItineraryDay && serverRoutesData && serverRoutesData[selectedItineraryDay]) {
      console.log(`[MapContainer] Rendering server route for day ${selectedItineraryDay}`);
      clearAllRoutes(); // 이전 경로 삭제

      const dayRouteData = serverRoutesData[selectedItineraryDay];
      if (dayRouteData.nodeIds && dayRouteData.linkIds) {
        // renderGeoJsonRoute는 string[]을 받으므로 변환
        const nodeIdsStr = dayRouteData.nodeIds.map(String);
        const linkIdsStr = dayRouteData.linkIds.map(String);
        renderGeoJsonRoute(nodeIdsStr, linkIdsStr);
      } else if (dayRouteData.interleaved_route) {
        // interleaved_route를 직접 사용하는 로직 (기존 Map.tsx에 있을 수 있음)
        // 이 부분은 useMapCore의 renderItineraryRoute가 처리할 수 있도록 위임하는 것이 좋음
        // renderGeoJsonRoute가 interleaved_route도 받을 수 있다면 사용
        console.warn("[MapContainer] dayRouteData has interleaved_route, but direct rendering not implemented here. Relying on useMapCore's capabilities.");
      }
    } else if (map && isMapInitialized && selectedItineraryDay && itinerary) {
        // 서버 응답 (serverRoutesData)이 없을 경우, itinerary의 routeData를 사용 시도
        const currentDaySchedule = itinerary.find(d => d.day === selectedItineraryDay);
        if (currentDaySchedule?.routeData) { // routeData가 any이므로 내부 구조 확인 필요
            // currentDaySchedule.routeData의 구조에 따라 renderGeoJsonRoute 호출
            // 예: routeData가 { nodeIds: string[], linkIds: string[] } 형태일 경우
            const rd = currentDaySchedule.routeData as { nodeIds?: (string|number)[], linkIds?: (string|number)[], interleaved_route?: (string|number)[] };
            if(rd.nodeIds && rd.linkIds) {
                console.log(`[MapContainer] Rendering client itinerary routeData for day ${selectedItineraryDay}`);
                clearAllRoutes();
                renderGeoJsonRoute(rd.nodeIds.map(String), rd.linkIds.map(String));
            } else if (rd.interleaved_route) {
                console.log(`[MapContainer] Rendering client itinerary interleaved_route for day ${selectedItineraryDay}`);
                clearAllRoutes();
                // renderGeoJsonRoute가 interleaved_route를 직접 처리할 수 없으므로,
                // 이를 nodeIds, linkIds로 파싱하는 로직이 필요하거나,
                // useMapCore에 interleaved_route를 처리하는 기능이 있어야 함.
                // 여기서는 간단히 로그만 남김.
                // 실제 파싱 로직:
                // const nodes = extractAllNodesFromRoute(rd.interleaved_route).map(String);
                // const links = extractAllLinksFromRoute(rd.interleaved_route).map(String);
                // renderGeoJsonRoute(nodes, links);
                 console.warn("[MapContainer] Client itinerary has interleaved_route, but direct rendering logic for it is complex here.");
            }
        }
    } else {
      // console.log("[MapContainer] Not rendering server/itinerary routes - conditions not met.");
    }
  }, [map, isMapInitialized, selectedItineraryDay, serverRoutesData, itinerary, renderGeoJsonRoute, clearAllRoutes]);


  // 프롬프트 3: 전체 여정의 모든 경로 표시 (renderAllRoutes 대체)
  // 이 기능은 useMapVisualization 또는 선택된 날짜 변경 시의 로직으로 통합될 수 있음
  // 여기서는 별도로 구현하지 않고, selectedItineraryDay 변경에 따른 경로 업데이트에 집중

  // 프롬프트 3: 장소 선택 시 해당 위치로 지도 이동
  useEffect(() => {
    if (selectedPlace && typeof selectedPlace.y === 'number' && typeof selectedPlace.x === 'number') {
      panTo({ lat: selectedPlace.y, lng: selectedPlace.x });
    }
  }, [selectedPlace, panTo]);

  // Map 컴포넌트에 필요한 props 전달 (빌드 오류 TS2739 해결)
  // selectedDay prop에는 selectedItineraryDay 사용
  const mapComponentProps: MapProps = {
    places: places, // 검색 결과 등 일반 장소
    selectedPlace: selectedPlace, // 하이라이트 및 이동 대상 장소
    itinerary: itinerary, // 전체 일정 (마커 및 경로 표시용)
    selectedDay: selectedItineraryDay, // 현재 선택된 날짜 (경로 하이라이트 등)
    selectedPlaces: selectedPlacesFromPanel, // 왼쪽 패널에서 선택한 장소들
  };

  return (
    <div ref={mapContainerRef} className="w-full h-full relative">
      <Map {...mapComponentProps} />
      {/* 
        MapLoadingOverlay 등 다른 UI 요소들이 여기에 올 수 있음 
        예시: <MapLoadingOverlay loading={!isMapInitialized} />
      */}
    </div>
  );
};

export default MapContainer;
