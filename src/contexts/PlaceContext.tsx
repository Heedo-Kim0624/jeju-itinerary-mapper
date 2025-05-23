
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { fetchAllPlacesData } from '@/services/placeDataLoader';
import type { DetailedPlace } from '@/types/detailedPlace';
import type { Place } from '@/types/core'; // Place 타입 임포트

interface PlaceContextType {
  allPlaces: Map<number, DetailedPlace>;
  allPlacesMapByName: Map<string, Place>; // 이름 기반 검색을 위한 맵 추가
  isLoadingPlaces: boolean;
  errorLoadingPlaces: Error | null;
  getPlaceById: (id: number) => DetailedPlace | undefined;
}

const PlaceContext = createContext<PlaceContextType | undefined>(undefined);

export const PlaceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [allPlaces, setAllPlaces] = useState<Map<number, DetailedPlace>>(new Map());
  const [allPlacesMapByName, setAllPlacesMapByName] = useState<Map<string, Place>>(new Map()); // 상태 추가
  const [isLoadingPlaces, setIsLoadingPlaces] = useState<boolean>(true);
  const [errorLoadingPlaces, setErrorLoadingPlaces] = useState<Error | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingPlaces(true);
        setErrorLoadingPlaces(null);
        console.log('[PlaceProvider] Initializing place data load...');
        const dataMap = await fetchAllPlacesData();
        setAllPlaces(dataMap);
        console.log(`[PlaceProvider] Place data loaded successfully. ${dataMap.size} places in store.`);

        // allPlacesMapByName 생성
        const nameMap = new Map<string, Place>();
        dataMap.forEach((detailedPlace) => {
          if (detailedPlace.name) {
            // DetailedPlace를 Place 타입으로 변환 (필요한 필드만 선택)
            const place: Place = {
              id: String(detailedPlace.id), // id를 string으로 명시적 변환 (수정된 부분)
              name: detailedPlace.name,
              address: detailedPlace.address,
              road_address: detailedPlace.road_address || '',
              phone: detailedPlace.phone || '',
              category: detailedPlace.category, // CategoryName은 string으로 할당 가능
              description: detailedPlace.description || '',
              x: detailedPlace.x,
              y: detailedPlace.y,
              image_url: detailedPlace.image_url || '',
              homepage: detailedPlace.homepage || '',
              rating: detailedPlace.rating || 0,
              geoNodeId: detailedPlace.geoNodeId ? String(detailedPlace.geoNodeId) : undefined, // geoNodeId도 string으로 변환
              naverLink: detailedPlace.link_url, // DetailedPlace의 link_url을 naverLink로 매핑
              instaLink: detailedPlace.instagram_url, // DetailedPlace의 instagram_url을 instaLink로 매핑
            };
            nameMap.set(detailedPlace.name, place);
          }
        });
        setAllPlacesMapByName(nameMap);
        console.log(`[PlaceProvider] Place name map created. ${nameMap.size} entries.`);

      } catch (error) {
        console.error('[PlaceProvider] Error loading all places data:', error);
        setErrorLoadingPlaces(error instanceof Error ? error : new Error('Failed to load places'));
      } finally {
        setIsLoadingPlaces(false);
      }
    };

    loadData();
  }, []);

  const getPlaceById = (id: number): DetailedPlace | undefined => {
    return allPlaces.get(id);
  };

  return (
    <PlaceContext.Provider value={{ allPlaces, allPlacesMapByName, isLoadingPlaces, errorLoadingPlaces, getPlaceById }}>
      {children}
    </PlaceContext.Provider>
  );
};

export const usePlaceContext = (): PlaceContextType => {
  const context = useContext(PlaceContext);
  if (context === undefined) {
    throw new Error('usePlaceContext must be used within a PlaceProvider');
  }
  return context;
};
