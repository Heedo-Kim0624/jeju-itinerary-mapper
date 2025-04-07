
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
  LandmarkReview,
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

    // Fixed the error here - used "landmark_review" instead of "landmark_reviews"
    // Fetch landmark reviews (this table seems to be called "landmark_review" not "landmark_reviews")
    const { data: landmarkReviewsData, error: reviewsError } = await supabase
      .from("landmark_review") // Changed from "landmark_reviews" to "landmark_review"
      .select("id, Rating, visitor_review_count");

    if (reviewsError) {
      console.error("Error fetching landmark reviews:", reviewsError);
      // Proceed with empty reviews rather than throwing
      const landmarkReviews: LandmarkReview[] = [];
      
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
          rating: null, // No reviews available
          reviewCount: null,
        };
      });

      return landmarks;
    }

    // Process with reviews if they were found
    const landmarkReviews = landmarkReviewsData || [];

    // Combine the data
    const landmarks = landmarkInfo.map((info: LandmarkInformation) => {
      const link = landmarkLinks.find(
        (link: LandmarkLink) => link.id === info.id
      );
      const category = landmarkCategories.find(
        (category: LandmarkCategory) => category.id === info.id
      );
      
      // Safely find review using type guard
      const review = Array.isArray(landmarkReviews) 
        ? landmarkReviews.find((r: any) => r.id === info.id) 
        : null;

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
        rating: review?.Rating,
        reviewCount: review?.visitor_review_count,
      };
    });

    return landmarks;
  } catch (error) {
    console.error("Error fetching landmarks:", error);
    return [];
  }
};
