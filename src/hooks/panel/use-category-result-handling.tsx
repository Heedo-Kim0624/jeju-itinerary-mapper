
import { useMapContext } from '@/components/rightpanel/MapContext';
import { usePanelVisibility } from '../use-panel-visibility';
import { CategoryName } from '@/utils/categoryUtils';

export const useCategoryResultHandling = (selectedRegions: string[]) => {
  const { setShowCategoryResult } = usePanelVisibility();
  const { panTo } = useMapContext();

  const handleResultClose = () => {
    setShowCategoryResult(null);
  };

  const handleShowCategoryResult = (category: CategoryName | null) => {
    setShowCategoryResult(category);
    if (selectedRegions.length > 0) {
      panTo(selectedRegions[0]);
    }
  };

  return {
    handleResultClose,
    handleShowCategoryResult
  };
};
