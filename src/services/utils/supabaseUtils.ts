
import { supabase } from "@/integrations/supabase/client";

export interface FetchResult {
  places: any[];
  ratings: any[];
  categories: any[];
  links: any[];
}

export async function fetchCategoryData(
  infoTable: string,
  linksTable: string,
  categoriesTable: string,
  ratingsTable: string
): Promise<FetchResult> {
  try {
    // Fetch place information
    const { data: places, error: infoError } = await supabase
      .from(infoTable)
      .select("*");

    if (infoError) throw infoError;

    // Fetch links
    const { data: links, error: linksError } = await supabase
      .from(linksTable)
      .select("*");

    if (linksError) throw linksError;

    // Fetch categories
    const { data: categories, error: categoriesError } = await supabase
      .from(categoriesTable)
      .select("*");

    if (categoriesError) throw categoriesError;

    // Fetch ratings
    const { data: ratings, error: ratingsError } = await supabase
      .from(ratingsTable)
      .select("*");

    if (ratingsError) {
      console.error(`Error fetching ratings from ${ratingsTable}:`, ratingsError);
    }

    return {
      places: places || [],
      links: links || [],
      categories: categories || [],
      ratings: ratings || []
    };
  } catch (error) {
    console.error(`Error fetching category data:`, error);
    return {
      places: [],
      links: [],
      categories: [],
      ratings: []
    };
  }
}
