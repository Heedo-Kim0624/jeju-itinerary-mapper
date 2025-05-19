import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Place, ItineraryDay, ItineraryPlaceWithTime, RouteData } from '@/types/index';
import { ServerRouteResponse, ExtractedRouteData } from '@/types/schedule'; // ExtractedRouteData 정의 확인 필요
import { useMapFeatures } from '@/hooks/map/useMapFeatures';
import { useServerRoutes } from '@/hooks/map/useServerRoutes';
import { parseInterleavedRoute, extractAllNodesFromRoute, extractAllLinksFromRoute } from '@/utils/routeParser';
import { toast } from 'sonner';

const naver = typeof window !== 'undefined' ? (window as any).naver : null;

interface UseMapCoreProps {
  initialGeoJsonVisibility?: boolean;
}

const useMapCore = ({ initialGeoJsonVisibility = false }: UseMapCoreProps = {}) => {
  const [map, setMap] = useState<any>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const [isMapInitialized, setIsMapInitialized] = useState<boolean>(false);
  const [isNaverLoaded, setIsNaverLoaded] = useState<boolean>(false);
  const [isMapError, setIsMapError] = useState<boolean>(false);
  const [showGeoJson, setShowGeoJson] = useState<boolean>(initialGeoJsonVisibility);
  const [isGeoJsonLoaded, setIsGeoJsonLoaded] = useState<boolean>(false);
  const [geoJsonNodes, setGeoJsonNodes] = useState<any[]>([]);
  const [geoJsonLinks, setGeoJsonLinks] = useState<any[]>([]);
  const [displayedFeatures, setDisplayedFeatures] = useState<any[]>([]);
  const [serverRoutesData, setServerRoutesData] = useState<Record<number, ServerRouteResponse>>({});

  const { renderGeoJsonRoute, renderItineraryRoute, clearPreviousHighlightedPath, showRouteForPlaceIndex, extractNodeAndLinkIds } = useMapFeatures(map);
  const { setServerRoutes } = useServerRoutes();

  // GeoJSON 로딩 및 렌더링 상태를 관리하는 상태 추가
  const [isGeoJsonLoading, setIsGeoJsonLoading] = useState(false);
  const [geoJsonError, setGeoJsonError] = useState<Error | null>(null);

  const clearAllRoutes = useCallback(() => {
    if (window.geoJsonLayer && typeof window.geoJsonLayer.clearAllRoutes === 'function') {
      window.geoJsonLayer.clearAllRoutes();
      console.log('GeoJSON 경로가 지워졌습니다.');
    } else {
      console.warn('GeoJSON 렌더링 레이어를 찾을 수 없습니다.');
    }
  }, []);

  const handleGeoJsonLoaded = useCallback((nodes: any[], links: any[]) => {
    setGeoJsonNodes(nodes);
    setGeoJsonLinks(links);
    setIsGeoJsonLoaded(true);
    console.log('GeoJSON 데이터가 로드되었습니다.', { nodes, links });
  }, []);

  const handleDisplayedFeaturesChange = useCallback((features: any[]) => {
    setDisplayedFeatures(features);
  }, []);

  const toggleGeoJsonVisibility = useCallback(() => {
    setShowGeoJson(prev => !prev);
  }, []);

  const addMarkers = useCallback((places: Place[], opts: any = {}) => {
    if (!map || !naver || !naver.maps) {
      console.warn('지도 API가 초기화되지 않았습니다.');
      return [];
    }

    const { highlight = false, isItinerary = false, useRecommendedStyle = false, useColorByCategory = false, onClick } = opts;
    const markers: any[] = [];

    places.forEach((place, index) => {
      if (!place.y || !place.x) {
        console.warn(`잘못된 좌표: ${place.name} (lat: ${place.y}, lng: ${place.x})`);
        return;
      }

      const position = new naver.maps.LatLng(place.y, place.x);
      const content = `<div class='marker'>${place.name}</div>`;
      const iconStyle = {
        content: `<div style="width: 20px; height: 20px; background-color: ${useColorByCategory ? getColorByCategory(place.category) : (highlight ? 'red' : 'blue')}; border-radius: 50%;"></div>`,
        anchor: new naver.maps.Point(10, 10)
      };

      const marker = new naver.maps.Marker({
        map: map,
        position: position,
        title: place.name,
        icon: iconStyle,
        zIndex: highlight ? 100 : 1
      });

      if (onClick) {
        naver.maps.Event.addListener(marker, 'click', () => {
          onClick(place, index);
        });
      }

      markers.push(marker);
    });

    return markers;
  }, [map, naver]);

  const calculateRoutes = useCallback((places: Place[]) => {
    console.log('calculateRoutes is called');
  }, []);

  const clearMarkersAndUiElements = useCallback(() => {
    if (!map || !naver || !naver.maps) {
      console.warn('지도 API가 초기화되지 않았습니다.');
      return;
    }

    // Clear existing markers
    if (map.markers && Array.isArray(map.markers)) {
      map.markers.forEach((marker: any) => marker.setMap(null));
    }
    map.markers = [];

    // Clear existing info windows
    if (map.infoWindows && Array.isArray(map.infoWindows)) {
      map.infoWindows.forEach((infoWindow: any) => infoWindow.close());
    }
    map.infoWindows = [];

    // Clear existing polylines
    if (map.polylines && Array.isArray(map.polylines)) {
      map.polylines.forEach((polyline: any) => polyline.setMap(null));
    }
    map.polylines = [];

    console.log('기존 마커, 정보 창, 경로를 지웠습니다.');
  }, [map, naver]);

  const panTo = useCallback((locationOrCoords: string | { lat: number; lng: number }) => {
    if (!map || !naver || !naver.maps) {
      console.warn('지도 API가 초기화되지 않았습니다.');
      return;
    }

    if (typeof locationOrCoords === 'string') {
      // Geocoding logic (omitted for brevity)
      console.log('Geocoding is not implemented yet.');
    } else {
      const { lat, lng } = locationOrCoords;
      const targetLocation = new naver.maps.LatLng(lat, lng);
      map.panTo(targetLocation);
      console.log(`지도 중심을 ${lat}, ${lng}로 이동했습니다.`);
    }
  }, [map, naver]);

  const checkGeoJsonMapping = useCallback((places: Place[]) => {
    if (!geoJsonNodes || geoJsonNodes.length === 0) {
      return {
        totalPlaces: places.length,
        mappedPlaces: 0,
        mappingRate: '0%',
        averageDistance: 'N/A',
        success: false,
        message: 'GeoJSON 노드 데이터가 없습니다.'
      };
    }

    let totalDistance = 0;
    let mappedCount = 0;

    const mappedPlaces = places.map(place => {
      if (!place.x || !place.y) return null;

      const placeCoords = new naver.maps.LatLng(place.y, place.x);
      let closestNode = null;
      let minDistance = Infinity;

      geoJsonNodes.forEach((node: any) => {
        const [lng, lat] = node.geometry.coordinates;
        const nodeCoords = new naver.maps.LatLng(lat, lng);
        const distance = naver.maps.geometry.spherical.computeDistanceBetween(placeCoords, nodeCoords);

        if (distance < minDistance) {
          minDistance = distance;
          closestNode = node;
        }
      });

      if (closestNode) {
        mappedCount++;
        totalDistance += minDistance;
        return { ...place, geoNodeId: closestNode.properties.NODE_ID, geoNodeDistance: minDistance };
      }

      return null;
    }).filter(Boolean);

    const averageDistance = mappedCount > 0 ? totalDistance / mappedCount : 0;
    const mappingRate = `${((mappedCount / places.length) * 100).toFixed(1)}%`;
    const success = mappedCount === places.length;
    const message = success ? '모든 장소가 성공적으로 매핑되었습니다.' : '일부 장소만 매핑되었습니다.';

    return {
      totalPlaces: places.length,
      mappedPlaces: mappedCount,
      mappingRate,
      averageDistance: averageDistance.toFixed(2),
      success,
      message
    };
  }, [geoJsonNodes, naver]);

  const mapPlacesWithGeoNodes = useCallback((places: Place[]) => {
    if (!geoJsonNodes || geoJsonNodes.length === 0) {
      console.warn('GeoJSON 노드 데이터가 없습니다. 매핑을 건너뜁니다.');
      return places;
    }

    return places.map(place => {
      if (!place.x || !place.y) return place;

      const placeCoords = new naver.maps.LatLng(place.y, place.x);
      let closestNode = null;
      let minDistance = Infinity;

      geoJsonNodes.forEach((node: any) => {
        const [lng, lat] = node.geometry.coordinates;
        const nodeCoords = new naver.maps.LatLng(lat, lng);
        const distance = naver.maps.geometry.spherical.computeDistanceBetween(placeCoords, nodeCoords);

        if (distance < minDistance) {
          minDistance = distance;
          closestNode = node;
        }
      });

      if (closestNode) {
        return { ...place, geoNodeId: closestNode.properties.NODE_ID, geoNodeDistance: minDistance };
      }

      return place;
    });
  }, [geoJsonNodes, naver]);

  useEffect(() => {
    const initializeMap = () => {
      if (!naver || !naver.maps) {
        setIsMapError(true);
        console.error('Naver Maps API 로딩 실패.');
        return;
      }

      setIsNaverLoaded(true);

      if (!mapContainer.current) {
        console.error('지도 컨테이너를 찾을 수 없습니다.');
        return;
      }

      try {
        const initialMap = new naver.maps.Map(mapContainer.current, {
          center: new naver.maps.LatLng(33.38, 126.55),
          zoom: 11,
          minZoom: 8,
          maxZoom: 17,
          zoomControl: true,
          zoomControlOptions: {
            style: naver.maps.ZoomControlStyle.SMALL,
            position: naver.maps.Position.TOP_RIGHT
          },
          scaleControl: false,
          mapDataControl: false,
          logoControl: false,
          tileTransition: false
        });

        setMap(initialMap);
        setIsMapInitialized(true);
        console.log('지도가 초기화되었습니다.');

        initialMap.markers = [];
        initialMap.infoWindows = [];
        initialMap.polylines = [];
      } catch (error) {
        setIsMapError(true);
        console.error('지도 초기화 중 오류 발생:', error);
      }
    };

    initializeMap();
  }, []);

  const registerGlobalInterface = useCallback(() => {
    if (window) {
      (window as any).geoJsonLayer = {
        renderRoute: (nodeIds: string[], linkIds: string[], style: any = {}) => {
          if (!map || !naver || !naver.maps) {
            console.warn('Naver Maps API가 초기화되지 않았습니다.');
            return [];
          }
          if (!geoJsonNodes || !geoJsonLinks) {
            console.warn('GeoJSON 데이터가 로드되지 않았습니다.');
            return [];
          }

          const renderedFeatures: any[] = [];

          // 노드 ID에 해당하는 노드들을 찾아서 마커로 표시
          nodeIds.forEach(nodeId => {
            const node = geoJsonNodes.find(node => node.properties.NODE_ID === nodeId);
            if (node) {
              const [lng, lat] = node.geometry.coordinates;
              const marker = new naver.maps.Marker({
                position: new naver.maps.LatLng(lat, lng),
                map: map,
                title: `Node ${nodeId}`,
                zIndex: style.zIndex || 100
              });
              renderedFeatures.push(marker);
            }
          });

          // 링크 ID에 해당하는 링크들을 찾아서 경로로 표시
          linkIds.forEach(linkId => {
            const link = geoJsonLinks.find(link => link.properties.LINK_ID === linkId);
            if (link) {
              const path = link.geometry.coordinates.map((coord: number[]) => new naver.maps.LatLng(coord[1], coord[0]));
              const polyline = new naver.maps.Polyline({
                path: path,
                strokeColor: style.strokeColor || '#0000FF',
                strokeOpacity: style.strokeOpacity || 0.8,
                strokeWeight: style.strokeWeight || 3,
                map: map,
                zIndex: style.zIndex || 90
              });
              renderedFeatures.push(polyline);
            }
          });

          console.log(`[geoJsonLayer.renderRoute] ${renderedFeatures.length}개의 GeoJSON feature 렌더링`);
          return renderedFeatures;
        },
        clearAllRoutes: () => {
          if (!map || !naver || !naver.maps) {
            console.warn('Naver Maps API가 초기화되지 않았습니다.');
            return;
          }
          if (!displayedFeatures) return;

          displayedFeatures.forEach(feature => {
            feature.setMap(null);
          });
          setDisplayedFeatures([]);
          console.log('지도에서 모든 GeoJSON 경로를 지웠습니다.');
        }
      };
      console.log('전역 GeoJSON 인터페이스가 등록되었습니다.');
      return () => {
        delete (window as any).geoJsonLayer;
        console.log('전역 GeoJSON 인터페이스가 해제되었습니다.');
      };
    }
  }, [map, naver, geoJsonNodes, geoJsonLinks, displayedFeatures, setDisplayedFeatures]);

  const getColorByCategory = (category: string) => {
    switch (category) {
      case 'accommodation': return '#FF5733'; // Red-like
      case 'landmark': return '#3498DB'; // Blue-like
      case 'restaurant': return '#2ECC71'; // Green-like
      case 'cafe': return '#F39C12'; // Orange-like
      default: return '#95A5A6'; // Gray
    }
  };

  return {
    map,
    mapContainer,
    isMapInitialized,
    isNaverLoaded,
    isMapError,
    addMarkers,
    calculateRoutes,
    clearMarkersAndUiElements,
    panTo,
    showGeoJson,
    toggleGeoJsonVisibility,
    renderItineraryRoute,
    clearAllRoutes,
    handleGeoJsonLoaded,
    highlightSegment: () => { },
    clearPreviousHighlightedPath,
    isGeoJsonLoaded,
    checkGeoJsonMapping,
    mapPlacesWithGeoNodes,
    showRouteForPlaceIndex,
    renderGeoJsonRoute,
    geoJsonNodes,
    geoJsonLinks,
    setServerRoutes,
    serverRoutesData
  };
};

export default useMapCore;
