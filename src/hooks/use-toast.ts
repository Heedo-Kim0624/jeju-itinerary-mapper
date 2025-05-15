
import { useToast as useSonnerToast } from "sonner";

// 재정의된 toast 함수 및 useToast 훅
const toast = {
  success: (message: string, options?: any) => {
    return window.toast?.success(message, options);
  },
  error: (message: string, options?: any) => {
    return window.toast?.error(message, options);
  },
  info: (message: string, options?: any) => {
    return window.toast?.info(message, options);
  },
  warning: (message: string, options?: any) => {
    return window.toast?.warning(message, options);
  }
};

const useToast = useSonnerToast;

export { useToast, toast };
