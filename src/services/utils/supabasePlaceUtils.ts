
import { supabase } from '@/integrations/supabase/client'; // Using the new client
import { Place } from '@/types/supabase';
import { parseIntId } from '@/utils/id-utils';

const PLACE_CATEGORIES = ['accommodation', 'landmark', 'restaurant', 'cafe'] as const;
type PlaceCategory = typeof PLACE_CATEGORIES[number];

interface RawPlaceInfo {
  id: string | number;
  [key: string]: any;
}

interface RawLinkInfo {
  id: string | number;
  link?: string;
  instagram?: string;
  [key: string]: any;
}

interface RawCategoryInfo {
  id: string | number;
  categories_details?: string; // Assuming this is JSON string
  [key: string]: any;
}

interface RawRatingInfo {
  id: string | number;
  average_rating?: number;
  review_count?: number;
  [key: string]: any;
}

interface RawReviewInfo {
  id: string | number;
  // Define review structure if needed, or just count them
  [key: string]: any;
}

export async function fetchAllPlacesDetails(): Promise<Place[]> {
  console.log('[SupabasePlaceUtils] Fetching all place details...');
  const allPlacesData: Place[] = [];
  let totalFetched = 0;

  for (const category of PLACE_CATEGORIES) {
    console.log(`[SupabasePlaceUtils] Fetching data for category: ${category}`);
    const informationTable = `${category}_information`;
    const linkTable = `${category}_link`;
    const categoryTable = `${category}_categories`;
    const ratingTable = `${category}_rating`;
    const reviewTable = `${category}_review`; // Assuming review table exists for all

    try {
      // 1. Fetch base information
      const { data: placesInfo, error: placesError } = await supabase
        .from(informationTable)
        .select('*');
      if (placesError) throw placesError;
      if (!placesInfo) continue;

      const placeInfoMap = new Map<number, RawPlaceInfo>();
      placesInfo.forEach(p => {
        const numId = parseIntId(p.id);
        if (numId !== null) placeInfoMap.set(numId, p as RawPlaceInfo);
      });

      // 2. Fetch links
      const { data: linksData, error: linksError } = await supabase.from(linkTable).select('*');
      if (linksError) console.warn(`Error fetching links for ${category}:`, linksError.message);
      const linksMap = new Map<number, RawLinkInfo>();
      linksData?.forEach(l => {
        const numId = parseIntId(l.id);
        if (numId !== null) linksMap.set(numId, l as RawLinkInfo);
      });
      
      // 3. Fetch categories details
      const { data: categoriesData, error: categoriesError } = await supabase.from(categoryTable).select('*');
      if (categoriesError) console.warn(`Error fetching categories for ${category}:`, categoriesError.message);
      const categoriesMap = new Map<number, RawCategoryInfo>();
      categoriesData?.forEach(c => {
        const numId = parseIntId(c.id);
        if (numId !== null) categoriesMap.set(numId, c as RawCategoryInfo);
      });

      // 4. Fetch ratings
      const { data: ratingsData, error: ratingsError } = await supabase.from(ratingTable).select('*');
      if (ratingsError) console.warn(`Error fetching ratings for ${category}:`, ratingsError.message);
      const ratingsMap = new Map<number, RawRatingInfo>();
      ratingsData?.forEach(r => {
        const numId = parseIntId(r.id);
        if (numId !== null) ratingsMap.set(numId, r as RawRatingInfo);
      });
      
      // 5. Fetch reviews (example: just count for now or fetch specific fields)
      // For simplicity, we'll primarily use review_count from rating table if available.
      // If detailed reviews are needed, this part would be more complex.
      // const { data: reviewsData, error: reviewsError } = await supabase.from(reviewTable).select('id, place_id'); // Adjust select
      // if (reviewsError) console.warn(`Error fetching reviews for ${category}:`, reviewsError.message);
      // const reviewsByPlaceId = new Map<number, number>(); // place_id -> count
      // reviewsData?.forEach(r => {
      //   const numPlaceId = parseIntId(r.place_id); // Assuming reviews have place_id
      //   if (numPlaceId !== null) {
      //     reviewsByPlaceId.set(numPlaceId, (reviewsByPlaceId.get(numPlaceId) || 0) + 1);
      //   }
      // });


      // Merge data for each place in this category
      for (const [id, baseInfo] of placeInfoMap) {
        const linkInfo = linksMap.get(id);
        const categoryInfo = categoriesMap.get(id);
        const ratingInfo = ratingsMap.get(id);
        // const reviewCount = reviewsByPlaceId.get(id) || 0;

        let categoryDetailParsed: any = null;
        if (categoryInfo?.categories_details) {
          try {
            categoryDetailParsed = JSON.parse(categoryInfo.categories_details);
          } catch (e) {
            console.warn(`[SupabasePlaceUtils] Failed to parse categories_details for ${id}:`, e);
          }
        }
        
        // Construct the Place object, ensuring all fields from the Place type are considered
        // This will likely require careful mapping from baseInfo, linkInfo, etc. to Place properties
        const place: Place = {
          id: String(id), // Store ID as string as per Place type, but we use numeric for map keys
          name: baseInfo.name || 'N/A',
          category: baseInfo.category || category, // Fallback to overall category
          x: typeof baseInfo.x === 'number' ? baseInfo.x : 0,
          y: typeof baseInfo.y === 'number' ? baseInfo.y : 0,
          address: baseInfo.address || 'N/A',
          road_address: baseInfo.road_address || baseInfo.address || 'N/A',
          phone: baseInfo.phone || 'N/A',
          description: baseInfo.description || '',
          // Rating and review count: prioritize ratingInfo, then baseInfo
          rating: ratingInfo?.average_rating ?? baseInfo.rating ?? 0,
          reviewCount: ratingInfo?.review_count ?? baseInfo.review_count ?? 0,
          image_url: baseInfo.image_url || '',
          homepage: baseInfo.homepage || '',
          geoNodeId: baseInfo.geoNodeId || undefined,
          // operationTimeData might come from baseInfo or need specific parsing
          operationTimeData: baseInfo.operationTimeData || undefined, 
          weight: typeof baseInfo.weight === 'number' ? baseInfo.weight : undefined,
          raw: baseInfo.raw || undefined,
          categoryDetail: categoryDetailParsed || baseInfo.categoryDetail || undefined,
          naverLink: linkInfo?.link || baseInfo.naverLink || undefined,
          instaLink: linkInfo?.instagram || baseInfo.instaLink || undefined,
          operatingHours: baseInfo.operatingHours || undefined,
        };
        allPlacesData.push(place);
        totalFetched++;
      }
      console.log(`[SupabasePlaceUtils] Fetched ${placeInfoMap.size} places for category ${category}.`);

    } catch (error) {
      console.error(`[SupabasePlaceUtils] Failed to fetch data for category ${category}:`, error);
      // Decide if to throw or continue for other categories
    }
  }
  console.log(`[SupabasePlaceUtils] Successfully fetched details for ${totalFetched} places in total.`);
  return allPlacesData;
}
