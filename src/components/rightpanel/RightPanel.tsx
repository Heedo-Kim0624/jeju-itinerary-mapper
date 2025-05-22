
import React, { useEffect, useRef } from 'react';
import MapContainer from './MapContainer';
// DaySelector import 제거
// import DaySelector from '@/components/map/DaySelector';
import { useMapItineraryVisualization } from '@/hooks/map/useMapItineraryVisualization';
import { useMapResize } from '@/hooks/useMapResize';
import type { Place, ItineraryDay } from '@/types/core';

interface RightPanelProps {
  places: Place[];
  selectedPlace: Place | null;
  itinerary: ItineraryDay[] | null;
  selectedDay: number | null;
}

const RightPanel: React.FC<RightPanelProps> = ({
  places,
  selectedPlace,
  itinerary,
  selectedDay,
}) => {
  const mapRef = useRef<naver.maps.Map | null>(null);
  const { initializeMap, addMarkers, clearMarkers, fitBoundsToMarkers, clearPolylines, drawPolyline } = useMapItineraryVisualization(mapRef);
  
  useMapResize(mapRef);

  useEffect(() => {
    if (!mapRef.current) {
      console.log("[RightPanel] Initializing map");
      initializeMap('map'); // map div ID
    }
  }, [initializeMap]);

  useEffect(() => {
    console.log("[RightPanel] Places or selectedPlace changed:", {
      placesCount: places?.length,
      selectedPlaceId: selectedPlace?.id,
    });
    clearMarkers();
    if (places && places.length > 0) {
      addMarkers(places, selectedPlace);
      if (!selectedPlace) { // Only fit to all markers if no specific place is selected
        fitBoundsToMarkers(places);
      }
    }
  }, [places, selectedPlace, clearMarkers, addMarkers, fitBoundsToMarkers]);
  
  useEffect(() => {
    console.log("[RightPanel] Itinerary or selectedDay changed:", {
      itineraryDays: itinerary?.length,
      selectedDay,
    });
    clearPolylines();
    if (itinerary && selectedDay !== null) {
      const currentDayData = itinerary.find(day => day.day === selectedDay);
      if (currentDayData && currentDayData.places.length > 0) {
        console.log("[RightPanel] Drawing polyline for selected day's places:", currentDayData.places.map(p => p.name));
        drawPolyline(currentDayData.places);
        addMarkers(currentDayData.places, null, true); // Add itinerary place markers
        fitBoundsToMarkers(currentDayData.places);
      } else {
        console.log("[RightPanel] No places to draw for selected day or currentDayData not found.");
      }
    }
  }, [itinerary, selectedDay, clearPolylines, drawPolyline, addMarkers, fitBoundsToMarkers]);

  console.log("[RightPanel] Rendering with props:", {
    placesCount: places?.length,
    selectedPlaceId: selectedPlace?.id,
    itineraryDays: itinerary?.length,
    selectedDay,
  });

  return (
    <div className="flex-1 h-full relative">
      <MapContainer mapId="map" />
      {/* DaySelector 컴포넌트 제거 */}
      {/* 
      {itinerary && itinerary.length > 0 && selectedDay !== null && (
        <DaySelector
          itinerary={itinerary}
          currentDay={selectedDay}
          onDaySelect={(dayItem) => {
            const event = new CustomEvent('selectItineraryDay', { detail: { dayNumber: dayItem.day } });
            window.dispatchEvent(event);
            console.log(`[Map DaySelector] Day ${dayItem.day} selected, event dispatched.`);
          }}
          totalDistance={itinerary.find(d => d.day === selectedDay)?.totalDistance || 0}
        />
      )}
      */}
    </div>
  );
};

export default RightPanel;
