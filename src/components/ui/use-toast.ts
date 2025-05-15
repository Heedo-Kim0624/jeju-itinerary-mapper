
// 우리는 실제로 sonner의 toast를 사용합니다
import { toast } from "sonner";

// 기존 toast 인터페이스를 유지하되 실제로는 sonner를 사용
const useToast = () => {
  return {
    toast
  };
};

export { useToast, toast };
