
import { PlaceResult } from '@/types/travel';
import { KeywordWeight } from './interfaces';
import { normalizeField } from './placeNormalizer';

export function calculatePlaceScore(
  place: any,
  keywordWeights: KeywordWeight[],
  reviewNorm: number
): number {
  let totalScore = 0;
  let foundKeywords = 0;
  let matchedKeywords: { keyword: string; value: number }[] = [];

  console.log(`장소 가중치 계산 시작 (리뷰 정규화: ${reviewNorm})`);
  console.log('장소 객체 속성:', Object.keys(place));

  keywordWeights.forEach(({ keyword, weight }) => {
    const possibleFields = [
      keyword, 
      keyword.toLowerCase(), 
      keyword.toUpperCase(),
      `${keyword}_score`,
      `${keyword.toLowerCase()}_score`,
      `${keyword}_rating`,
      `${keyword.toLowerCase()}_rating`
    ];
    
    const keywordValue = normalizeField(place, possibleFields);
    
    if (keywordValue > 0) {
      foundKeywords++;
      matchedKeywords.push({ keyword, value: keywordValue });
      console.log(`  - 키워드 '${keyword}' 값: ${keywordValue}, 가중치: ${weight.toFixed(3)}, 곱: ${(keywordValue * weight).toFixed(3)}`);
    } else {
      console.log(`  - 키워드 '${keyword}' 값: 없음 (0)`);
    }
    
    totalScore += keywordValue * weight;
  });

  if (foundKeywords === 0 && keywordWeights.length > 0) {
    console.log(`  - 일치하는 키워드가 없습니다. 점수 0 반환`);
    return 0;
  }

  const finalScore = totalScore * reviewNorm;

  console.log('가중치 계산 결과:', {
    place_name: normalizeField(place, ['place_name', 'Place_Name']) || '이름 없음',
    matched_keywords: matchedKeywords,
    total_score: totalScore,
    review_norm: reviewNorm,
    final_score: finalScore
  });

  return finalScore;
}

export function convertToPlaceResult(place: any, ratings: any[], categories: any[], links: any[], reviews: any[]): PlaceResult {
  const normalized = normalizePlaceFields(place);
  
  const rating = ratings.find(r => r.id === normalized.id);
  const category = categories.find(c => c.id === normalized.id);
  const link = links.find(l => l.id === normalized.id);
  const review = reviews.find(r => r.id === normalized.id);
  
  let ratingValue = 0;
  let reviewCount = 0;
  
  if (rating) {
    ratingValue = parseFloat(String(normalizeField(rating, ['rating']) || '0'));
    reviewCount = parseInt(String(normalizeField(rating, ['visitor_review_count']) || '0'));
  }
  
  let reviewNorm = 1;
  if (review?.visitor_norm !== undefined) {
    reviewNorm = parseFloat(String(review.visitor_norm || '1'));
  }

  const categoryDetail = category ? 
    (normalizeField(category, ['categories_details', 'Categories_Details', 'categories', 'Categories']) || '') : '';

  const naverLink = link ? (link.link || '') : '';
  const instaLink = link ? (link.instagram || '') : '';

  return {
    id: String(normalized.id),
    place_name: normalized.placeName,
    road_address: normalized.roadAddress || normalized.lotAddress || "",
    category: place.category || '',
    x: normalized.longitude,
    y: normalized.latitude,
    rating: ratingValue,
    visitor_review_count: reviewCount,
    weight: reviewNorm,
    naverLink,
    instaLink,
    categoryDetail
  };
}
