
// src/hooks/use-toast.ts에서 sonner의 toast 객체를 직접 가져오도록 수정
import { toast } from "@/hooks/use-toast";

// useToast 훅은 sonner에서 직접 제공하는 방식이 아니므로,
// 여기서는 toast 객체만 re-export 하거나,
// 만약 shadcn/ui의 useToast 시그니처가 필요하다면 해당 구현이 필요.
// 현재는 sonner의 toast 객체만 사용한다고 가정.
export { toast };
