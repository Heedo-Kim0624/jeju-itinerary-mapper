import { ItineraryDay } from '@/types/core';
import { MapContextGeoNode } from './coordinateTypes';

// Function to find coordinates from MapContext's GeoJSON nodes
export const findCoordinatesFromMapContextNodes = (
  nodeIdToFind: string | number,
  mapContextGeoNodes: MapContextGeoNode[] | null
): [number, number] | null => {
  if (!mapContextGeoNodes) return null;
  const nodeIdStr = String(nodeIdToFind);
  const foundNode = mapContextGeoNodes.find(node => String(node.id) === nodeIdStr);
  
  if (foundNode && foundNode.coordinates) {
    return foundNode.coordinates; // [longitude, latitude]
  }
  console.warn(`[findCoordinatesFromMapContextNodes] Coordinates not found for NODE_ID: ${nodeIdStr}`);
  return null;
};

/**
 * 경로에서 모든 노드 ID를 추출합니다.
 * @param route interleaved_route 배열
 * @returns 노드 ID 배열
 */
export const extractAllNodesFromRoute = (route: (string | number)[]): (string | number)[] => {
  const nodes: (string | number)[] = [];
  
  // 홀수 인덱스 또는 'N'으로 시작하는 ID를 노드로 간주
  route.forEach((id, index) => {
    const idStr = String(id);
    if (idStr.startsWith('N') || idStr.startsWith('n_') || index % 2 === 0) {
      nodes.push(id);
    }
  });
  
  return nodes;
};

/**
 * 경로에서 모든 링크 ID를 추출합니다.
 * @param route interleaved_route 배열
 * @returns 링크 ID 배열
 */
export const extractAllLinksFromRoute = (route: (string | number)[]): (string | number)[] => {
  const links: (string | number)[] = [];
  
  // 짝수 인덱스 또는 'L'으로 시작하는 ID를 링크로 간주
  route.forEach((id, index) => {
    const idStr = String(id);
    if (idStr.startsWith('L') || idStr.startsWith('l_') || index % 2 !== 0) {
      links.push(id);
    }
  });
  
  return links;
};

// Function to update itinerary places with coordinates
export const updateItineraryWithCoordinates = (
  itineraryDays: ItineraryDay[],
  mapContextGeoNodes: MapContextGeoNode[] | null
): ItineraryDay[] => {
  if (!mapContextGeoNodes || !itineraryDays.length) {
    if (!mapContextGeoNodes) console.warn("[updateItineraryWithCoordinates] mapContextGeoNodes is null or empty.");
    if (!itineraryDays.length) console.warn("[updateItineraryWithCoordinates] itineraryDays is empty.");
    return itineraryDays;
  }
  console.log("[updateItineraryWithCoordinates] Starting coordinate update. GeoNodes available:", mapContextGeoNodes.length > 0);

  return itineraryDays.map(day => {
    const updatedPlaces = day.places.map(place => {
      const coordinates = findCoordinatesFromMapContextNodes(place.id, mapContextGeoNodes);
      if (coordinates) {
        return {
          ...place,
          x: coordinates[0], // longitude
          y: coordinates[1], // latitude
          geoNodeId: String(place.id),
        };
      }
      return place;
    });
    return { ...day, places: updatedPlaces };
  });
};
