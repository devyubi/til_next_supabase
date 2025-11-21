'use client';
import { Comment, NestedComment } from '@/types/types';
import defaultAvatar from '/public/assets/icons/default-avatar.jpg';
import Image from 'next/image';
import Link from 'next/link';
import { formatTimeAgo } from '@/lib/time';
import { useSession } from '@/stores/session';
import { useState } from 'react';
import CommentEditor from './CommentEditor';
import useDeleteComment from '@/hooks/mutations/comment/useDeleteComment';
import { toast } from 'sonner';
import { useOpenAlertModal } from '@/stores/alertModalStore';
import { CornerDownRight } from 'lucide-react';

export default function CommentItem(comment: NestedComment) {
  const session = useSession();

  const [iseEditing, setIsEditing] = useState(false);
  const toggleEditing = () => {
    setIsEditing(prev => !prev);
  };

  // 대댓글 상태 관리
  const [isReplying, setIsReplying] = useState(false);
  const toggleReply = () => {
    setIsReplying(prev => !prev);
  };

  const isMine = session?.user.id === comment.author.id;

  // UI / UX 적용 : 일반적 댓글인지, 대댓글인지 정의함
  const isRootComment = comment.parentComment === undefined;

  // 대댓글의 해시태그 출력을 위한 파악
  const isOverTwoLevels = comment.parent_comment_id !== comment.root_comment_id;

  const openAlertModal = useOpenAlertModal();
  // 삭제 mutation 활용하기
  const { mutate: deleteComment, isPending: isDeleteCommentPending } =
    useDeleteComment({
      onSuccess: () => {},
      onError: error => {
        toast.error('댓글 삭제에 실패했습니다.', { position: 'top-center' });
      },
    });

  const handleDeleteComment = () => {
    openAlertModal({
      title: '댓글 삭제',
      description: `삭제된 댓글은 복구가 불가능합니다. 정말 삭제하시겠습니까?`,
      onPositive: () => deleteComment(comment.id),
      onNegative: () => {
        console.log('취소');
      },
    });
  };

  return (
    <div
      className={`flex flex-col gap-8 pb-5 ${isRootComment ? 'border-b' : 'ml-6'}`}
    >
      <div className='flex items-start gap-4'>
        <Link href={'#'}>
          <div className='flex h-full flex-col'>
            <Image
              className='h-10 w-10 rounded-full object-cover'
              src={comment.author.avatar_url || defaultAvatar}
              width={40}
              height={40}
              alt={comment.author.nickname || '회원 이미지'}
            />
          </div>
        </Link>
        <div className='flex w-full flex-col gap-2'>
          <div className='font-bold'>{comment.author.nickname}</div>

          {iseEditing ? (
            <>
              <CommentEditor
                type='EDIT'
                commentId={comment.id}
                initialContent={comment.content}
                onClose={toggleEditing}
              />
            </>
          ) : (
            <>
              <div>
                {isOverTwoLevels && (
                  <span className='font-bold text-blue-500'>
                    @{comment.parentComment?.author.nickname}
                  </span>
                )}
                {comment.content}
              </div>
            </>
          )}

          <div className='text-muted-foreground flex justify-between text-sm'>
            <div className='flex items-center gap-2'>
              <div
                onClick={toggleReply}
                className='cursor-pointer hover:underline'
              >
                댓글
              </div>
              <div className='bg-border h-[13px] w-0.5'></div>
              <div>{formatTimeAgo(comment.created_at)}</div>
            </div>
            <div className='flex items-center gap-2'>
              {isMine && (
                <>
                  <div
                    className='cursor-pointer hover:underline'
                    onClick={toggleEditing}
                  >
                    수정
                  </div>
                  <div className='bg-border h-[13px] w-0.5'></div>
                  <div
                    onClick={handleDeleteComment}
                    className='cursor-pointer hover:underline'
                  >
                    {isDeleteCommentPending ? '삭제중...' : '삭제'}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* 대댓글 영역 */}
      {isReplying && (
        <div className='flex flex-col gap-2'>
          <CommentEditor
            type='REPLY'
            postId={comment.post_id}
            parentCommentId={comment.id}
            onClose={toggleReply}
            rootCommentId={comment.root_comment_id || comment.id}
          />
        </div>
      )}
      {/* Children 댓글 출력 */}
      {comment.children.map(comment => (
        <div key={comment.id} className='flex items-start'>
          <div>
            <CornerDownRight />
          </div>
          <div className='flex-1'>
            <CommentItem key={comment.id} {...comment} />
          </div>
        </div>
      ))}
    </div>
  );
}
