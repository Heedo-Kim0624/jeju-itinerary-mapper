
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

    // Fetch restaurant reviews - using restaurant_review_data instead of restaurant_review
    const { data: restaurantReviews, error: reviewsError } = await supabase
      .from("restaurant_review_data")  // Updated table name
      .select("id, Rating, visitor_review_count");

    if (reviewsError) {
      console.error("Error fetching restaurant reviews:", reviewsError);
      // Continue with null reviews if there's an error
    }

    // Combine the data
    const restaurants = restaurantInfo.map((info: RestaurantInformation) => {
      const link = restaurantLinks.find(
        (link: RestaurantLink) => link.id === info.id
      );
      const category = restaurantCategories.find(
        (category: RestaurantCategory) => category.id === info.id
      );
      
      // Safely access reviews if available
      let review = null;
      if (restaurantReviews) {
        review = restaurantReviews.find(
          (r: any) => r.id === info.id
        );
      }

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
    // Fetch accommodation information - updated table name
    const { data: accomInfo, error: infoError } = await supabase
      .from("accomodation_information_node")  // Updated table name
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

    if (reviewsError) {
      console.error("Error fetching accommodation reviews:", reviewsError);
      // Continue with null reviews if there's an error
    }

    // Combine the data - handle different field names
    const accommodations = accomInfo.map((info: any) => {
      const link = accomLinks.find(
        (link: AccommodationLink) => link.ID === info.id  // Adjust ID matching
      );
      
      const category = accomCategories.find(
        (category: AccommodationCategory) => category.id === info.id  // Adjust ID matching
      );
      
      // Safely access reviews if available
      let review = null;
      if (accomReviews) {
        review = accomReviews.find(
          (r: any) => r.id === info.id
        );
      }

      return {
        id: `accommodation-${info.id}`,
        name: info.Place_Name || "",  // Adjusted field names
        address: info.Road_Address || info.Lot_Address || "",  // Adjusted field names
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
    // Fetch landmark information - updated table name
    const { data: landmarkInfo, error: infoError } = await supabase
      .from("landmark_information_node")  // Updated table name
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

    // Combine the data - handling different field names
    const landmarks = landmarkInfo.map((info: any) => {
      const link = landmarkLinks.find(
        (link: LandmarkLink) => link.id === info.id
      );
      
      const category = landmarkCategories.find(
        (category: LandmarkCategory) => category.id === info.id
      );

      return {
        id: `landmark-${info.id}`,
        name: info.Place_Name || "",  // Adjusted field names
        address: info.Road_Address || info.Lot_Address || "",  // Adjusted field names
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
