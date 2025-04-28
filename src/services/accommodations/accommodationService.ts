
import { Place } from "@/types/supabase";
import { fetchPlaceData, processPlaceData } from "../placeService";
import { TravelCategory } from "@/types/travel";

export async function fetchAccommodations(): Promise<Place[]> {
  try {
    // 숙소 데이터 조회
    const { places, ratings, categories, links, reviews } = await fetchPlaceData(
      "accommodation" as TravelCategory,
      []  // 위치 필터 없이 모든 숙소 조회
    );

    console.log(`Processing ${places.length} accommodations`);

    // 각 숙소에 대해 데이터 처리
    return places.map((info: any) => {
      // 관련 데이터 처리
      const processedData = processPlaceData(info, ratings, categories, links, reviews);
      
      // 장소 이름 및 주소 추출
      const placeName = info.Place_Name || info.place_name || "";
      const roadAddress = info.Road_Address || info.road_address || "";
      const lotAddress = info.Lot_Address || info.lot_address || "";
      
      // 좌표 추출
      const longitude = parseFloat(String(info.longitude || info.Longitude || 0));
      const latitude = parseFloat(String(info.latitude || info.Latitude || 0));
      
      // Place 객체 생성
      return {
        id: `accommodation-${info.id || info.ID}`,
        name: placeName,
        address: roadAddress || lotAddress || "",
        category: "accommodation",
        categoryDetail: processedData.categoryDetail,
        x: longitude,
        y: latitude,
        naverLink: processedData.naverLink,
        instaLink: processedData.instaLink,
        rating: processedData.rating,
        reviewCount: processedData.reviewCount,
        operatingHours: "",
        weight: processedData.weight,
      };
    });
  } catch (error) {
    console.error("Error fetching accommodations:", error);
    return [];
  }
}
