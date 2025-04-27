
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

      // Calculate weight based on review data
      let weight = 0;
      if (reviews) {
        const reviewInfo = reviews.find((r: any) => r.id === info.ID || r.ID === info.ID);
        if (reviewInfo && reviewInfo.visitor_norm) {
          // Basic weight calculation based on normalized visitor count
          weight = reviewInfo.visitor_norm;
          
          // Log for debugging
          console.log(`Accommodation ${info.Place_Name || info.place_name} weight: ${weight}`);
        }
      }

      const categoryDetail = category ? 
        (category.categories_details !== undefined ? 
          category.categories_details : "") : "";

      // Format and normalize links
      const naverLink = link?.link || "";
      const instaLink = link?.instagram || "";

      return {
        id: `accommodation-${info.id}`,
        name: info.Place_Name || "",
        address: info.Lot_Address || info.Road_Address || "",
        category: "accommodation",
        categoryDetail,
        x: info.longitude || 0,
        y: info.latitude || 0,
        naverLink: link?.link || "",
        instaLink: link?.instagram || "",
        rating,
        reviewCount,
        operatingHours: "",
        weight, // Ensure weight is set
      };
    });
  } catch (error) {
    console.error("Error fetching accommodations:", error);
    return [];
  }
}
