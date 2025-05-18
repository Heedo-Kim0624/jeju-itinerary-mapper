
import { useState } from 'react';

/**
 * 입력값 관리 훅
 */
export const useInputState = () => {
  // 직접 입력 상태 관리
  const [accommodationDirectInput, setAccommodationDirectInput] = useState('');
  const [touristSpotDirectInput, setTouristSpotDirectInput] = useState('');
  const [restaurantDirectInput, setRestaurantDirectInput] = useState('');
  const [cafeDirectInput, setCafeDirectInput] = useState('');

  // 직접 입력값 관리 객체
  const directInputValues = {
    'accomodation': accommodationDirectInput,
    'touristSpot': touristSpotDirectInput,
    'restaurant': restaurantDirectInput,
    'cafe': cafeDirectInput
  };

  // 직접 입력값 변경 핸들러
  const onDirectInputChange = {
    'accommodation': setAccommodationDirectInput,
    'touristSpot': setTouristSpotDirectInput,
    'restaurant': setRestaurantDirectInput,
    'cafe': setCafeDirectInput
  };

  return {
    directInputValues,
    onDirectInputChange
  };
};
