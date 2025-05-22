
import type { Place } from '@/types/supabase';
import type { ItineraryPlaceWithTime } from '@/types/core';
import { createNaverLatLng } from './mapSetup'; // Assuming it's in the same directory level

// Helper function to create SVG string for a map pin
const createPinSvg = (
  color: string,
  size: number = 28, // Adjusted default size
  label?: string | number,
  innerCircleColor: string = 'white'
): string => {
  const strokeColor = "black"; // Outline for the pin shape itself for better visibility
  const strokeWeight = 0.5; // Thinner stroke for the pin outline
  
  // Scale down viewBox elements if using a fixed viewBox="0 0 24 24"
  const pathScaleFactor = size / 24;
  const scaledInnerRadius = 3 * pathScaleFactor; // Original inner circle radius is 3 in a 24x24 viewbox
  const scaledCx = 12 * pathScaleFactor;
  const scaledCy = 10 * pathScaleFactor;

  let labelContent = '';
  if (label) {
    const fontSize = size * 0.45; // Adjust font size based on pin size
    const textY = 10; // Y position in viewBox units
    const textX = 12; // X position in viewBox units

    labelContent = `<text x="${textX}" y="${textY}" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="${fontSize}" font-family="Arial, sans-serif" font-weight="bold">${label}</text>`;
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" style="overflow: visible;">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" fill="${color}" stroke="${strokeColor}" stroke-width="${strokeWeight}" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="12" cy="10" r="3" fill="${innerCircleColor}"/>
      ${labelContent}
    </svg>
  `;
};

export const getMarkerIconOptions = (
  place: Place | ItineraryPlaceWithTime,
  isSelected: boolean,
  isCandidate: boolean,
  isItineraryDayPlace: boolean,
  itineraryOrder?: number
): { content: string; anchor: { x: number; y: number }; size?: {width: number; height: number} } => {
  let pinColor = '#28A745'; // Default Green
  let pinSize = 28;
  let label: string | number | undefined = undefined;

  if (isItineraryDayPlace) {
    pinColor = (place as ItineraryPlaceWithTime).isFallback ? '#757575' : '#FF5A5F'; // Red for itinerary items, gray for fallback
    pinSize = 32; // Slightly larger for itinerary items
    label = itineraryOrder;
  } else if (isSelected) {
    pinColor = '#007BFF'; // Blue for selected
    pinSize = 32; // Larger for selected
  } else if (isCandidate) {
    pinColor = '#FFA500'; // Orange for candidate
  }

  return {
    content: createPinSvg(pinColor, pinSize, label),
    anchor: { x: pinSize / 2, y: pinSize },
    size: { width: pinSize, height: pinSize }
  };
};

export const createNaverMarker = (
  map: any,
  position: any, // naver.maps.LatLng
  iconConfig?: { url?: string; size?: { width: number; height: number }; anchor?: { x: number; y: number }; content?: string },
  title?: string,
  clickable: boolean = true,
  visible: boolean = true
) => {
  if (!window.naver || !window.naver.maps) {
    console.error("Naver Maps API not initialized when creating marker.");
    return null;
  }
  let iconObject: any = null;
  if (iconConfig) {
    if (iconConfig.url) {
      iconObject = {
        url: iconConfig.url,
        size: iconConfig.size ? new window.naver.maps.Size(iconConfig.size.width, iconConfig.size.height) : undefined,
        anchor: iconConfig.anchor ? new window.naver.maps.Point(iconConfig.anchor.x, iconConfig.anchor.y) : undefined,
        scaledSize: iconConfig.size ? new window.naver.maps.Size(iconConfig.size.width, iconConfig.size.height) : undefined,
      };
    } else if (iconConfig.content) {
      iconObject = {
        content: iconConfig.content,
        anchor: iconConfig.anchor ? new window.naver.maps.Point(iconConfig.anchor.x, iconConfig.anchor.y) : new window.naver.maps.Point(iconConfig.size?.width ? iconConfig.size.width/2 : 14, iconConfig.size?.height || 28), // Default anchor for content based on size
      };
    }
  }

  return new window.naver.maps.Marker({
    position: position,
    map: map,
    icon: iconObject,
    title: title,
    clickable: clickable,
    visible: visible,
  });
};

export const addMarkersToMap = (
  map: any,
  places: Place[],
  selectedPlace: Place | null,
  candidatePlaces: Place[] = [],
  // itineraryPlaces: Place[] = [], // This parameter seems unused in the original function
  onMarkerClick: (place: Place, index: number) => void
) => {
  const markers: any[] = [];
  if (!window.naver || !window.naver.maps) {
    console.error("Naver Maps API not available in addMarkersToMap");
    return markers;
  }
  places.forEach((place, index) => {
    if (place.y == null || place.x == null) { // Check for null or undefined
        console.warn(`[markerUtils] Place '${place.name}' is missing coordinates (y: ${place.y}, x: ${place.x}) and will be skipped.`);
        return;
    }
    const position = createNaverLatLng(place.y, place.x);
    if (!position) return;

    const isSelected = selectedPlace?.id === place.id;
    const isCandidate = candidatePlaces.some(cp => cp.id === place.id);
    
    const iconOptions = getMarkerIconOptions(place, isSelected, isCandidate, false, undefined);
    
    const marker = createNaverMarker(map, position, iconOptions, place.name);
    
    if (marker && window.naver.maps.Event) {
      window.naver.maps.Event.addListener(marker, 'click', () => {
        onMarkerClick(place, index);
      });
    }
    if (marker) markers.push(marker);
  });
  return markers;
};

