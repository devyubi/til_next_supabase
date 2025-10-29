import { signUpWithEmail } from '@/apis/auth';
import { UseMutationCallback } from '@/types/types';
import { useMutation } from '@tanstack/react-query';

export function useSignUp(callback: UseMutationCallback) {
  return useMutation({
    mutationFn: signUpWithEmail,
    // 자동으로 error 전달받음
    onError: error => {
      console.error(error);
      if (callback?.onError) callback.onError(error);
    },
  });
}
