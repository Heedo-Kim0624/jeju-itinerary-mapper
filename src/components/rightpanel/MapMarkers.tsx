import React, { useEffect, useRef } from 'react';
import { useMapContext } from './MapContext';
import type { Place, ItineraryDay, ItineraryPlaceWithTime } from '@/types/core';
import { clearMarkers as clearDrawnMarkers, panToPosition, fitBoundsToPlaces, getMarkerIconOptions, createNaverMarker, createNaverLatLng } from '@/utils/map/mapDrawing';

interface MapMarkersProps {
  places: Place[];
  selectedPlace: Place | null;
  itinerary: ItineraryDay[] | null;
  selectedDay: number | null;
  selectedPlaces?: Place[]; 
  onPlaceClick?: (place: Place | ItineraryPlaceWithTime, index: number) => void;
  highlightPlaceId?: string;
}

const MapMarkers: React.FC<MapMarkersProps> = ({
  places,
  selectedPlace,
  itinerary,
  selectedDay,
  selectedPlaces = [],
  onPlaceClick,
  highlightPlaceId,
}) => {
  const { map, isMapInitialized, isNaverLoaded } = useMapContext();
  const markersRef = useRef<naver.maps.Marker[]>([]); // 타입 수정: window.naver.maps.Marker -> naver.maps.Marker
  const prevSelectedDayRef = useRef<number | null>(null);
  const prevItineraryRef = useRef<ItineraryDay[] | null>(null);

  // 모든 마커 제거 함수
  const clearAllMarkers = () => {
    if (markersRef.current.length > 0) {
      console.log("[MapMarkers] 기존 마커 모두 제거 중:", markersRef.current.length + "개");
      clearDrawnMarkers(markersRef.current); 
      markersRef.current = [];
    }
  };

  useEffect(() => {
    if (!map || !isMapInitialized || !isNaverLoaded || !window.naver || !window.naver.maps) {
      console.log("[MapMarkers] 지도 미초기화, Naver API 미로드, 또는 window.naver.maps 없음. 마커 표시 건너뜀.");
      return;
    }

    const isItineraryStructurallyChanged = prevItineraryRef.current !== itinerary;
    const isDayChanged = selectedDay !== prevSelectedDayRef.current;
    const currentPlacesForComparison = itinerary ? null : places; // Compare general places only if not in itinerary mode
    const prevPlacesForComparison = prevItineraryRef.current ? null : (markersRef as any)._prevPlacesList;
    const isPlacesListChanged = !itinerary && currentPlacesForComparison !== prevPlacesForComparison;


    if (isItineraryStructurallyChanged || isDayChanged || isPlacesListChanged || selectedPlace !== (markersRef as any)._prevSelectedPlace || highlightPlaceId !== (markersRef as any)._prevHighlightPlaceId ) {
      console.log("[MapMarkers] 변경 감지, 마커 재생성:", {
        isItineraryStructurallyChanged,
        isDayChanged,
        isPlacesListChanged,
        selectedDay,
        itineraryLength: itinerary?.length,
        placesLength: places?.length,
        selectedPlaceId: selectedPlace?.id,
        highlightPlaceId,
      });
      
      clearAllMarkers();
      
      prevSelectedDayRef.current = selectedDay;
      prevItineraryRef.current = itinerary; 
      (markersRef as any)._prevSelectedPlace = selectedPlace;
      (markersRef as any)._prevHighlightPlaceId = highlightPlaceId;
      if (!itinerary) {
        (markersRef as any)._prevPlacesList = places;
      }

      let placesToDisplay: (Place | ItineraryPlaceWithTime)[] = [];
      let isDisplayingItineraryDay = false;

      if (selectedDay !== null && itinerary && itinerary.length > 0) {
        const currentDayData = itinerary.find(day => day.day === selectedDay);
        if (currentDayData && currentDayData.places && currentDayData.places.length > 0) {
          placesToDisplay = currentDayData.places;
          isDisplayingItineraryDay = true;
          console.log(`[MapMarkers] ${selectedDay}일차 일정 장소 ${placesToDisplay.length}개 표시합니다.`);
        } else {
           console.log(`[MapMarkers] ${selectedDay}일차 데이터/장소 없음. 일반 장소 표시.`);
          placesToDisplay = places || [];
        }
      } else {
        placesToDisplay = places || [];
        console.log(`[MapMarkers] 일정/선택일자 없음. 일반 장소 ${placesToDisplay.length}개 표시.`);
      }
      
      if (placesToDisplay.length > 0) {
        const validPlacesToDisplay = placesToDisplay.filter(p => {
            if (p.x != null && p.y != null && !isNaN(Number(p.x)) && !isNaN(Number(p.y))) return true;
            console.warn(`[MapMarkers] 장소 '${p.name}' 좌표 유효하지 않음: x=${p.x}, y=${p.y}`);
            return false;
        });

        if (validPlacesToDisplay.length === 0) {
            console.log("[MapMarkers] 유효한 좌표를 가진 표시할 장소가 없습니다.");
        } else {
            console.log(`[MapMarkers] 유효한 장소 ${validPlacesToDisplay.length}개에 대해 마커 생성 중`);
            const newMarkers: naver.maps.Marker[] = []; // 타입 수정
            validPlacesToDisplay.forEach((place, index) => {
              // Ensure window.naver.maps is available for runtime calls
              if (!window.naver || !window.naver.maps) return;

              const position = createNaverLatLng(place.y!, place.x!); 
              
              const isGloballySelected = selectedPlaces.some(sp => sp.id === place.id);
              const isInfoWindowTarget = selectedPlace?.id === place.id;
              const isGeneralHighlightTarget = highlightPlaceId === place.id;

              let iconOptions;
              if (isDisplayingItineraryDay) {
                iconOptions = {
                  content: `<div style="width:28px;height:28px;background-color:${(place as ItineraryPlaceWithTime).isFallback ? '#757575' : '#FF5A5F'};border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);color:white;font-weight:bold;font-size:12px;display:flex;align-items:center;justify-content:center;">${index + 1}</div>`,
                  anchor: new window.naver.maps.Point(14, 14)
                };
              } else {
                const placeForIcon = place as Place; 
                iconOptions = getMarkerIconOptions(placeForIcon, isInfoWindowTarget || isGeneralHighlightTarget, isGloballySelected && !isInfoWindowTarget && !isGeneralHighlightTarget, false);
              }
              
              const marker = createNaverMarker(map, position, iconOptions, place.name);
              
              if (onPlaceClick && window.naver && window.naver.maps && window.naver.maps.Event) { 
                window.naver.maps.Event.addListener(marker, 'click', () => {
                  console.log(`[MapMarkers] 마커 클릭: ${place.name} (인덱스: ${index})`);
                  onPlaceClick(place, index);
                });
              }
              newMarkers.push(marker);
            });
            markersRef.current = newMarkers;

            if (isDisplayingItineraryDay && validPlacesToDisplay.length > 0) {
                console.log("[MapMarkers] 일정 모드: 마커에 맞게 지도 범위 조정");
                fitBoundsToPlaces(map, validPlacesToDisplay as Place[]);
            } else if (validPlacesToDisplay.length > 0 && !selectedPlace && !highlightPlaceId) {
                console.log("[MapMarkers] 일반 모드 (선택된 장소/하이라이트 없음): 지도 범위 조정");
                fitBoundsToPlaces(map, validPlacesToDisplay as Place[]);
            }
        }
      } else {
        console.log("[MapMarkers] 표시할 장소가 없습니다.");
      }
      
      const placeToFocus = selectedPlace || (highlightPlaceId ? placesToDisplay.find(p => p.id === highlightPlaceId) : null);
      if (placeToFocus && placeToFocus.y != null && placeToFocus.x != null) {
        console.log(`[MapMarkers] 특정 장소로 이동: ${placeToFocus.name}`);
        if (map.getZoom() < 15) map.setZoom(15);
        panToPosition(map, placeToFocus.y, placeToFocus.x);
      } else if (placeToFocus) {
        console.warn(`[MapMarkers] 포커스 대상 장소 '${placeToFocus.name}' 좌표 없음.`);
      }
    }

  }, [
    map, isMapInitialized, isNaverLoaded, 
    places, selectedPlace, itinerary, selectedDay, selectedPlaces, 
    onPlaceClick, highlightPlaceId
  ]);

  return null;
};

export default MapMarkers;
