
import { supabase } from "@/integrations/supabase/client";
import {
  RestaurantInformation,
  RestaurantLink,
  RestaurantCategory,
  RestaurantReview,
  AccommodationInformation,
  AccommodationLink,
  AccommodationCategory,
  AccommodationReview,
  LandmarkInformation,
  LandmarkLink,
  LandmarkCategory,
} from "@/types/supabase";

export const fetchRestaurants = async () => {
  try {
    // Fetch restaurant information
    const { data: restaurantInfo, error: infoError } = await supabase
      .from("restaurant_information")
      .select("*");

    if (infoError) throw infoError;

    // Fetch restaurant links
    const { data: restaurantLinks, error: linksError } = await supabase
      .from("restaurant_link")
      .select("*");

    if (linksError) throw linksError;

    // Fetch restaurant categories
    const { data: restaurantCategories, error: categoriesError } = await supabase
      .from("restaurant_categories")
      .select("*");

    if (categoriesError) throw categoriesError;

    // Fetch restaurant reviews
    const { data: restaurantReviews, error: reviewsError } = await supabase
      .from("restaurant_review")
      .select("id, Rating, visitor_review_count");

    if (reviewsError) throw reviewsError;

    // Combine the data
    const restaurants = restaurantInfo.map((info: RestaurantInformation) => {
      const link = restaurantLinks.find(
        (link: RestaurantLink) => link.id === info.id
      );
      const category = restaurantCategories.find(
        (category: RestaurantCategory) => category.id === info.id
      );
      const review = restaurantReviews.find(
        (review: RestaurantReview) => review.id === info.id
      );

      return {
        id: `restaurant-${info.id}`,
        name: info.Place_Name || "",
        address: info.Road_Address || info.Lot_Address || "",
        category: "restaurant",
        categoryDetail: category?.Categories_Details || "",
        x: info.Longitude || 0,
        y: info.Latitude || 0,
        naverLink: link?.link || "",
        instaLink: link?.instagram || "",
        rating: review?.Rating,
        reviewCount: review?.visitor_review_count,
      };
    });

    return restaurants;
  } catch (error) {
    console.error("Error fetching restaurants:", error);
    return [];
  }
};

export const fetchAccommodations = async () => {
  try {
    // Fetch accommodation information
    const { data: accomInfo, error: infoError } = await supabase
      .from("accomodation_information")
      .select("*");

    if (infoError) throw infoError;

    // Fetch accommodation links
    const { data: accomLinks, error: linksError } = await supabase
      .from("accomodation_link")
      .select("*");

    if (linksError) throw linksError;

    // Fetch accommodation categories
    const { data: accomCategories, error: categoriesError } = await supabase
      .from("accomodation_categories")
      .select("*");

    if (categoriesError) throw categoriesError;

    // Fetch accommodation reviews
    const { data: accomReviews, error: reviewsError } = await supabase
      .from("accomodation_review")
      .select("id, Rating, visitor_review_count");

    if (reviewsError) throw reviewsError;

    // Combine the data
    const accommodations = accomInfo.map((info: AccommodationInformation) => {
      const link = accomLinks.find(
        (link: AccommodationLink) => link.ID === info.ID
      );
      const category = accomCategories.find(
        (category: AccommodationCategory) => category.id === info.ID
      );
      const review = accomReviews.find(
        (review: AccommodationReview) => review.id === info.ID
      );

      return {
        id: `accommodation-${info.ID}`,
        name: info.Place_name || "",
        address: info.Road_address || info.Lot_Address || "",
        category: "accommodation",
        categoryDetail: category?.Categories_Details || "",
        x: info.Longitude || 0,
        y: info.Latitude || 0,
        naverLink: link?.link || "",
        instaLink: link?.instagram || "",
        rating: review?.Rating,
        reviewCount: review?.visitor_review_count,
      };
    });

    return accommodations;
  } catch (error) {
    console.error("Error fetching accommodations:", error);
    return [];
  }
};

export const fetchLandmarks = async () => {
  try {
    // Fetch landmark information
    const { data: landmarkInfo, error: infoError } = await supabase
      .from("landmark_information")
      .select("*");

    if (infoError) throw infoError;

    // Fetch landmark links
    const { data: landmarkLinks, error: linksError } = await supabase
      .from("landmark_link")
      .select("*");

    if (linksError) throw linksError;

    // Fetch landmark categories
    const { data: landmarkCategories, error: categoriesError } = await supabase
      .from("landmark_categories")
      .select("*");

    if (categoriesError) throw categoriesError;

    // 테이블이 없을 가능성이 있으므로 리뷰 데이터는 건너뜁니다
    // IMPORTANT: 리뷰 테이블이 존재하지 않으므로 리뷰 데이터 없이 랜드마크 정보만 반환합니다
    
    // Combine the data
    const landmarks = landmarkInfo.map((info: LandmarkInformation) => {
      const link = landmarkLinks.find(
        (link: LandmarkLink) => link.id === info.id
      );
      const category = landmarkCategories.find(
        (category: LandmarkCategory) => category.id === info.id
      );

      return {
        id: `landmark-${info.id}`,
        name: info.Place_Name || "",
        address: info.Road_Address || info.Lot_Address || "",
        category: "attraction",
        categoryDetail: category?.Categories_Details || "",
        x: info.Longitude || 0,
        y: info.Latitude || 0,
        naverLink: link?.link || "",
        instaLink: link?.instagram || "",
        rating: null, // 리뷰 데이터 없음
        reviewCount: null,
      };
    });

    return landmarks;
  } catch (error) {
    console.error("Error fetching landmarks:", error);
    return [];
  }
};
