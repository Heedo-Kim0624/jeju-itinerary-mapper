
import { ParsedPrompt, TravelCategory, PlaceResult } from '@/types/travel';
import { calculateWeights } from './weightCalculator';
import { fetchPlaceData, normalizeField } from '@/services/placeService';
import { calculatePlaceScore } from './placeScoring';
import { Place } from '@/types/supabase';

export function parsePrompt(prompt: string): ParsedPrompt | null {
  try {
    // Extract date range if present
    const dateRangeMatch = prompt.match(/일정\[([\d\.]+),([\d:]+),([\d\.]+),([\d:]+)\]/);
    const dateRange = dateRangeMatch ? {
      startDate: dateRangeMatch[1],
      startTime: dateRangeMatch[2],
      endDate: dateRangeMatch[3],
      endTime: dateRangeMatch[4]
    } : undefined;

    // Extract locations
    const locationMatch = prompt.match(/지역\[([^\]]+)\]/);
    const locations = locationMatch ? locationMatch[1].split(',').map(l => l.trim()) : [];

    // Extract category and keywords
    const categoryMatch = prompt.match(/(숙소|관광지|음식점|카페)\[([^\]]+)\]/);
    if (!categoryMatch) {
      console.error("No valid category found in prompt");
      return null;
    }

    // Map Korean category names to English
    const categoryMap: { [key: string]: TravelCategory } = {
      '숙소': 'accommodation',
      '관광지': 'landmark',
      '음식점': 'restaurant',
      '카페': 'cafe',
    };
    
    const category = categoryMap[categoryMatch[1]];
    
    // Parse keywords
    const keywordsPart = categoryMatch[2];
    
    // Extract ranked keywords (inside curly braces)
    const rankedMatch = keywordsPart.match(/\{([^}]+)\}/);
    const rankedKeywords = rankedMatch 
      ? rankedMatch[1].split(',').map(k => k.trim())
      : [];

    // Extract unranked keywords (outside curly braces)
    let unrankedKeywordsPart = keywordsPart.replace(/\{[^}]+\}/, '').trim();
    if (unrankedKeywordsPart.startsWith(',')) {
      unrankedKeywordsPart = unrankedKeywordsPart.substring(1);
    }
    
    const unrankedKeywords = unrankedKeywordsPart
      ? unrankedKeywordsPart.split(',').map(k => k.trim()).filter(Boolean)
      : [];

    return {
      category,
      locations,
      rankedKeywords,
      unrankedKeywords,
      dateRange,
    };
  } catch (error) {
    console.error("Error parsing prompt:", error);
    return null;
  }
}

export async function fetchWeightedResults(
  category: string,
  locations: string[],
  keywords: string[]
): Promise<PlaceResult[]> {
  try {
    console.log(`Fetching weighted results for category ${category} with keywords:`, keywords);
    
    // 1. 주어진 카테고리와 위치에 맞는 장소 데이터 조회
    const travelCategory = category as TravelCategory;
    const result = await fetchPlaceData(travelCategory, locations);
    
    if (!result.places || result.places.length === 0) {
      console.log('No places found for the given category and locations');
      return [];
    }
    
    // 2. 키워드를 순위별 키워드와 일반 키워드로 나누기
    // (실제로는 순위별 가중치를 계산하는 함수를 활용해야 함)
    const rankedKeywords = keywords.slice(0, 3); // 예시: 상위 3개를 순위별 키워드로
    const unrankedKeywords = keywords.slice(3);
    
    // 3. 키워드에 대한 가중치 계산
    const keywordWeights = calculateWeights(rankedKeywords, unrankedKeywords);
    
    console.log('Calculated keyword weights:', keywordWeights);
    
    // 4. 각 장소에 대한 점수 계산 및 결과 변환
    const scoredResults = result.places.map(place => {
      const id = normalizeField(place, 'id');
      
      // 리뷰 데이터에서 정규화된 방문자 수 가져오기
      const reviewInfo = result.reviews.find((r: any) => normalizeField(r, 'id') === id);
      const reviewNorm = reviewInfo ? parseFloat(String(normalizeField(reviewInfo, 'visitor_norm') || '1')) : 1;
      
      // 장소 점수 계산
      const score = calculatePlaceScore(place, keywordWeights, reviewNorm);
      
      // 장소 객체 생성
      const placeResult: PlaceResult = {
        id: String(id),
        place_name: normalizeField(place, 'place_name') || '',
        road_address: normalizeField(place, 'road_address') || normalizeField(place, 'lot_address') || '',
        category: travelCategory,
        x: parseFloat(String(normalizeField(place, 'longitude') || '0')),
        y: parseFloat(String(normalizeField(place, 'latitude') || '0')),
        rating: parseFloat(String(normalizeField(place, 'rating') || '0')),
        visitor_review_count: parseInt(String(normalizeField(place, 'visitor_review_count') || '0')),
        visitor_norm: score,
        categoryDetail: '',
        naverLink: '',
        instaLink: ''
      };
      
      return placeResult;
    });
    
    // 5. 점수에 따라 결과 정렬
    const sortedResults = scoredResults
      .sort((a, b) => (b.visitor_norm || 0) - (a.visitor_norm || 0))
      .filter(place => place.visitor_norm > 0);
    
    console.log(`Found ${sortedResults.length} weighted results`);
    
    return sortedResults;
  } catch (error) {
    console.error("Error fetching weighted results:", error);
    return [];
  }
}
