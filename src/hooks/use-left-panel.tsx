
import { useLeftPanelIntegration } from './left-panel/use-left-panel-integration';

/**
 * 왼쪽 패널 기능 통합 훅 - 단순 리다이렉션
 * 기존 API와의 호환성을 위해 남겨둔 래퍼 훅
 */
export const useLeftPanel = () => {
  return useLeftPanelIntegration();
};
