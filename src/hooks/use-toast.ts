
import { toast as sonnerToast, type ToastT } from "sonner";

export type ToastProps = ToastT;

export function toast(props: ToastProps): void;
export function toast(message: string): void;
export function toast(title: string, description: string): void;
export function toast(
  message: string | ToastProps,
  description?: string
): void {
  if (typeof message === "string" && description) {
    sonnerToast(message, { description });
  } else if (typeof message === "string") {
    sonnerToast(message);
  } else {
    sonnerToast(message);
  }
}

toast.info = sonnerToast.info;
toast.success = sonnerToast.success;
toast.warning = sonnerToast.warning;
toast.error = sonnerToast.error;
toast.loading = sonnerToast.loading;
toast.message = sonnerToast.message;
toast.promise = sonnerToast.promise;
toast.custom = sonnerToast.custom;
toast.dismiss = sonnerToast.dismiss;

export const useToast = () => {
  return {
    toast,
  };
};

export default useToast;
