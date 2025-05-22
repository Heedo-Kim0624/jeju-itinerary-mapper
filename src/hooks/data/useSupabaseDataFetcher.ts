
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

// 장소 정보 타입 정의
export interface PlaceInformation {
  id: string | number;
  place_name: string;
  road_address: string;
  address?: string;
  latitude: number;
  longitude: number;
}

// 카테고리 정보 타입 정의
export interface PlaceCategory {
  id: string | number;
  categories_details: string;
}

// 링크 정보 타입 정의
export interface PlaceLink {
  id: string | number;
  link: string;
  instagram: string;
}

// 통합 장소 데이터 타입 정의
export interface PlaceData {
  id: string | number;
  place_name: string;
  road_address: string;
  address?: string;
  latitude: number;
  longitude: number;
  categories_details: string;
  link: string;
  instagram: string;
  phone?: string;
  rating?: number;
  image_url?: string;
}

// 카테고리별 장소 데이터 타입 정의
export interface CategoryPlaceData {
  accommodation: Record<string, PlaceData>;
  cafe: Record<string, PlaceData>;
  landmark: Record<string, PlaceData>;
  restaurant: Record<string, PlaceData>;
}

export const useSupabaseDataFetcher = () => {
  const [placeData, setPlaceData] = useState<CategoryPlaceData>({
    accommodation: {},
    cafe: {},
    landmark: {},
    restaurant: {}
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // 특정 카테고리의 장소 정보 가져오기
  const fetchPlaceInformation = useCallback(async (category: string) => {
    try {
      const { data, error } = await supabase
        .from(`${category}_information`)
        .select('id, place_name, road_address, address, latitude, longitude, phone');

      if (error) throw error;
      return data as (PlaceInformation & { phone?: string })[];
    } catch (err) {
      console.error(`Error fetching ${category} information:`, err);
      return [];
    }
  }, []);

  // 특정 카테고리의 카테고리 정보 가져오기
  const fetchPlaceCategories = useCallback(async (category: string) => {
    try {
      const { data, error } = await supabase
        .from(`${category}_categories`)
        .select('id, categories_details');

      if (error) throw error;
      return data as PlaceCategory[];
    } catch (err) {
      console.error(`Error fetching ${category} categories:`, err);
      return [];
    }
  }, []);

  // 특정 카테고리의 링크 정보 가져오기
  const fetchPlaceLinks = useCallback(async (category: string) => {
    try {
      const { data, error } = await supabase
        .from(`${category}_link`)
        .select('id, link, instagram');

      if (error) throw error;
      return data as PlaceLink[];
    } catch (err) {
      console.error(`Error fetching ${category} links:`, err);
      return [];
    }
  }, []);

  // 특정 카테고리의 평점 정보 가져오기
  const fetchPlaceRatings = useCallback(async (category: string) => {
    try {
      const { data, error } = await supabase
        .from(`${category}_rating`)
        .select('id, rating, visitor_review_count');

      if (error) throw error;
      return data as { id: string | number; rating: number; visitor_review_count?: number }[];
    } catch (err) {
      console.error(`Error fetching ${category} ratings:`, err);
      return [];
    }
  }, []);

  // 모든 카테고리의 데이터 가져오기 및 통합
  const fetchAllCategoryData = useCallback(async () => {
    if (isInitialized && Object.values(placeData).some(data => Object.keys(data).length > 0)) {
      console.log('[useSupabaseDataFetcher] Data already fetched, skipping redundant fetch');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const categories = ['accommodation', 'cafe', 'landmark', 'restaurant'];
      const newPlaceData: CategoryPlaceData = {
        accommodation: {},
        cafe: {},
        landmark: {},
        restaurant: {}
      };

      for (const category of categories) {
        console.log(`[useSupabaseDataFetcher] Fetching ${category} data...`);
        
        // 1. 장소 정보 가져오기
        const informationData = await fetchPlaceInformation(category);
        console.log(`[useSupabaseDataFetcher] ${category} information fetched: ${informationData.length} records`);
        
        // 2. 카테고리 정보 가져오기
        const categoriesData = await fetchPlaceCategories(category);
        const categoriesMap = categoriesData.reduce((acc, item) => {
          acc[String(item.id)] = item.categories_details;
          return acc;
        }, {} as Record<string, string>);
        console.log(`[useSupabaseDataFetcher] ${category} categories fetched: ${categoriesData.length} records`);
        
        // 3. 링크 정보 가져오기
        const linksData = await fetchPlaceLinks(category);
        const linksMap = linksData.reduce((acc, item) => {
          acc[String(item.id)] = { link: item.link, instagram: item.instagram };
          return acc;
        }, {} as Record<string, { link: string, instagram: string }>);
        console.log(`[useSupabaseDataFetcher] ${category} links fetched: ${linksData.length} records`);

        // 4. 평점 정보 가져오기
        const ratingsData = await fetchPlaceRatings(category);
        const ratingsMap = ratingsData.reduce((acc, item) => {
          acc[String(item.id)] = { rating: item.rating };
          return acc;
        }, {} as Record<string, { rating: number }>);
        console.log(`[useSupabaseDataFetcher] ${category} ratings fetched: ${ratingsData.length} records`);

        // 5. 데이터 통합
        for (const info of informationData) {
          const stringId = String(info.id);
          newPlaceData[category as keyof CategoryPlaceData][stringId] = {
            id: info.id,
            place_name: info.place_name || '',
            road_address: info.road_address || '',
            address: info.address || info.road_address || '',
            latitude: info.latitude || 0,
            longitude: info.longitude || 0,
            categories_details: categoriesMap[stringId] || '',
            link: linksMap[stringId]?.link || '',
            instagram: linksMap[stringId]?.instagram || '',
            phone: info.phone || '',
            rating: ratingsMap[stringId]?.rating || 0,
            image_url: '', // 이미지 데이터는 현재 가져오지 않음
          };
        }

        console.log(`[useSupabaseDataFetcher] ${category} data integrated: ${Object.keys(newPlaceData[category as keyof CategoryPlaceData]).length} places`);
      }

      setPlaceData(newPlaceData);
      setIsInitialized(true);
      console.log('[useSupabaseDataFetcher] All data fetched and integrated successfully');
      
      // 샘플 데이터 로그
      Object.entries(newPlaceData).forEach(([category, data]) => {
        const sampleKeys = Object.keys(data).slice(0, 2);
        if (sampleKeys.length > 0) {
          console.log(`[useSupabaseDataFetcher] ${category} sample:`, 
            sampleKeys.map(key => ({
              id: data[key].id,
              name: data[key].place_name,
              lat: data[key].latitude,
              lng: data[key].longitude
            }))
          );
        }
      });
      
    } catch (err) {
      console.error('[useSupabaseDataFetcher] Error fetching all category data:', err);
      setError('데이터를 가져오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [fetchPlaceInformation, fetchPlaceCategories, fetchPlaceLinks, fetchPlaceRatings, isInitialized, placeData]);

  // 컴포넌트 마운트 시 데이터 가져오기
  useEffect(() => {
    fetchAllCategoryData();
  }, [fetchAllCategoryData]);

  // 장소 ID로 데이터 조회
  const getPlaceDataById = useCallback((placeId: string | number, placeType: string): PlaceData | null => {
    const stringId = String(placeId);
    const normalizedType = placeType.toLowerCase();
    let category: keyof CategoryPlaceData;
    
    // 장소 유형에 따른 카테고리 매핑
    switch (normalizedType) {
      case 'accommodation':
      case '숙소':
        category = 'accommodation';
        break;
      case 'cafe':
      case '카페':
        category = 'cafe';
        break;
      case 'landmark':
      case '관광지':
      case 'attraction':
        category = 'landmark';
        break;
      case 'restaurant':
      case '음식점':
        category = 'restaurant';
        break;
      default:
        console.warn(`[useSupabaseDataFetcher] Unknown place type: ${placeType}, defaulting to landmark`);
        category = 'landmark';
    }

    const result = placeData[category][stringId];
    if (!result) {
      console.warn(`[useSupabaseDataFetcher] Place not found by ID: ${stringId} of type ${placeType}`);
    }
    return result || null;
  }, [placeData]);

  // 장소 이름으로 데이터 조회
  const getPlaceDataByName = useCallback((placeName: string, placeType: string): PlaceData | null => {
    if (!placeName) {
      console.warn('[useSupabaseDataFetcher] Empty place name provided');
      return null;
    }
    
    const normalizedType = placeType.toLowerCase();
    let category: keyof CategoryPlaceData;
    
    // 장소 유형에 따른 카테고리 매핑
    switch (normalizedType) {
      case 'accommodation':
      case '숙소':
        category = 'accommodation';
        break;
      case 'cafe':
      case '카페':
        category = 'cafe';
        break;
      case 'landmark':
      case '관광지':
      case 'attraction':
        category = 'landmark';
        break;
      case 'restaurant':
      case '음식점':
        category = 'restaurant';
        break;
      default:
        console.warn(`[useSupabaseDataFetcher] Unknown place type: ${placeType}, defaulting to landmark`);
        category = 'landmark';
    }

    // 이름으로 장소 찾기
    const places = placeData[category];
    for (const id in places) {
      if (places[id].place_name === placeName) {
        return places[id];
      }
    }

    // 정확히 일치하는 것이 없으면 부분 문자열 검색
    for (const id in places) {
      if (places[id].place_name.includes(placeName) || placeName.includes(places[id].place_name)) {
        console.log(`[useSupabaseDataFetcher] Found partial match: "${places[id].place_name}" for "${placeName}"`);
        return places[id];
      }
    }

    console.warn(`[useSupabaseDataFetcher] Place not found by name: "${placeName}" of type ${placeType}`);
    return null;
  }, [placeData]);

  return {
    placeData,
    isLoading,
    error,
    isInitialized,
    fetchAllCategoryData,
    getPlaceDataById,
    getPlaceDataByName
  };
};
