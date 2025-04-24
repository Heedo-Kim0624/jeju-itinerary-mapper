
import { supabase } from "@/integrations/supabase/client";
import { Place } from "@/types/supabase";

export const fetchRestaurants = async (): Promise<Place[]> => {
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

    // Fetch restaurant ratings - using a direct query rather than RPC
    const { data: restaurantRatings, error: ratingsError } = await supabase
      .from("restaurant_rating")
      .select("*");

    if (ratingsError) {
      console.error("Error fetching restaurant ratings:", ratingsError);
      // Continue with null ratings if there's an error
    }

    // Combine the data
    const restaurants = restaurantInfo?.map((info: any) => {
      const link = restaurantLinks?.find((link: any) => link.ID === info.ID);
      const category = restaurantCategories?.find((category: any) => category.ID === info.ID);
      
      // Safely access ratings if available
      let rating = null;
      let reviewCount = null;
      if (restaurantRatings) {
        const ratingInfo = restaurantRatings.find((r: any) => r.ID === info.ID);
        if (ratingInfo) {
          rating = ratingInfo.rating;
          reviewCount = ratingInfo.visitor_review_count;
        }
      }

      // Handle category details using lowercase and safer access
      const categoryDetail = category ? 
        (category.categories_details !== undefined ? 
          category.categories_details : "") : "";

      return {
        id: `restaurant-${info.ID}`,
        name: info.Place_Name || "",
        address: info.Lot_Address || info.Road_Address || "",
        category: "restaurant",
        categoryDetail,
        x: info.Longitude || 0,
        y: info.Latitude || 0,
        naverLink: link?.link || "",
        instaLink: link?.instagram || "",
        rating,
        reviewCount,
        operatingHours: "",
      };
    });

    return restaurants || [];
  } catch (error) {
    console.error("Error fetching restaurants:", error);
    return [];
  }
};

export const fetchCafes = async (): Promise<Place[]> => {
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

    // Fetch cafe categories - using correct table name
    const { data: cafeCategories, error: categoriesError } = await supabase
      .from("cafe_categories")
      .select("*");

    if (categoriesError) throw categoriesError;

    // Fetch cafe ratings
    const { data: cafeRatings, error: ratingsError } = await supabase
      .from("cafe_rating")
      .select("*");

    if (ratingsError) {
      console.error("Error fetching cafe ratings:", ratingsError);
      // Continue with null ratings if there's an error
    }

    // Combine the data
    const cafes = cafeInfo?.map((info: any) => {
      const link = cafeLinks?.find((link: any) => link.id === info.id);
      // Access the categories correctly, handling potential field name differences
      const category = cafeCategories?.find((cat: any) => cat.id === info.id);
      
      // Safely access ratings if available
      let rating = null;
      let reviewCount = null;
      if (cafeRatings) {
        const ratingInfo = cafeRatings.find((r: any) => r.id === info.id);
        if (ratingInfo) {
          rating = ratingInfo.rating;
          reviewCount = ratingInfo.visitor_review_count;
        }
      }

      // Handle category details using lowercase and safer access
      const categoryDetail = category ? 
        (category.categories_details !== undefined ? 
          category.categories_details : "") : "";

      return {
        id: `cafe-${info.id}`,
        name: info.Place_Name || "",
        address: info.Lot_Address || info.Road_Address || "",
        category: "cafe",
        categoryDetail,
        x: info.Longitude || 0,
        y: info.Latitude || 0,
        naverLink: link?.link || "",
        instaLink: link?.instagram || "",
        rating,
        reviewCount,
        operatingHours: "",
      };
    });

    return cafes || [];
  } catch (error) {
    console.error("Error fetching cafes:", error);
    return [];
  }
};

export const fetchAccommodations = async (): Promise<Place[]> => {
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

    // Fetch accommodation ratings
    const { data: accomRatings, error: ratingsError } = await supabase
      .from("accomodation_rating")
      .select("*");

    if (ratingsError) {
      console.error("Error fetching accommodation ratings:", ratingsError);
      // Continue with null ratings if there's an error
    }

    // Combine the data - handle different field names
    const accommodations = accomInfo?.map((info: any) => {
      const link = accomLinks?.find((link: any) => link.ID === info.ID);
      
      const category = accomCategories?.find((category: any) => category.id === info.ID);
      
      // Safely access ratings if available
      let rating = null;
      let reviewCount = null;
      if (accomRatings) {
        const ratingInfo = accomRatings.find((r: any) => r.id === info.ID);
        if (ratingInfo) {
          rating = ratingInfo.rating;
          reviewCount = ratingInfo.visitor_review_count;
        }
      }

      // Handle category details using lowercase and safer access
      const categoryDetail = category ? 
        (category.categories_details !== undefined ? 
          category.categories_details : "") : "";

      return {
        id: `accommodation-${info.ID}`,
        name: info.Place_name || "",
        address: info.Lot_Address || info.Road_address || "",
        category: "accommodation",
        categoryDetail,
        x: info.Longitude || 0,
        y: info.Latitude || 0,
        naverLink: link?.link || "",
        instaLink: link?.instagram || "",
        rating,
        reviewCount,
        operatingHours: "",
      };
    });

    return accommodations || [];
  } catch (error) {
    console.error("Error fetching accommodations:", error);
    return [];
  }
};

export const fetchLandmarks = async (): Promise<Place[]> => {
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

    // Fetch landmark ratings
    const { data: landmarkRatings, error: ratingsError } = await supabase
      .from("landmark_rating")
      .select("*");

    if (ratingsError) {
      console.error("Error fetching landmark ratings:", ratingsError);
      // Continue with null ratings if there's an error
    }

    // Combine the data - handling different field names
    const landmarks = landmarkInfo?.map((info: any) => {
      const link = landmarkLinks?.find((link: any) => link.id === info.id);
      
      const category = landmarkCategories?.find((category: any) => category.id === info.id);
      
      // Safely access ratings if available
      let rating = null;
      let reviewCount = null;
      if (landmarkRatings) {
        const ratingInfo = landmarkRatings.find((r: any) => r.id === info.id);
        if (ratingInfo) {
          rating = ratingInfo.rating;
          reviewCount = ratingInfo.visitor_review_count;
        }
      }

      // Handle category details using lowercase and safer access
      const categoryDetail = category ? 
        (category.categories_details !== undefined ? 
          category.categories_details : "") : "";

      return {
        id: `landmark-${info.id}`,
        name: info.Place_Name || "",
        address: info.Lot_Address || info.Road_Address || "",
        category: "attraction",
        categoryDetail,
        x: info.Longitude || 0,
        y: info.Latitude || 0,
        naverLink: link?.link || "",
        instaLink: link?.instagram || "",
        rating,
        reviewCount,
        operatingHours: "",
      };
    });

    return landmarks || [];
  } catch (error) {
    console.error("Error fetching landmarks:", error);
    return [];
  }
};

// Utility function to fetch all place data by category
export const fetchPlacesByCategory = async (category: string): Promise<Place[]> => {
  switch(category) {
    case "restaurant":
      return fetchRestaurants();
    case "cafe":
      return fetchCafes();
    case "attraction":
      return fetchLandmarks();
    case "accommodation":
      return fetchAccommodations();
    default:
      return [];
  }
};
