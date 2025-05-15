
import { toast } from "sonner";

export { toast };

// Reexport a dummy useToast to avoid circular dependencies
export const useToast = () => {
  return {
    toast,
    dismiss: (toastId?: string) => {
      if (toastId) {
        toast.dismiss(toastId);
      }
    }
  };
};
