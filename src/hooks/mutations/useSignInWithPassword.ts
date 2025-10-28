import { signInWithPassword } from '@/apis/auth';
import { UseMutationCallback } from '@/types/types';
import { useMutation } from '@tanstack/react-query';

export function useSignInWithPassword(callback?: UseMutationCallback) {
  return useMutation({
    mutationFn: signInWithPassword,
    // 자동으로 error 전달받음
    onError: error => {
      console.error(error);

      // 컴포넌트에서 전달받은 Error임. 위에꺼 아님
      if (callback?.onError) callback.onError(error);
    },
  });
}
