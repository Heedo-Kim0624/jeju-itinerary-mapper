
import React, { useEffect, useState, useRef } from 'react';
import { useMapContext } from './MapContext';
import { useItinerary } from '@/hooks/use-itinerary';
import type { ItineraryDay, ItineraryPlaceWithTime, Place } from '@/types/supabase'; // Make sure Place is imported

const MapContainer: React.FC = () => {
  const { 
    map: mapInstance, // Use map instance from context
    isMapInitialized, // Use initialization status from context
    serverRoutesData // Renamed from serverRoutes in user prompt to match context
  } = useMapContext();
  const { itinerary, selectedItineraryDay } = useItinerary();
  
  const [nodeData, setNodeData] = useState<any>(null); // GeoJSON Nodes
  const [linkData, setLinkData] = useState<any>(null); // GeoJSON Links
  
  const markersRef = useRef<any[]>([]);
  const polylinesRef = useRef<any[]>([]);

  // GeoJSON 데이터 로드
  useEffect(() => {
    const loadGeoJsonData = async () => {
      try {
        console.log('[MapContainer] GeoJSON 데이터 로드 시작...');
        const nodeResponse = await fetch('/NODE_JSON.geojson');
        if (!nodeResponse.ok) throw new Error(`NODE_JSON.geojson 로드 실패: ${nodeResponse.status}`);
        const nodeJson = await nodeResponse.json();
        setNodeData(nodeJson);
        console.log('[MapContainer] NODE_JSON.geojson 로드 완료:', nodeJson.features.length, '개의 노드');

        const linkResponse = await fetch('/LINK_JSON.geojson');
        if (!linkResponse.ok) throw new Error(`LINK_JSON.geojson 로드 실패: ${linkResponse.status}`);
        const linkJson = await linkResponse.json();
        setLinkData(linkJson);
        console.log('[MapContainer] LINK_JSON.geojson 로드 완료:', linkJson.features.length, '개의 링크');
      } catch (error) {
        console.error('[MapContainer] GeoJSON 데이터 로드 실패:', error);
      }
    };

    loadGeoJsonData();
  }, []);

  // 선택된 일자에 따라 경로 시각화
  useEffect(() => {
    if (!isMapInitialized || !mapInstance || !nodeData || !linkData || !itinerary || selectedItineraryDay === null) {
      // Clear previous objects if map becomes unready or no itinerary
      if (mapInstance) {
        markersRef.current.forEach(marker => marker.setMap(null));
        polylinesRef.current.forEach(polyline => polyline.setMap(null));
        markersRef.current = [];
        polylinesRef.current = [];
      }
      return;
    }

    // 기존 마커와 폴리라인 제거
    markersRef.current.forEach(marker => marker.setMap(null));
    polylinesRef.current.forEach(polyline => polyline.setMap(null));
    const newMarkers: any[] = [];
    const newPolylines: any[] = [];

    // 선택된 일자의 경로 데이터 가져오기
    const currentDaySchedule = itinerary.find(day => day.day === selectedItineraryDay);
    if (!currentDaySchedule) {
      console.warn(`[MapContainer] 선택된 일자(${selectedItineraryDay})의 일정 데이터가 없습니다.`);
      return;
    }

    console.log(`[MapContainer] 일자 ${selectedItineraryDay}의 경로 시각화 시작`);

    // 장소 마커 표시
    currentDaySchedule.places.forEach((place, index) => {
      const nodeId = place.nodeId || String(place.id); // Use nodeId if available, else fallback to id
      const nodeFeature = nodeData.features.find((f: any) => String(f.properties.NODE_ID) === nodeId || String(f.properties.node_id) === nodeId);
      
      if (nodeFeature && nodeFeature.geometry && nodeFeature.geometry.coordinates) {
        const position = new window.naver.maps.LatLng(
          nodeFeature.geometry.coordinates[1], // Latitude
          nodeFeature.geometry.coordinates[0]  // Longitude
        );

        let markerColor = '#FF0000'; // Default red
        switch (place.category) {
          case '숙소': markerColor = '#3F51B5'; break;
          case '관광지': markerColor = '#4CAF50'; break;
          case '음식점': markerColor = '#FF9800'; break; // Changed to match ItineraryView example
          case '카페': markerColor = '#9C27B0'; break;
          case '공항': markerColor = '#757575'; break; // Changed to match ItineraryView example
        }

        const marker = new window.naver.maps.Marker({
          position,
          map: mapInstance,
          title: place.name,
          icon: {
            content: `
              <div style="
                width: 30px; height: 30px; border-radius: 50%;
                background-color: ${markerColor}; display: flex;
                justify-content: center; align-items: center;
                color: white; font-weight: bold; font-size: 14px;
                border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);
              ">
                ${index + 1}
              </div>`,
            anchor: new window.naver.maps.Point(15, 15)
          },
          zIndex: 100 + index // Ensure markers are above polylines and later markers above earlier ones
        });

        const infoWindow = new window.naver.maps.InfoWindow({
          content: `
            <div style="padding:10px; max-width:220px; font-size:12px; line-height:1.5;">
              <h3 style="margin:0 0 5px; font-size:14px; font-weight:bold;">${place.name}</h3>
              <p style="margin:0 0 3px;">카테고리: ${place.category}</p>
              <p style="margin:0 0 3px;">시간: ${place.timeBlock?.split('_')[1] || '미정'}시</p>
              ${place.distanceToNext ? `<p style="margin:0;">다음 (${place.nextPlaceName || '장소'})까지: ${(place.distanceToNext / 1000).toFixed(1)}km (약 ${place.travelTimeToNext}분)</p>` : ''}
            </div>`,
          maxWidth: 250,
          borderColor: markerColor,
          borderWidth: 2,
        });

        window.naver.maps.Event.addListener(marker, 'click', () => {
            if (infoWindow.getMap()) {
                infoWindow.close();
            } else {
                infoWindow.open(mapInstance, marker);
            }
        });
        newMarkers.push(marker);
      } else {
        console.warn(`[MapContainer] NODE_ID ${nodeId} (장소: ${place.name})에 해당하는 GeoJSON 노드 데이터를 찾을 수 없습니다.`);
      }
    });
    markersRef.current = newMarkers;

    // 경로 폴리라인 표시
    if (currentDaySchedule.routeSegments && currentDaySchedule.routeSegments.length > 0) {
      currentDaySchedule.routeSegments.forEach(segment => {
        const pathCoordinates: any[] = [];
        // A segment has 'nodes' and 'links'. The 'links' are IDs of link features.
        // A single segment route is defined by its sequence of links.
        segment.links.forEach(linkId => {
          const linkFeature = linkData.features.find((f: any) => String(f.properties.LINK_ID) === linkId || String(f.properties.link_id) === linkId);
          if (linkFeature && linkFeature.geometry && linkFeature.geometry.coordinates) {
            // Add all points from this link feature to the path
            linkFeature.geometry.coordinates.forEach((coord: number[]) => {
              if (coord.length >= 2) {
                pathCoordinates.push(new window.naver.maps.LatLng(coord[1], coord[0]));
              }
            });
          } else {
             console.warn(`[MapContainer] LINK_ID ${linkId}에 해당하는 GeoJSON 링크 데이터를 찾을 수 없습니다.`);
          }
        });

        if (pathCoordinates.length >= 2) {
          const polyline = new window.naver.maps.Polyline({
            path: pathCoordinates,
            strokeColor: '#03A9F4', // Light Blue
            strokeWeight: 5,
            strokeOpacity: 0.8,
            map: mapInstance,
            zIndex: 90
          });

          const segmentInfoWindow = new window.naver.maps.InfoWindow({
            content: `
              <div style="padding:10px; font-size:12px;">
                <p style="margin:0 0 3px;"><strong>${segment.fromPlaceName}</strong></p>
                <p style="margin:0 0 3px;">&nbsp;&nbsp;↓</p>
                <p style="margin:0 0 3px;"><strong>${segment.toPlaceName}</strong></p>
                <p style="margin:0;">거리: ${(segment.distance / 1000).toFixed(1)}km</p>
              </div>`,
             borderColor: '#03A9F4',
             borderWidth: 2,
          });
           window.naver.maps.Event.addListener(polyline, 'click', (e: any) => {
                segmentInfoWindow.setPosition(e.coord);
                segmentInfoWindow.open(mapInstance);
           });
          newPolylines.push(polyline);
        }
      });
    } else if (serverRoutesData && serverRoutesData[selectedItineraryDay] && serverRoutesData[selectedItineraryDay].interleaved_route) {
      // Fallback to interleaved_route if routeSegments is not available
      console.log(`[MapContainer] routeSegments 없음, interleaved_route로 폴백합니다 (일자: ${selectedItineraryDay})`);
      const interleaved = serverRoutesData[selectedItineraryDay].interleaved_route;
      const linkIds = interleaved?.filter((_, i) => i % 2 === 1).map(String) || [];

      linkIds.forEach(linkId => {
        const linkFeature = linkData.features.find((f: any) => String(f.properties.LINK_ID) === linkId || String(f.properties.link_id) === linkId);
        if (linkFeature && linkFeature.geometry && linkFeature.geometry.coordinates) {
          const pathCoords = linkFeature.geometry.coordinates.map((coord: number[]) => 
            new window.naver.maps.LatLng(coord[1], coord[0])
          );
          if (pathCoords.length >= 2) {
            const polyline = new window.naver.maps.Polyline({
              path: pathCoords, strokeColor: '#4CAF50', strokeWeight: 4, strokeOpacity: 0.7, map: mapInstance, zIndex: 90
            });
            newPolylines.push(polyline);
          }
        }
      });
    }
    polylinesRef.current = newPolylines;

    // 지도 영역 조정
    if (newMarkers.length > 0) {
      const bounds = new window.naver.maps.LatLngBounds();
      newMarkers.forEach(marker => bounds.extend(marker.getPosition()));
      mapInstance.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
    } else if (newPolylines.length > 0) {
        // If only polylines, fit to polylines
        const bounds = new window.naver.maps.LatLngBounds();
        newPolylines.forEach(polyline => {
            polyline.getPath().forEach((latlng: any) => bounds.extend(latlng));
        });
        if (!bounds.isEmpty()) {
            mapInstance.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
        }
    }

    console.log(`[MapContainer] 일자 ${selectedItineraryDay}의 경로 시각화 완료. 마커: ${newMarkers.length}, 폴리라인: ${newPolylines.length}`);

  }, [isMapInitialized, mapInstance, nodeData, linkData, itinerary, selectedItineraryDay, serverRoutesData]);
  
  // This component doesn't render its own div for the map; it operates on the map instance from context.
  // The actual <div #map> is managed by Map.tsx via MapContext's mapContainer ref.
  // So, this component effectively injects markers/polylines into the existing map.
  // Return null or a fragment as it's not rendering primary DOM structure for the map itself.
  return null; 
};

export default MapContainer;
