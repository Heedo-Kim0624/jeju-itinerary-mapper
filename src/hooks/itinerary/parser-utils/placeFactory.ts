
import { ItineraryPlaceWithTime } from '@/types/core';

/**
 * Checks if a place name corresponds to an airport.
 */
export const isAirport = (name: string): boolean => {
  const placeNameLower = name?.toLowerCase() || "";
  return placeNameLower.includes("제주국제공항") || placeNameLower.includes("제주공항");
};

/**
 * Creates an airport entry for the itinerary.
 */
export const createAirportEntry = (
  uniqueEntryId: string,
  timeBlock: string,
  arriveTime: string,
  departTime: string,
  stayDurationMinutes: number,
  numericId: number | null
): ItineraryPlaceWithTime => {
  return {
    id: uniqueEntryId,
    name: "제주국제공항",
    category: "교통",
    x: 126.4891647,
    y: 33.510418,
    address: "제주특별자치도 제주시 공항로 2",
    road_address: "제주특별자치도 제주시 공항로 2",
    phone: "064-797-2114",
    description: "제주도의 관문 국제공항",
    rating: 4.0,
    image_url: "",
    homepage: "https://www.airport.co.kr/jeju/",
    timeBlock: timeBlock,
    arriveTime: arriveTime,
    departTime: departTime,
    stayDuration: stayDurationMinutes,
    travelTimeToNext: "N/A",
    isFallback: false,
    numericDbId: numericId,
  };
};

/**
 * Creates a regular itinerary place entry.
 */
export const createItineraryPlace = (
  uniqueEntryId: string,
  item: any, // Contains details from getProcessedItemDetails
  timeBlock: string,
  arriveTime: string,
  departTime: string,
  stayDurationMinutes: number,
  numericId: number | null,
  geoNodeId?: string
): ItineraryPlaceWithTime => {
  return {
    id: uniqueEntryId,
    name: item.name,
    category: item.category,
    x: item.x,
    y: item.y,
    address: item.address,
    road_address: item.road_address,
    phone: item.phone,
    description: item.description,
    rating: item.rating,
    image_url: item.image_url,
    homepage: item.homepage,
    timeBlock: timeBlock,
    arriveTime: arriveTime,
    departTime: departTime,
    stayDuration: stayDurationMinutes,
    travelTimeToNext: "N/A", // Will be updated later
    isFallback: item.isFallback,
    geoNodeId: geoNodeId,
    numericDbId: numericId,
  };
};
