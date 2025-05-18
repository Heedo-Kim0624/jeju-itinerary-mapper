
import { useState } from 'react';
import { CategoryName } from '@/utils/categoryUtils';

/**
 * 입력값 관리 훅
 */
export const useInputState = () => {
  // 직접 입력 상태 관리
  const [accommodationDirectInput, setAccommodationDirectInput] = useState('');
  const [attractionDirectInput, setAttractionDirectInput] = useState(''); // Changed from landmark
  const [restaurantDirectInput, setRestaurantDirectInput] = useState('');
  const [cafeDirectInput, setCafeDirectInput] = useState('');

  // 직접 입력값 관리 객체
  const directInputValues: Record<CategoryName, string> = {
    'accommodation': accommodationDirectInput,
    'attraction': attractionDirectInput, // Changed from landmark
    'restaurant': restaurantDirectInput,
    'cafe': cafeDirectInput
  };

  // 직접 입력값 변경 핸들러
  const onDirectInputChange = (category: CategoryName, value: string) => {
    switch (category) {
      case 'accommodation':
        setAccommodationDirectInput(value);
        break;
      case 'attraction': // Changed from landmark
        setAttractionDirectInput(value);
        break;
      case 'restaurant':
        setRestaurantDirectInput(value);
        break;
      case 'cafe':
        setCafeDirectInput(value);
        break;
    }
  };

  return {
    directInputValues,
    onDirectInputChange
  };
};
