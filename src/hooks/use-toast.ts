
import { toast as sonnerToast } from "sonner";

// sonner의 toast 객체를 직접 사용하도록 수정
// Toaster 컴포넌트는 App.tsx 또는 최상위 레이아웃에 이미 설정되어 있어야 함
export const toast = sonnerToast;

// src/components/ui/toaster.tsx 에서 sonner의 Toaster를 사용하므로,
// 별도의 useToast 훅은 여기서 필요하지 않을 수 있음.
// 만약 shadcn/ui의 자체 Toast 시스템을 사용하려 했다면,
// 해당 시스템의 useToast를 사용해야 함.
// 현재 프로젝트는 sonner를 사용하고 있으므로, sonner의 toast를 직접 사용.
