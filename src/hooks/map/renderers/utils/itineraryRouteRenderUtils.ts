
import type { ItineraryDay, Place } from '@/types/core';
import type { GeoJsonNodeFeature } from '@/components/rightpanel/geojson/GeoJsonTypes';
import type { ServerRouteDataForDay } from '@/hooks/map/useServerRoutes';

type AddPolylineFn = (
  pathCoordinates: { lat: number; lng: number }[],
  color: string,
  weight?: number,
  opacity?: number,
  zIndex?: number
) => any | null;

type GetNodeByIdFn = (nodeId: string | number) => GeoJsonNodeFeature | undefined;
type GetLinkByIdFn = (linkId: string | number) => any; // GeoJSON Link Feature

const RENDER_UTIL_LOG_PREFIX = '[ItineraryRouteRenderUtils]';

function getAndValidateLinkCoordinates(
  linkId: string | number,
  getLinkById: GetLinkByIdFn
): { lat: number; lng: number }[] | null {
  const linkFeature = getLinkById(String(linkId));
  const linkCoordsRaw = linkFeature?.geometry?.coordinates;

  if (!linkCoordsRaw || !Array.isArray(linkCoordsRaw) || linkCoordsRaw.length < 2 || !linkCoordsRaw.every(c => Array.isArray(c) && c.length === 2)) {
    return null;
  }

  const pathCoords: ({ lat: number; lng: number } | null)[] = linkCoordsRaw.map((coordPair: any) => {
    const lng = coordPair?.[0];
    const lat = coordPair?.[1];
    if (typeof lat === 'number' && typeof lng === 'number' && isFinite(lat) && isFinite(lng)) {
      return { lat, lng };
    }
    console.warn(`${RENDER_UTIL_LOG_PREFIX} Malformed coordinate pair in link ${linkId}: ${JSON.stringify(coordPair)}`);
    return null;
  });

  const validPathCoords = pathCoords.filter(Boolean) as { lat: number; lng: number }[];
  
  if (validPathCoords.length === 0) {
      console.warn(`${RENDER_UTIL_LOG_PREFIX} Link ${linkId} resulted in no valid coordinates after filtering.`);
      return null;
  }
  return validPathCoords;
}

function generateFallbackPathForLink(
  currentLinkIndex: number,
  linkIds: (string | number)[],
  nodeIds: (string | number)[] | undefined,
  getNodeById: GetNodeByIdFn,
  addPolyline: AddPolylineFn
): { path: { lat: number; lng: number }[] | null; nextIndexOverride: number | null } {
  console.log(`${RENDER_UTIL_LOG_PREFIX} Attempting fallback for link at index ${currentLinkIndex}.`);
  if (currentLinkIndex < linkIds.length - 1 && nodeIds) {
    const nextValidLinkIndex = linkIds.findIndex((_, idx) => {
      if (idx <= currentLinkIndex) return false;
      // Check if the *next* link exists to determine if this fallback is between two known points
      const nextLinkFeat = window.geoJsonLayer?.getLinkById?.(String(linkIds[idx]));
      const nextCoords = nextLinkFeat?.geometry?.coordinates;
      return nextCoords && Array.isArray(nextCoords) && nextCoords.length > 0;
    });

    if (nextValidLinkIndex > -1) {
      const startNodeId = nodeIds[currentLinkIndex];
      const endNodeId = nodeIds[nextValidLinkIndex];

      if (startNodeId && endNodeId) {
        const startNode = getNodeById(startNodeId);
        const endNode = getNodeById(endNodeId);

        const startNodeCoordsRaw = startNode?.geometry?.coordinates;
        const endNodeCoordsRaw = endNode?.geometry?.coordinates;

        if (startNodeCoordsRaw && typeof startNodeCoordsRaw[0] === 'number' && typeof startNodeCoordsRaw[1] === 'number' &&
            endNodeCoordsRaw && typeof endNodeCoordsRaw[0] === 'number' && typeof endNodeCoordsRaw[1] === 'number') {
          try {
            const directPath = [
              { lat: startNodeCoordsRaw[1], lng: startNodeCoordsRaw[0] },
              { lat: endNodeCoordsRaw[1], lng: endNodeCoordsRaw[0] }
            ];
            addPolyline(directPath, '#FF9500', 4, 0.7, 10); // Fallback color
            console.log(`${RENDER_UTIL_LOG_PREFIX} Fallback path created between nodes ${startNodeId} and ${endNodeId}.`);
            return { path: directPath, nextIndexOverride: nextValidLinkIndex -1 };
          } catch (e) {
            console.error(`${RENDER_UTIL_LOG_PREFIX} Error creating fallback path:`, e);
          }
        } else {
          console.log(`${RENDER_UTIL_LOG_PREFIX} Fallback failed: Node coordinates for ${startNodeId} or ${endNodeId} not found or invalid.`);
        }
      }
    }
  }
  return { path: null, nextIndexOverride: null };
}

export function renderRouteFromGeoJsonLinks(
  itineraryDay: ItineraryDay,
  addPolyline: AddPolylineFn,
  getNodeById: GetNodeByIdFn,
  getLinkById: GetLinkByIdFn
): { lat: number; lng: number }[][] {
  const allPolylinePaths: { lat: number; lng: number }[][] = [];
  if (!itineraryDay.routeData?.linkIds || itineraryDay.routeData.linkIds.length === 0) {
    return allPolylinePaths;
  }

  const linkIds = itineraryDay.routeData.linkIds;
  const nodeIds = itineraryDay.routeData.nodeIds;
  console.log(`${RENDER_UTIL_LOG_PREFIX} Day ${itineraryDay.day}: Link ID based route calculation. Links: ${linkIds.length}`);

  let missingLinkCount = 0;
  let currentSegment: { coords: { lat: number; lng: number }[] } | undefined;

  for (let i = 0; i < linkIds.length; i++) {
    const linkId = linkIds[i];
    const pathCoords = getAndValidateLinkCoordinates(linkId, getLinkById);

    if (!pathCoords) {
      missingLinkCount++;
      console.log(`${RENDER_UTIL_LOG_PREFIX} Day ${itineraryDay.day}: GeoJSON Link ID '${linkId}' missing or invalid. Attempting fallback.`);
      const fallbackResult = generateFallbackPathForLink(i, linkIds, nodeIds, getNodeById, addPolyline);
      if (fallbackResult.path) {
        allPolylinePaths.push(fallbackResult.path);
      }
      if (fallbackResult.nextIndexOverride !== null) {
        i = fallbackResult.nextIndexOverride;
      }
      currentSegment = undefined; // Reset segment after fallback attempt
      continue;
    }

    if (!currentSegment) {
      currentSegment = { coords: [...pathCoords] };
    } else {
      if (pathCoords.length > 0) {
        const lastCurrentCoord = currentSegment.coords[currentSegment.coords.length - 1];
        const firstPathCoord = pathCoords[0];
        if (lastCurrentCoord && firstPathCoord && lastCurrentCoord.lat === firstPathCoord.lat && lastCurrentCoord.lng === firstPathCoord.lng) {
          currentSegment.coords.push(...pathCoords.slice(1));
        } else {
          currentSegment.coords.push(...pathCoords);
        }
      }
    }

    if (currentSegment.coords.length > 100 || i === linkIds.length - 1) {
      if (currentSegment.coords.length > 1) {
        addPolyline(currentSegment.coords, '#4285F4', 5, 0.8, 10);
        allPolylinePaths.push([...currentSegment.coords]); // Store a copy
      }
      currentSegment = undefined;
    }
  }

  if (missingLinkCount > 0) {
    console.log(`${RENDER_UTIL_LOG_PREFIX} Day ${itineraryDay.day}: Missing/Fallback links: ${missingLinkCount} of ${linkIds.length}`);
  }
  return allPolylinePaths;
}

export function renderRouteFromServerCache(
  itineraryDay: ItineraryDay,
  serverDayData: ServerRouteDataForDay,
  addPolyline: AddPolylineFn
): void {
  console.log(`${RENDER_UTIL_LOG_PREFIX} Day ${itineraryDay.day}: Using server cached route data. Segments: ${serverDayData.polylinePaths.length}`);
  serverDayData.polylinePaths.forEach(path => {
    if (Array.isArray(path) && path.every(p => typeof p.lat === 'number' && typeof p.lng === 'number')) {
      addPolyline(path, '#4285F4', 5, 0.8, 10);
    } else {
      console.warn(`${RENDER_UTIL_LOG_PREFIX} Invalid path format in serverData for day ${itineraryDay.day}`);
    }
  });
}

export function renderRouteFromDirectConnections(
  itineraryDay: ItineraryDay,
  addPolyline: AddPolylineFn
): { lat: number; lng: number }[][] {
  const allPolylinePathsFallback: { lat: number; lng: number }[][] = [];
  if (!itineraryDay.places || itineraryDay.places.length === 0) {
    return allPolylinePathsFallback;
  }
  
  console.log(`${RENDER_UTIL_LOG_PREFIX} Day ${itineraryDay.day}: Fallback: direct connections for ${itineraryDay.places.length} places.`);
  const places = itineraryDay.places;

  for (let i = 0; i < places.length - 1; i++) {
    const source = places[i];
    const target = places[i + 1];

    if (typeof source.x !== 'number' || typeof source.y !== 'number' ||
        typeof target.x !== 'number' || typeof target.y !== 'number' ||
        !isFinite(source.x) || !isFinite(source.y) || !isFinite(target.x) || !isFinite(target.y)) {
      console.warn(`${RENDER_UTIL_LOG_PREFIX} Invalid coordinates in Day ${itineraryDay.day} for places:`, source.name, target.name);
      continue;
    }

    const directPath = [
      { lat: source.y, lng: source.x },
      { lat: target.y, lng: target.x }
    ];
    addPolyline(directPath, '#FF9500', 4, 0.7, 5); // Fallback color
    allPolylinePathsFallback.push(directPath);
  }
  return allPolylinePathsFallback;
}
