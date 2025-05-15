
/**
 * 주소를 표시 가능한 형태로 변환
 */
export const formatAddress = (address: string | null | undefined): string => {
  if (!address) return '주소 정보 없음';
  return address.trim();
};

/**
 * 거리 정보를 적절한 단위로 변환
 */
export const formatDistance = (distance: number | null | undefined): string => {
  if (distance === null || distance === undefined) return '';
  if (distance < 1000) return `${distance.toFixed(0)}m`;
  return `${(distance / 1000).toFixed(1)}km`;
};

/**
 * 리뷰 수 포맷팅
 */
export const formatReviewCount = (count: number | null | undefined): string => {
  if (!count) return '리뷰 없음';
  return `리뷰 ${count}개`;
};
