import { useState, useEffect, useRef, useCallback } from 'react';
import { useMapInitialization } from '@/hooks/map/useMapInitialization';
import { useMapResize } from '@/hooks/useMapResize';
import { Place, ItineraryDay } from '@/types/supabase';
import { ServerRouteResponse } from '@/types/schedule';
import { toast } from 'sonner';
import { getCategoryColor } from '@/utils/map/mapStyles';

// Custom hook for map core functionality
const useMapCore = () => {
  // Map initialization
  const {
    map,
    mapContainer,
    isMapInitialized,
    isNaverLoaded,
    isMapError,
    isGeoJsonInitialized
  } = useMapInitialization();

  // Handle map resize
  useMapResize(map);

  // State for markers and UI elements
  const markers = useRef<any[]>([]);
  const polylines = useRef<any[]>([]);
  const infoWindows = useRef<any[]>([]);
  const highlightedPath = useRef<any[]>([]);
  const [showGeoJson, setShowGeoJson] = useState<boolean>(false);
  const [isGeoJsonLoaded, setIsGeoJsonLoaded] = useState<boolean>(false);
  const [geoJsonNodes, setGeoJsonNodes] = useState<any[]>([]);
  const [geoJsonLinks, setGeoJsonLinks] = useState<any[]>([]);
  const [serverRoutesData, setServerRoutesData] = useState<Record<number, ServerRouteResponse>>({});

  // Toggle GeoJSON visibility
  const toggleGeoJsonVisibility = useCallback(() => {
    setShowGeoJson(prev => !prev);
  }, []);

  // Clear all markers and UI elements
  const clearMarkersAndUiElements = useCallback(() => {
    // Clear markers
    if (markers.current.length > 0) {
      markers.current.forEach(marker => {
        if (marker && typeof marker.setMap === 'function') {
          marker.setMap(null);
        }
      });
      markers.current = [];
    }

    // Clear polylines
    if (polylines.current.length > 0) {
      polylines.current.forEach(polyline => {
        if (polyline && typeof polyline.setMap === 'function') {
          polyline.setMap(null);
        }
      });
      polylines.current = [];
    }

    // Clear info windows
    if (infoWindows.current.length > 0) {
      infoWindows.current.forEach(infoWindow => {
        if (infoWindow && typeof infoWindow.close === 'function') {
          infoWindow.close();
        }
      });
      infoWindows.current = [];
    }

    // Clear highlighted path
    if (highlightedPath.current.length > 0) {
      highlightedPath.current.forEach(item => {
        if (item && typeof item.setMap === 'function') {
          item.setMap(null);
        }
      });
      highlightedPath.current = [];
    }
  }, []);

  // Add markers to the map
  const addMarkers = useCallback((places: Place[], opts: {
    highlight?: boolean;
    isItinerary?: boolean;
    useRecommendedStyle?: boolean;
    useColorByCategory?: boolean;
    onClick?: (place: Place, index: number) => void;
  } = {}) => {
    if (!map || !window.naver || !window.naver.maps) {
      console.warn("Map is not initialized yet");
      return [];
    }

    const newMarkers: any[] = [];

    places.forEach((place, index) => {
      if (!place.x || !place.y) {
        console.warn(`Place ${place.name} has no coordinates`);
        return;
      }

      // Determine marker style based on options
      let markerOptions: any = {
        position: new window.naver.maps.LatLng(place.y, place.x),
        map: map,
        title: place.name,
        zIndex: opts.highlight ? 100 : 10
      };

      // Apply category-based styling if requested
      if (opts.useColorByCategory && place.category) {
        const color = getCategoryColor(place.category);
        markerOptions.icon = {
          content: `<div class="marker-container" style="position: relative;">
                      <div class="marker-pin" style="width: 30px; height: 30px; border-radius: 50%; background-color: ${color}; display: flex; justify-content: center; align-items: center; color: white; font-weight: bold; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
                        ${index + 1}
                      </div>
                    </div>`,
          anchor: new window.naver.maps.Point(15, 15)
        };
      } else if (opts.highlight) {
        // Highlighted marker style
        markerOptions.icon = {
          content: `<div class="marker-container" style="position: relative;">
                      <div class="marker-pin" style="width: 30px; height: 30px; border-radius: 50%; background-color: #ff3e3e; display: flex; justify-content: center; align-items: center; color: white; font-weight: bold; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
                        ${index + 1}
                      </div>
                    </div>`,
          anchor: new window.naver.maps.Point(15, 15)
        };
      } else {
        // Default marker style
        markerOptions.icon = {
          content: `<div class="marker-container" style="position: relative;">
                      <div class="marker-pin" style="width: 24px; height: 24px; border-radius: 50%; background-color: #4285F4; display: flex; justify-content: center; align-items: center; color: white; font-weight: bold; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
                        ${index + 1}
                      </div>
                    </div>`,
          anchor: new window.naver.maps.Point(12, 12)
        };
      }

      // Create the marker
      const marker = new window.naver.maps.Marker(markerOptions);

      // Add click event if callback provided
      if (opts.onClick) {
        window.naver.maps.Event.addListener(marker, 'click', () => {
          opts.onClick!(place, index);
        });
      }

      // Create info window for the marker
      const infoWindow = new window.naver.maps.InfoWindow({
        content: `
          <div class="p-2 bg-white rounded-md shadow-md max-w-xs">
            <h3 class="font-bold text-lg">${place.name}</h3>
            <p class="text-sm text-gray-600">${place.category || '카테고리 없음'}</p>
            ${place.address ? `<p class="text-xs mt-1">${place.address}</p>` : ''}
          </div>
        `,
        maxWidth: 300,
        backgroundColor: "white",
        borderColor: "#ddd",
        borderWidth: 1,
        disableAnchor: true,
        pixelOffset: new window.naver.maps.Point(0, -10)
      });

      // Add hover events for the marker
      window.naver.maps.Event.addListener(marker, 'mouseover', () => {
        infoWindow.open(map, marker);
      });

      window.naver.maps.Event.addListener(marker, 'mouseout', () => {
        infoWindow.close();
      });

      // Store references
      newMarkers.push(marker);
      infoWindows.current.push(infoWindow);
    });

    // Store all markers
    markers.current = [...markers.current, ...newMarkers];
    return newMarkers;
  }, [map]);

  // Pan to a location
  const panTo = useCallback((locationOrCoords: string | { lat: number, lng: number }) => {
    if (!map || !window.naver || !window.naver.maps) {
      console.warn("Map is not initialized yet");
      return;
    }

    let position;
    if (typeof locationOrCoords === 'string') {
      // Handle string location (not implemented)
      console.warn("String location not implemented yet");
      return;
    } else {
      // Handle coordinates
      position = new window.naver.maps.LatLng(locationOrCoords.lat, locationOrCoords.lng);
    }

    map.panTo(position, { duration: 500 });
  }, [map]);

  // Calculate routes between places
  const calculateRoutes = useCallback((places: Place[]) => {
    if (!map || places.length < 2) return;

    console.log("Calculating routes between places:", places.length);
    // Implementation depends on the routing service being used
    // This is a placeholder for the actual implementation
  }, [map]);

  // Clear all routes
  const clearAllRoutes = useCallback(() => {
    if (window.geoJsonLayer) {
      window.geoJsonLayer.clearDisplayedFeatures();
    }
  }, []);

  // Handle GeoJSON data loaded
  const handleGeoJsonLoaded = useCallback((nodes: any[], links: any[]) => {
    console.log(`GeoJSON data loaded: ${nodes.length} nodes, ${links.length} links`);
    setGeoJsonNodes(nodes);
    setGeoJsonLinks(links);
    setIsGeoJsonLoaded(true);
  }, []);

  // Check GeoJSON mapping quality
  const checkGeoJsonMapping = useCallback((places: Place[]) => {
    if (!isGeoJsonLoaded || geoJsonNodes.length === 0) {
      return {
        totalPlaces: places.length,
        mappedPlaces: 0,
        mappingRate: '0%',
        averageDistance: 'N/A',
        success: false,
        message: 'GeoJSON 데이터가 로드되지 않았습니다'
      };
    }

    const mappedPlaces = places.filter(p => p.geoNodeId).length;
    const mappingRate = (mappedPlaces / places.length) * 100;
    
    // Calculate average distance for mapped places
    let totalDistance = 0;
    let distanceCount = 0;
    
    places.forEach(place => {
      if (place.geoNodeDistance !== undefined) {
        totalDistance += place.geoNodeDistance;
        distanceCount++;
      }
    });
    
    const averageDistance = distanceCount > 0 ? totalDistance / distanceCount : 0;
    
    return {
      totalPlaces: places.length,
      mappedPlaces,
      mappingRate: `${mappingRate.toFixed(1)}%`,
      averageDistance: averageDistance.toFixed(1),
      success: mappingRate >= 70,
      message: mappingRate >= 70 
        ? '매핑 성공' 
        : '매핑 부족'
    };
  }, [isGeoJsonLoaded, geoJsonNodes]);

  // Map places with GeoJSON nodes
  const mapPlacesWithGeoNodes = useCallback((places: Place[]) => {
    if (!isGeoJsonLoaded || geoJsonNodes.length === 0) {
      return places;
    }

    return places.map(place => {
      if (place.geoNodeId) {
        return place; // Already mapped
      }

      // Find the closest node
      let closestNode = null;
      let minDistance = Infinity;

      if (place.x && place.y) {
        geoJsonNodes.forEach(node => {
          if (node.coordinates && node.coordinates.length === 2) {
            const [nodeLng, nodeLat] = node.coordinates;
            
            // Calculate distance using Haversine formula
            const dx = (nodeLng - place.x!) * Math.cos((nodeLat + place.y!) / 2);
            const dy = nodeLat - place.y!;
            const distance = Math.sqrt(dx * dx + dy * dy) * 111000; // Approximate meters
            
            if (distance < minDistance) {
              minDistance = distance;
              closestNode = node;
            }
          }
        });
      }

      if (closestNode && minDistance < 1000) { // Within 1km
        return {
          ...place,
          geoNodeId: closestNode.id,
          geoNodeDistance: minDistance
        };
      }

      return place;
    });
  }, [isGeoJsonLoaded, geoJsonNodes]);

  // Render itinerary route
  const renderItineraryRoute = useCallback((itineraryDay: ItineraryDay | null) => {
    if (!window.geoJsonLayer || !itineraryDay) {
      return;
    }

    // Clear previous routes
    window.geoJsonLayer.clearDisplayedFeatures();

    // Check if we have route data
    const routeNodeIds = itineraryDay.routeNodeIds || itineraryDay.routeData;
    if (!routeNodeIds || routeNodeIds.length === 0) {
      console.warn("No route data available for this day");
      return;
    }

    // Extract node and link IDs
    const nodeIds = routeNodeIds.filter((_, i) => i % 2 === 0);
    const linkIds = routeNodeIds.filter((_, i) => i % 2 === 1);

    // Render the route
    window.geoJsonLayer.renderRoute(nodeIds, linkIds, {
      strokeColor: '#228B22',
      strokeWeight: 5,
      strokeOpacity: 0.7,
      zIndex: 100
    });
  }, []);

  // Highlight a segment of the route
  const highlightSegment = useCallback((fromIndex: number, toIndex: number, itineraryDay?: ItineraryDay) => {
    if (!window.geoJsonLayer || !itineraryDay) {
      return;
    }

    // Clear previous highlighted path
    if (highlightedPath.current.length > 0) {
      highlightedPath.current.forEach(item => {
        if (item && typeof item.setMap === 'function') {
          item.setMap(null);
        }
      });
      highlightedPath.current = [];
    }

    // Get route data
    const routeNodeIds = itineraryDay.routeNodeIds || itineraryDay.routeData;
    if (!routeNodeIds || routeNodeIds.length === 0) {
      console.warn("No route data available for highlighting");
      return;
    }

    // Calculate segment indices
    const startIdx = fromIndex * 2;
    const endIdx = toIndex * 2;
    
    if (startIdx >= routeNodeIds.length || endIdx >= routeNodeIds.length) {
      console.warn("Invalid segment indices");
      return;
    }

    // Extract segment node and link IDs
    const segmentNodeIds = routeNodeIds.slice(startIdx, endIdx + 1).filter((_, i) => i % 2 === 0);
    const segmentLinkIds = routeNodeIds.slice(startIdx, endIdx + 1).filter((_, i) => i % 2 === 1);

    // Render the highlighted segment
    const highlightedFeatures = window.geoJsonLayer.renderRoute(segmentNodeIds, segmentLinkIds, {
      strokeColor: '#FF4500',
      strokeWeight: 7,
      strokeOpacity: 0.9,
      zIndex: 200
    });

    highlightedPath.current = highlightedFeatures;
  }, []);

  // Clear previous highlighted path
  const clearPreviousHighlightedPath = useCallback(() => {
    if (highlightedPath.current.length > 0) {
      highlightedPath.current.forEach(item => {
        if (item && typeof item.setMap === 'function') {
          item.setMap(null);
        }
      });
      highlightedPath.current = [];
    }
  }, []);

  // Show route for a specific place index
  const showRouteForPlaceIndex = useCallback((placeIndex: number, itineraryDay: ItineraryDay) => {
    if (!window.geoJsonLayer || !itineraryDay) {
      return;
    }

    const places = itineraryDay.places;
    if (!places || places.length <= placeIndex) {
      console.warn("Invalid place index");
      return;
    }

    // If this is the last place, there's no next segment
    if (placeIndex >= places.length - 1) {
      toast.info("마지막 장소입니다");
      return;
    }

    // Highlight the segment from this place to the next
    highlightSegment(placeIndex, placeIndex + 1, itineraryDay);
    
    toast.info(`${places[placeIndex].name}에서 ${places[placeIndex + 1].name}까지의 경로`);
  }, [highlightSegment]);

  // Render GeoJSON route
  const renderGeoJsonRoute = useCallback((nodeIds: string[], linkIds: string[], style?: any) => {
    if (!window.geoJsonLayer) {
      console.warn("GeoJSON layer is not available");
      return [];
    }
    return window.geoJsonLayer.renderRoute(nodeIds, linkIds, style);
  }, []);

  // Set server routes data
  const setServerRoutes = useCallback((dayRoutes: Record<number, ServerRouteResponse>) => {
    setServerRoutesData(dayRoutes);
  }, []);

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
    highlightSegment,
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
