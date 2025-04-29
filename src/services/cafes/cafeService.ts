
import { Place } from "@/types/supabase";
import { fetchPlaceData, processPlaceData } from "../placeService";
import { TravelCategory } from "@/types/travel";

export async function fetchCafes(): Promise<Place[]> {
  try {
    console.log("Fetching cafe data...");
    
    // 카페 데이터 조회
    const { places, ratings, categories, links, reviews } = await fetchPlaceData(
      "cafe" as TravelCategory,
      []  // 위치 필터 없이 모든 카페 조회
    );

    console.log(`Processing ${places.length} cafes with:`, {
      ratings: ratings.length, 
      categories: categories.length, 
      links: links.length, 
      reviews: reviews.length
    });

    // 각 카페에 대해 데이터 처리
    const results = places.map((info: any) => {
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
        id: typeof info.id === 'string' ? parseInt(info.id.replace(/[^0-9]/g, '')) : info.id,
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
        operatingHours: "", // 운영시간 아직 없음
        weight: processedData.weight,
        raw: {
          info,
          processedData, // 전체 원본 데이터 보관 (이게 raw에 들어가야 TypeScript Place 통과)
        }
      };
    });
    
    // 처리 결과 로깅
    if (results.length > 0) {
      console.log("Sample processed cafe:", {
        name: results[0].name,
        rating: results[0].rating,
        reviewCount: results[0].reviewCount,
        weight: results[0].weight
      });
    }
    
    return results;
  } catch (error) {
    console.error("Error fetching cafes:", error);
    return [];
  }
}
