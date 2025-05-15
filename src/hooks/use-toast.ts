
import { toast as sonnerToast } from 'sonner';

// Create a simple wrapper with a similar API to the shadcn toast
export function useToast() {
  return {
    toast: (props: { title?: string; description?: string; variant?: 'default' | 'destructive' }) => {
      if (props.variant === 'destructive') {
        return sonnerToast.error(props.title, {
          description: props.description
        });
      }
      return sonnerToast(props.title || '', {
        description: props.description
      });
    }
  };
}

// Re-export sonner's toast for direct usage
export const toast = sonnerToast;
