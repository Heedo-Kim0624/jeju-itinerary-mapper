
import { Place } from "@/types/supabase";
import { fetchCategoryData } from "../utils/supabaseUtils";

export async function fetchAccommodations(): Promise<Place[]> {
  try {
    const { places, links, categories, ratings } = await fetchCategoryData(
      "accomodation_information",
      "accomodation_link",
      "accomodation_categories",
      "accomodation_rating"
    );

    return places.map((info: any) => {
      const link = links?.find((link: any) => link.ID === info.ID);
      const category = categories?.find((category: any) => category.id === info.ID);
      
      let rating = null;
      let reviewCount = null;
      if (ratings) {
        const ratingInfo = ratings.find((r: any) => r.id === info.ID);
        if (ratingInfo) {
          rating = ratingInfo.rating;
          reviewCount = ratingInfo.visitor_review_count;
        }
      }

      const categoryDetail = category ? 
        (category.categories_details !== undefined ? 
          category.categories_details : "") : "";

      return {
        id: `accommodation-${info.ID}`,
        name: info.Place_Name || "",
        address: info.Lot_Address || info.Road_Address || "",
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
  } catch (error) {
    console.error("Error fetching accommodations:", error);
    return [];
  }
}
