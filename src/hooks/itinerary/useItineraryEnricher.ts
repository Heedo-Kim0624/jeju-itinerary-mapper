
import { useCallback } from 'react';
import { ItineraryDay, ItineraryPlaceWithTime } from '@/types/core';
import { useSupabaseDataFetcher } from '../data/useSupabaseDataFetcher';

export const useItineraryEnricher = () => {
  const { getPlaceDataById, getPlaceDataByName } = useSupabaseDataFetcher();

  // 일정 데이터 보강
  const enrichItineraryData = useCallback((itineraryDays: ItineraryDay[]): ItineraryDay[] => {
    console.log('[useItineraryEnricher] Enriching itinerary data for', itineraryDays.length, 'days');
    
    return itineraryDays.map(day => {
      // 각 장소에 대해 Supabase 데이터 매핑
      const enrichedPlaces = day.places.map(place => {
        // 먼저 ID로 조회 시도
        let placeData = null;
        if (place.numericDbId) {
          placeData = getPlaceDataById(place.numericDbId, place.category);
          if (placeData) {
            console.log(`[useItineraryEnricher] Found place by ID: ${place.numericDbId} (${place.name})`);
          }
        }
        
        // ID로 찾지 못한 경우 이름으로 조회
        if (!placeData) {
          placeData = getPlaceDataByName(place.name, place.category);
          if (placeData) {
            console.log(`[useItineraryEnricher] Found place by name: "${place.name}" (ID: ${placeData.id})`);
          }
        }
        
        if (placeData) {
          // Supabase 데이터로 장소 정보 보강
          return {
            ...place,
            x: placeData.longitude,
            y: placeData.latitude,
            address: placeData.address || placeData.road_address || '',
            road_address: placeData.road_address || placeData.address || '',
            description: placeData.categories_details || '',
            phone: placeData.phone || place.phone || '',
            rating: placeData.rating || place.rating || 0,
            image_url: place.image_url || '',
            homepage: placeData.link || place.homepage || '',
            isFallback: false,
            // numericDbId 업데이트 (ID로 찾은 경우 이미 설정됨)
            numericDbId: place.numericDbId || (typeof placeData.id === 'number' ? placeData.id : 
              (typeof placeData.id === 'string' ? parseInt(placeData.id, 10) || null : null))
          } as ItineraryPlaceWithTime;
        }
        
        // Supabase에서 데이터를 찾지 못한 경우 기존 데이터 유지
        console.warn(`[useItineraryEnricher] Place not found in Supabase: "${place.name}" (${place.category})`);
        return {
          ...place,
          isFallback: true
        };
      });

      // 보강된 장소 정보로 일정 데이터 업데이트
      return {
        ...day,
        places: enrichedPlaces
      };
    });
  }, [getPlaceDataById, getPlaceDataByName]);

  return {
    enrichItineraryData
  };
};
