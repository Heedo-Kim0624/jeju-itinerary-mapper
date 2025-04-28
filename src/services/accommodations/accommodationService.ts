
import { Place } from "@/types/supabase";
import { fetchCategoryData } from "../utils/supabaseUtils";

export async function fetchAccommodations(): Promise<Place[]> {
  try {
    const { places, links, categories, ratings, reviews } = await fetchCategoryData(
      "accomodation_information",
      "accomodation_link",
      "accomodation_categories",
      "accomodation_rating",
      "accomodation_review"
    );

    console.log("원본 숙소 데이터:", places.length);
    console.log("원본 링크 데이터:", links?.length);
    console.log("원본 리뷰 데이터:", reviews?.length);

    return places.map((info: any) => {
      // ID 필드 처리 - 대소문자 구분 없이 찾기
      const placeId = info.id || info.ID || info.Id;
      
      // 링크 데이터 처리 - 디버깅을 위한 로그 추가
      let linkData = null;
      if (links && links.length > 0) {
        linkData = links.find((link: any) => {
          const linkId = link.id || link.ID || link.Id;
          return String(linkId) === String(placeId);
        });
        
        if (!linkData && placeId) {
          console.log(`숙소 ID ${placeId}에 대한 링크 데이터를 찾지 못했습니다.`);
        }
      }
      
      // 카테고리 처리
      const category = categories?.find((category: any) => {
        const categoryId = category.id || category.ID || category.Id;
        return String(categoryId) === String(placeId);
      });
      
      // 평점 및 리뷰 수 처리
      let rating = null;
      let reviewCount = null;
      if (ratings) {
        const ratingInfo = ratings.find((r: any) => {
          const ratingId = r.id || r.ID || r.Id;
          return String(ratingId) === String(placeId);
        });
        if (ratingInfo) {
          rating = ratingInfo.rating;
          reviewCount = ratingInfo.visitor_review_count;
        }
      }

      // 가중치(추천 점수) 계산
      let weight = 0;
      if (reviews) {
        const reviewInfo = reviews.find((r: any) => {
          const reviewId = r.id || r.ID || r.Id;
          return String(reviewId) === String(placeId);
        });
        
        if (reviewInfo) {
          // visitor_norm 필드가 존재하면 해당 값을 가중치로 사용
          if (reviewInfo.visitor_norm !== undefined) {
            weight = parseFloat(reviewInfo.visitor_norm);
          } else if (reviewInfo.Visitor_Norm !== undefined) {
            weight = parseFloat(reviewInfo.Visitor_Norm);
          }
          
          // 가중치 로깅
          console.log(`숙소 ${info.Place_Name || info.place_name} 가중치:`, weight);
        } else {
          console.log(`숙소 ID ${placeId}에 대한 리뷰 데이터를 찾지 못했습니다.`);
        }
      }

      // 카테고리 정보 추출
      const categoryDetail = category ? 
        (category.categories_details !== undefined ? 
          category.categories_details : "") : "";

      // 링크 처리 - 로그 추가 및 대소문자 구분 없이 필드 접근
      let naverLink = "";
      let instaLink = "";
      
      if (linkData) {
        // 대소문자 구분 없이 필드 찾기
        for (const key in linkData) {
          if (key.toLowerCase() === "link") {
            naverLink = linkData[key] || "";
          }
          if (key.toLowerCase() === "instagram") {
            instaLink = linkData[key] || "";
          }
        }
        
        console.log(`숙소 ${info.Place_Name || info.place_name} 링크:`, { 네이버: naverLink, 인스타그램: instaLink });
      }

      // 장소 객체 생성 및 반환
      return {
        id: `accommodation-${placeId}`,
        name: info.Place_Name || info.place_name || "",
        address: info.Lot_Address || info.Road_Address || info.lot_address || info.road_address || "",
        category: "accommodation",
        categoryDetail,
        x: info.longitude || info.Longitude || 0,
        y: info.latitude || info.Latitude || 0,
        naverLink,
        instaLink,
        rating,
        reviewCount,
        operatingHours: "",
        weight, // 가중치 설정
      };
    });
  } catch (error) {
    console.error("숙소 데이터 로딩 오류:", error);
    return [];
  }
}
