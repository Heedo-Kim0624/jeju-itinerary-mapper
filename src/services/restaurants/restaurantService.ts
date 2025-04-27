
import { Place } from "@/types/supabase";
import { fetchCategoryData } from "../utils/supabaseUtils";

export async function fetchRestaurants(): Promise<Place[]> {
  try {
    const { places, links, categories, ratings } = await fetchCategoryData(
      "restaurant_information",
      "restaurant_link",
      "restaurant_categories",
      "restaurant_rating"
    );

    return places.map((info: any) => {
      const link = links?.find((link: any) => link.id === info.id);
      const category = categories?.find((category: any) => category.id === info.id);
      
      let rating = null;
      let reviewCount = null;
      if (ratings) {
        const ratingInfo = ratings.find((r: any) => r.id === info.id);
        if (ratingInfo) {
          rating = ratingInfo.rating;
          reviewCount = ratingInfo.visitor_review_count;
        }
      }

      const categoryDetail = category ? 
        (category.categories_details !== undefined ? 
          category.categories_details : "") : "";

      return {
        id: `restaurant-${info.id}`,
        name: info.Place_Name || "",
        address: info.Lot_Address || info.Road_Address || "",
        category: "restaurant",
        categoryDetail,
        x: info.longitude || 0,
        y: info.latitude || 0,
        naverLink: link?.link || "",
        instaLink: link?.instagram || "",
        rating,
        reviewCount,
        operatingHours: "",
      };
    });
  } catch (error) {
    console.error("Error fetching restaurants:", error);
    return [];
  }
}
