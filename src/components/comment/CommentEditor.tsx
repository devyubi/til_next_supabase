'use client';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import useCreateComment from '@/hooks/mutations/comment/useCreateComment';
import { toast } from 'sonner';
import useUpdateComment from '@/hooks/mutations/comment/useUpdateComment';

// 출력상태 구분 타입 정의
type CreateMode = {
  type: 'CREATE';
  postId: number;
};
type EditMode = {
  type: 'EDIT';
  commentId: number;
  initialContent: string;
  onClose: () => void;
};
type reflyMode = {
  type: 'REPLY';
  postId: number;
  parentCommentId: number;
  onClose: () => void;
  rootCommentId: number;
};

type Props = CreateMode | EditMode | reflyMode;

export default function CommentEditor(props: Props) {
  // mutation 활용
  const { mutate: createComment, isPending: isCreateCommentPending } =
    useCreateComment({
      onSuccess: () => {
        setContent('');
        // 대댓글 창이 보이면 닫아줌
        if (props.type === 'REPLY') props.onClose();
      },
      onError: error => {
        toast.error('댓글 등록에 실패했습니다.', { position: 'top-center' });
      },
    });

  // 업데이트 mutation 활용
  const { mutate: updateComment, isPending: isUpdateCommentPending } =
    useUpdateComment({
      onSuccess: () => {
        (props as EditMode).onClose();
      },
      onError: error => {
        toast.error('댓글 수정에 실패했습니다.', { position: 'top-center' });
      },
    });

  const isPending = isCreateCommentPending || isUpdateCommentPending;
  const [content, setContent] = useState('');

  const handleSaveComment = () => {
    if (content.trim() === '') return;
    // 요청을 보내서 Insert 진행함.
    if (props.type === 'CREATE') {
      createComment({ postId: props.postId, content });
    } else if (props.type === 'EDIT') {
      // update 실행
      updateComment({ id: props.commentId, content });
    } else if (props.type === 'REPLY') {
      createComment({
        postId: props.postId,
        content: content,
        parentCommentId: props.parentCommentId,
        rootCommentId: props.rootCommentId,
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      handleSaveComment();
    }
  };

  // 초기에 EDIT 이라면 내용 출력
  useEffect(() => {
    if (props.type === 'EDIT') {
      setContent(props.initialContent);
    }
  }, []);

  return (
    <div className='flex flex-col gap-2'>
      <Textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        disabled={isPending}
        onKeyDown={handleKeyDown}
      />
      <div className='flex justify-end gap-2'>
        {(props.type === 'EDIT' || props.type === 'REPLY') && (
          <Button onClick={() => props.onClose()}>취소</Button>
        )}
        <Button onClick={handleSaveComment} disabled={isPending}>
          {isPending ? '등록중...' : props.type === 'EDIT' ? '수정' : '작성'}
        </Button>
      </div>
    </div>
  );
}
