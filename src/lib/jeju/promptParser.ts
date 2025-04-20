
import { ParsedPrompt, TravelCategory } from '@/types/travel';

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
