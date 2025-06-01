
import { fetchPlaceData, processPlaceData } from '../placeService';
import { Place } from '@/types/supabase';

export async function fetchLandmarks(locations: string[] = []): Promise<Place[]> {
  try {
    console.log(`[fetchLandmarks] 관광지 데이터 조회 시작 - 지역: ${locations.join(', ')}`);
    
    const { places, ratings, categories, links, reviews } = await fetchPlaceData('landmark', locations);
    
    if (!places || places.length === 0) {
      console.log('[fetchLandmarks] 조회된 관광지 데이터가 없습니다.');
      return [];
    }

    const processedPlaces = places.map((info: any) => {
      const { rating, reviewCount, categoryDetail, naverLink, instaLink, weight } = processPlaceData(
        info, ratings, categories, links, reviews
      );

      return {
        id: info.id,
        name: info.place_name || '',
        address: info.road_address || info.address || '',
        location: info.location || '', // location 필드 추가
        x: parseFloat(String(info.longitude || info.x || 0)),
        y: parseFloat(String(info.latitude || info.y || 0)),
        category: '관광지',
        categoryDetail,
        rating,
        reviewCount,
        naverLink,
        instaLink,
        weight,
        phone: info.phone || '',
        imageUrl: ''
      } as Place;
    });

    console.log(`[fetchLandmarks] 관광지 데이터 처리 완료: ${processedPlaces.length}개`);
    return processedPlaces;
  } catch (error) {
    console.error('[fetchLandmarks] 관광지 데이터 조회 중 오류:', error);
    return [];
  }
}
