
import { supabase } from "@/integrations/supabase/client";
import {
  RestaurantInformation,
  RestaurantLink,
  RestaurantCategory,
  AccommodationInformation,
  AccommodationLink,
  AccommodationCategory,
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

    // Fetch restaurant ratings - using rpc call to avoid table naming issues
    const { data: restaurantRatings, error: ratingsError } = await supabase
      .rpc('get_restaurant_ratings');

    if (ratingsError) {
      console.error("Error fetching restaurant ratings:", ratingsError);
      // Continue with null ratings if there's an error
    }

    // Combine the data
    const restaurants = restaurantInfo.map((info: any) => {
      const link = restaurantLinks.find(
        (link: RestaurantLink) => link.id === info.id
      );
      const category = restaurantCategories.find(
        (category: RestaurantCategory) => category.id === info.id
      );
      
      // Safely access ratings if available
      let rating = null;
      let reviewCount = null;
      if (restaurantRatings) {
        const ratingInfo = restaurantRatings.find(
          (r: any) => r.id === info.id
        );
        if (ratingInfo) {
          rating = ratingInfo.rating;
          reviewCount = ratingInfo.visitor_review_count;
        }
      }

      return {
        id: `restaurant-${info.id}`,
        name: info.place_name || "",
        address: info.lot_address || info.road_address || "",
        category: "restaurant",
        categoryDetail: category?.Categories_Details || "",
        x: info.longitude || 0,
        y: info.latitude || 0,
        naverLink: link?.link || "",
        instaLink: link?.instagram || "",
        rating: rating,
        reviewCount: reviewCount,
        operatingHours: "",
      };
    });

    return restaurants;
  } catch (error) {
    console.error("Error fetching restaurants:", error);
    return [];
  }
};

export const fetchCafes = async () => {
  try {
    // Fetch cafe information
    const { data: cafeInfo, error: infoError } = await supabase
      .from("cafe_information")
      .select("*");

    if (infoError) throw infoError;

    // Fetch cafe links
    const { data: cafeLinks, error: linksError } = await supabase
      .from("cafe_link")
      .select("*");

    if (linksError) throw linksError;

    // Fetch cafe categories
    const { data: cafeCategories, error: categoriesError } = await supabase
      .from("cafe_categories")
      .select("*");

    if (categoriesError) throw categoriesError;

    // Fetch cafe ratings - using rpc call to avoid table naming issues
    const { data: cafeRatings, error: ratingsError } = await supabase
      .rpc('get_cafe_ratings');

    if (ratingsError) {
      console.error("Error fetching cafe ratings:", ratingsError);
      // Continue with null ratings if there's an error
    }

    // Combine the data
    const cafes = cafeInfo.map((info: any) => {
      const link = cafeLinks.find(
        (link: any) => link.id === info.id
      );
      const category = cafeCategories.find(
        (category: any) => category.id === info.id
      );
      
      // Safely access ratings if available
      let rating = null;
      let reviewCount = null;
      if (cafeRatings) {
        const ratingInfo = cafeRatings.find(
          (r: any) => r.id === info.id
        );
        if (ratingInfo) {
          rating = ratingInfo.rating;
          reviewCount = ratingInfo.visitor_review_count;
        }
      }

      return {
        id: `cafe-${info.id}`,
        name: info.place_name || "",
        address: info.lot_address || info.road_address || "",
        category: "cafe",
        categoryDetail: category?.categories_details || "",
        x: info.longitude || 0,
        y: info.latitude || 0,
        naverLink: link?.link || "",
        instaLink: link?.instagram || "",
        rating: rating,
        reviewCount: reviewCount,
        operatingHours: "",
      };
    });

    return cafes;
  } catch (error) {
    console.error("Error fetching cafes:", error);
    return [];
  }
};

export const fetchAccommodations = async () => {
  try {
    // Fetch accommodation information - updated table name
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

    // Fetch accommodation ratings - using rpc call to avoid table naming issues
    const { data: accomRatings, error: ratingsError } = await supabase
      .rpc('get_accommodation_ratings');

    if (ratingsError) {
      console.error("Error fetching accommodation ratings:", ratingsError);
      // Continue with null ratings if there's an error
    }

    // Combine the data - handle different field names
    const accommodations = accomInfo.map((info: any) => {
      const link = accomLinks.find(
        (link: AccommodationLink) => link.ID === info.id  // Adjust ID matching
      );
      
      const category = accomCategories.find(
        (category: AccommodationCategory) => category.id === info.id  // Adjust ID matching
      );
      
      // Safely access ratings if available
      let rating = null;
      let reviewCount = null;
      if (accomRatings) {
        const ratingInfo = accomRatings.find(
          (r: any) => r.id === info.id
        );
        if (ratingInfo) {
          rating = ratingInfo.rating;
          reviewCount = ratingInfo.visitor_review_count;
        }
      }

      return {
        id: `accommodation-${info.id}`,
        name: info.place_name || "",  // Adjusted field names
        address: info.lot_address || info.road_address || "",  // Adjusted field names
        category: "accommodation",
        categoryDetail: category?.Categories_Details || "",
        x: info.longitude || 0,
        y: info.latitude || 0,
        naverLink: link?.link || "",
        instaLink: link?.instagram || "",
        rating: rating,
        reviewCount: reviewCount,
        operatingHours: "",
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

    // Fetch landmark ratings - using rpc call to avoid table naming issues
    const { data: landmarkRatings, error: ratingsError } = await supabase
      .rpc('get_landmark_ratings');

    if (ratingsError) {
      console.error("Error fetching landmark ratings:", ratingsError);
      // Continue with null ratings if there's an error
    }

    // Combine the data - handling different field names
    const landmarks = landmarkInfo.map((info: any) => {
      const link = landmarkLinks.find(
        (link: LandmarkLink) => link.id === info.id
      );
      
      const category = landmarkCategories.find(
        (category: LandmarkCategory) => category.id === info.id
      );
      
      // Safely access ratings if available
      let rating = null;
      let reviewCount = null;
      if (landmarkRatings) {
        const ratingInfo = landmarkRatings.find(
          (r: any) => r.id === info.id
        );
        if (ratingInfo) {
          rating = ratingInfo.rating;
          reviewCount = ratingInfo.visitor_review_count;
        }
      }

      return {
        id: `landmark-${info.id}`,
        name: info.place_name || "",  // Adjusted field names
        address: info.lot_address || info.road_address || "",  // Adjusted field names
        category: "attraction",
        categoryDetail: category?.categories_details || "",
        x: info.longitude || 0,
        y: info.latitude || 0,
        naverLink: link?.link || "",
        instaLink: link?.instagram || "",
        rating: rating,
        reviewCount: reviewCount,
        operatingHours: "",
      };
    });

    return landmarks;
  } catch (error) {
    console.error("Error fetching landmarks:", error);
    return [];
  }
};
