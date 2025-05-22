import { supabase } from '@/lib/supabaseClient';
import { parseIntId } from '@/utils/id-utils';
import { toCategoryName } from '@/utils/typeConversionUtils';
import type { DetailedPlace, RawPlaceInfo, RawPlaceRating, RawPlaceLink, RawPlaceCategoryDetail, PlaceTableType } from '@/types/detailedPlace';

const PLACE_TABLE_TYPES: PlaceTableType[] = ['accommodation', 'landmark', 'restaurant', 'cafe'];

async function fetchDataForType(type: PlaceTableType): Promise<DetailedPlace[]> {
  const informationTable = `${type}_information`;
  const ratingTable = `${type}_rating`;
  const linkTable = `${type}_link`;
  const categoryDetailTable = `${type}_categories`;

  console.log(`[placeDataLoader] Fetching data for type: ${type}`);

  // 1. Fetch all from information table
  const { data: rawInfos, error: infoError } = await supabase
    .from(informationTable)
    .select('*');

  if (infoError) {
    console.error(`[placeDataLoader] Error fetching ${informationTable}:`, infoError);
    return [];
  }
  if (!rawInfos || rawInfos.length === 0) {
    console.log(`[placeDataLoader] No data found in ${informationTable}`);
    return [];
  }
  
  console.log(`[placeDataLoader] Fetched ${rawInfos.length} items from ${informationTable}`);

  const placeIds = rawInfos.map(p => parseIntId(p.id)).filter(id => id !== null) as number[];

  if (placeIds.length === 0) {
    console.log(`[placeDataLoader] No valid IDs found for ${type}`);
    return [];
  }

  // 2. Fetch related data in bulk
  const [
    { data: rawRatings, error: ratingError },
    { data: rawLinks, error: linkError },
    { data: rawCategoryDetails, error: categoryDetailError },
  ] = await Promise.all([
    supabase.from(ratingTable).select('*').in('id', placeIds),
    supabase.from(linkTable).select('*').in('id', placeIds),
    supabase.from(categoryDetailTable).select('*').in('id', placeIds),
  ]);

  if (ratingError) console.error(`[placeDataLoader] Error fetching ${ratingTable}:`, ratingError);
  if (linkError) console.error(`[placeDataLoader] Error fetching ${linkTable}:`, linkError);
  if (categoryDetailError) console.error(`[placeDataLoader] Error fetching ${categoryDetailTable}:`, categoryDetailError);
  
  console.log(`[placeDataLoader] Fetched related data for ${type}: ratings(${rawRatings?.length || 0}), links(${rawLinks?.length || 0}), categories(${rawCategoryDetails?.length || 0})`);

  // Helper to find related data by ID
  const findById = <T extends { id: string | number }>(collection: T[] | null, id: number): T | undefined => {
    return collection?.find(item => parseIntId(item.id) === id);
  };

  // 3. Merge data
  const detailedPlaces: DetailedPlace[] = rawInfos.map((rawInfoUntyped: any) => {
    const rawInfo = rawInfoUntyped as RawPlaceInfo;
    const numId = parseIntId(rawInfo.id);

    if (numId === null) {
      console.warn('[placeDataLoader] Skipping item with invalid ID:', rawInfo);
      return null;
    }

    const ratingData = findById(rawRatings as RawPlaceRating[] | null, numId);
    const linkData = findById(rawLinks as RawPlaceLink[] | null, numId);
    const categoryDetailData = findById(rawCategoryDetails as RawPlaceCategoryDetail[] | null, numId);
    
    const placeName = rawInfo.place_name || rawInfo.name || '이름 정보 없음';
    // Determine category, using rawInfo.category if available, else map from type
    const rawCategoryString = rawInfo.category || type;


    return {
      id: numId,
      name: placeName,
      address: rawInfo.road_address || rawInfo.lot_address || rawInfo.address || '주소 정보 없음',
      road_address: rawInfo.road_address,
      phone: rawInfo.phone,
      category: toCategoryName(rawCategoryString, type === 'accommodation' ? '숙소' : type === 'landmark' ? '관광지' : type === 'restaurant' ? '음식점' : '카페'),
      description: rawInfo.description,
      x: typeof rawInfo.longitude === 'string' ? parseFloat(rawInfo.longitude) : rawInfo.longitude || 0,
      y: typeof rawInfo.latitude === 'string' ? parseFloat(rawInfo.latitude) : rawInfo.latitude || 0,
      image_url: rawInfo.image_url,
      homepage: rawInfo.homepage_url || rawInfo.homepage,
      
      rating: typeof ratingData?.rating === 'string' ? parseFloat(ratingData.rating) : ratingData?.rating,
      visitor_review_count: typeof ratingData?.visitor_review_count === 'string' ? parseInt(ratingData.visitor_review_count, 10) : ratingData?.visitor_review_count,
      
      categories_details: categoryDetailData?.categories_details || categoryDetailData?.Categories_Details,
      
      link_url: linkData?.link,
      instagram_url: linkData?.instagram,
      original_place_type: type,
    };
  }).filter(p => p !== null) as DetailedPlace[];
  
  console.log(`[placeDataLoader] Successfully merged ${detailedPlaces.length} detailed places for type: ${type}`);
  return detailedPlaces;
}

export async function fetchAllPlacesData(): Promise<Map<number, DetailedPlace>> {
  console.log('[placeDataLoader] Starting to fetch all places data...');
  const allPlacesMap = new Map<number, DetailedPlace>();
  let totalFetched = 0;

  const results = await Promise.all(PLACE_TABLE_TYPES.map(type => fetchDataForType(type)));

  results.forEach(typedPlaces => {
    typedPlaces.forEach(place => {
      if (place.id !== undefined) { // Ensure ID is valid
        if (allPlacesMap.has(place.id)) {
          // console.warn(`[placeDataLoader] Duplicate ID found: ${place.id} for place "${place.name}". Original: "${allPlacesMap.get(place.id)?.name}". Keeping the first one.`);
        } else {
          allPlacesMap.set(place.id, place);
          totalFetched++;
        }
      }
    });
  });
  
  console.log(`[placeDataLoader] Finished fetching all data. Total unique places loaded: ${allPlacesMap.size} (from ${totalFetched} individual records before deduplication)`);
  return allPlacesMap;
}
