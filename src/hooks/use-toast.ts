
import { toast as sonnerToast, Toaster as SonnerToaster, ToastT } from 'sonner';

// sonner의 toast 함수를 직접 사용하도록 type 정의
type ShowToastArgs = Parameters<typeof sonnerToast>[0];
type ShowToastOptions = Parameters<typeof sonnerToast>[1];

const toast = (message: ShowToastArgs, data?: ShowToastOptions) => {
  if (typeof message === 'string') {
    // 기본 성공 토스트 또는 data 객체의 type에 따라 분기
    if (data?.id && (data.id as unknown as string).startsWith('error-')) {
       sonnerToast.error(message, data);
    } else if (data?.id && (data.id as unknown as string).startsWith('success-')) {
       sonnerToast.success(message, data);
    } else if (data?.id && (data.id as unknown as string).startsWith('info-')) {
       sonnerToast.info(message, data);
    } else if (data?.id && (data.id as unknown as string).startsWith('warning-')) {
       sonnerToast.warning(message, data);
    } else {
      // 기본 메시지 토스트 (옵션으로 스타일 지정 가능)
      sonnerToast(message, data);
    }
  } else {
    // message가 객체 형태일 경우 (커스텀 컴포넌트 등)
    sonnerToast(message, data);
  }
};

// sonner의 주요 함수들을 직접 export 할 수 있습니다.
// 예를 들어, toast.success, toast.error 등을 직접 사용 가능.
// useToast 훅은 상태 관리가 필요할 때 유용하지만,
// 지금은 sonner를 직접 사용하는 형태로 단순화합니다.

// Toaster 컴포넌트는 sonner의 것을 그대로 사용합니다.
// cn 함수는 shadcn/ui 유틸리티이므로, 여기서는 직접 사용하지 않습니다.
// 필요 시 Toaster props에 classNames 등을 통해 스타일링 가능.
const Toaster = SonnerToaster;

// useToast 훅을 유지하고 싶다면, sonner의 상태를 관리하는 방식으로 재구현해야 합니다.
// 현재 shadcn/ui의 useToast와 sonner의 사용 방식이 혼재되어 오류가 발생하고 있습니다.
// 가장 간단한 해결책은 sonner의 toast 함수와 Toaster 컴포넌트를 직접 사용하는 것입니다.
// 만약 shadcn UI 스타일의 toast를 원한다면, 해당 컴포넌트를 일관되게 사용해야 합니다.

// 여기서는 sonner의 기능을 직접 사용하도록 하고,
// 기존 useToast의 복잡한 상태 관리 로직은 제거합니다.
// useToast를 호출하는 곳에서 반환되는 toast 함수를 사용합니다.
const useToast = () => {
  return {
    toast, // 위에서 정의한 sonnerToast 래퍼 함수
    dismiss: (toastId?: number | string) => sonnerToast.dismiss(toastId),
  };
};

export { useToast, toast, Toaster };

// ToastProps 관련 충돌을 피하기 위해,
// 이 파일에서 ToastActionElement, ToastProps 등의 타입 정의는 제거합니다.
// sonner의 ToastT 타입을 필요에 따라 사용할 수 있습니다.
export type { ToastT };
