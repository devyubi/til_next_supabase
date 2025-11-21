import { updateComment } from '@/apis/comment';
import { QUERY_KEYS } from '@/lib/constants';
import type { Comment, UseMutationCallback } from '@/types/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function useUpdateComment(callback?: UseMutationCallback) {
  const queryClient = useQueryClient();
  // author_id 를 이용해서 프로필 들도 불러와야 함.

  return useMutation({
    mutationFn: updateComment,
    // 성공시 리턴받은 데이터 자동 매개변수 전달
    onSuccess: updatedComment => {
      if (callback?.onSuccess) callback.onSuccess();

      // 캐시 업데이트
      queryClient.setQueryData<Comment[]>(
        QUERY_KEYS.comments.post(updatedComment.post_id),
        comments => {
          if (!comments)
            throw new Error('댓글이 캐시데이터에 보관되어 있지 않습니다.');

          // 댓글 한개 수정한 내용을 업데이트한 전체 배열을 리턴
          return comments.map(comment => {
            if (comment.id === updatedComment.id)
              return { ...comment, ...updatedComment };

            return comment;
          });
        }
      );
    },
    onError: error => {
      if (callback?.onError) callback.onError(error);
    },
  });
}
