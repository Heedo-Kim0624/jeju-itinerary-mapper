
import { Place, ItineraryPlaceWithTime } from '@/types/supabase';

export const useItineraryPlacer = () => {
  // 가장 가까운 장소 찾기
  const findNearestPlace = (currentPlace: Place, remainingPlaces: Place[]): Place | null => {
    if (!remainingPlaces || remainingPlaces.length === 0) return null;
    
    let nearestPlace = remainingPlaces[0];
    let minDistance = calculateDistance(currentPlace, nearestPlace);
    
    for (let i = 1; i < remainingPlaces.length; i++) {
      const distance = calculateDistance(currentPlace, remainingPlaces[i]);
      if (distance < minDistance) {
        minDistance = distance;
        nearestPlace = remainingPlaces[i];
      }
    }
    
    return nearestPlace;
  };

  // 두 장소 간의 거리 계산
  const calculateDistance = (p1: Place, p2: Place): number => {
    // 두 지점 간 직선 거리 계산 (Haversine formula)
    const R = 6371; // 지구 반경 (km)
    if (!p1?.x || !p1?.y || !p2?.x || !p2?.y) return 0;
    
    const dLat = (p2.y - p1.y) * Math.PI / 180;
    const dLon = (p2.x - p1.x) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(p1.y * Math.PI / 180) * Math.cos(p2.y * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // km 단위 거리
  };

  // 총 이동 거리 계산
  const calculateTotalDistance = (places: ItineraryPlaceWithTime[]): number => {
    if (places.length <= 1) return 0;
    
    let totalDistance = 0;
    for (let i = 0; i < places.length - 1; i++) {
      totalDistance += calculateDistance(places[i], places[i+1]);
    }
    
    return parseFloat(totalDistance.toFixed(2)); // 소수점 2자리까지
  };

  return {
    findNearestPlace,
    calculateDistance,
    calculateTotalDistance
  };
};
