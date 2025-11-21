# comments 댓글의 댓글

## 1. 댓글의 댓글을 배치시 고려사항

- 댓글의 배치 순서가 최신순이 아님
- 시간이 오래된 순서로 배치하고 댓글 출력
- `/src/apis/comments.ts` 일부 옵션 조절

- `/src/apis/comment.ts` 일부 옵션 조절

```ts
// 2. 댓글 조회하기
export async function fetchComments(postId: number) {
  const { data, error } = await supabase
    .from('comments')
    .select('*, author: profiles!author_id(*)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true }); // 오래된 순
  if (error) throw error;
  return data;
}
```

## 2. 캐시 데이터 정렬 후 갱신하기

- `/src/hooks/mutations/comment/useCreateComment.ts`

```ts
return [...comments, { ...newComment, author: profile }];
```

- 전체 코드

```ts
import { createComment } from '@/apis/comment';
import useProfileData from '@/hooks/queries/useProfileData';
import { QUERY_KEYS } from '@/lib/constants';
import { useSession } from '@/stores/session';
import { Comment, UseMutationCallback } from '@/types/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function useCreateComment(callback?: UseMutationCallback) {
  const queryClient = useQueryClient();
  // author_id 를 이용해서 프로필 들도 불러와야 함.
  const session = useSession();
  const { data: profile } = useProfileData(session?.user.id);

  return useMutation({
    mutationFn: createComment,
    // 리턴 받은 성공데이터를 매개변수로 자동으로 받습니다.
    onSuccess: newComment => {
      if (callback?.onSuccess) callback.onSuccess();
      // 캐시 업데이트
      queryClient.setQueryData<Comment[]>(
        QUERY_KEYS.comments.post(newComment.post_id),
        comments => {
          if (!comments) throw new Error('댓글 목록을 찾을 수 없습니다.');
          if (!profile) throw new Error('사용자 정보를 찾을 수 없습니다.');

          // 새로운 댓글을 배열의 뒤에 추가 형태 반영
          return [...comments, { ...newComment, author: profile }];
        }
      );
    },
    onError: error => {
      if (callback?.onError) callback.onError(error);
    },
  });
}
```

## 3. 대댓글 테이블

### 3.1. 테이블의 변경

- Post ID 와 Comment ID 는 생성 돼있음.
- 추가로 부모 `Comment ID` 를 보관해서 관리.
- `comments` 테이블 칼럼 추가 → `edit table`
- `parent_comment_id` → `int8` → `NULL` → `is Nullable` → save 버튼

### 3.2. FK 설정

- 부모 댓글의 칼럼 id 를 참조할 수 있도록 외래키 관계 설정
- Add foreign key reation 버튼 → `comments` → `parent_comment_id` → `id` → `cascade` → `cascade` → save 버튼

### 3.3. 타입 반영

```bash
npx supabase login
npm run generate-types
```

## 4. API 수정하기

- `/src/apis/comment.ts` 업데이트
- `parentCommentId?: number`

```ts
export async function createComment({
  postId,
  content,
  parentCommentId,
}: {
  postId: number;
  content: string;
  parentCommentId?: number;
}) {
  const { data, error } = await supabase
    .from('comments')
    .insert({ post_id: postId, content, parent_comment_id: parentCommentId })
    .select()
    .single();
  if (error) throw error;
  return data;
}
```

## 5. 기능 구현하기

### 5.1. 대댓글 작성하기

- `/src/components/comment/ComponentItem.tsx` 업데이트

```tsx
// 대댓글 상태 관리
const [isReplying, setIsReplying] = useState(false);
const toggleReply = () => {
  setIsReplying(prev => !prev);
};
```

```tsx
<div onClick={toggleReply} className='cursor-pointer hover:underline'>
  댓글
</div>
```

```tsx
{
  /* 대댓글 영역 */
}
{
  isReplying && (
    <div className='flex flex-col gap-2'>
      <CommentEditor
        type='REPLY'
        postId={comment.post_id}
        parentCommentId={comment.id}
        onClose={toggleReply}
      />
    </div>
  );
}
```

- `/src/components/comment/CommentEditor.tsx` 업데이트
- type 에 `REPLY` 추가

```tsx
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
};

type Props = CreateMode | EditMode | reflyMode;

export default function CommentEditor(props: Props) {
  // mutation 활용
  const { mutate: createComment, isPending: isCreateCommentPending } =
    useCreateComment({
      onSuccess: () => {
        setContent('');
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
        {props.type === 'EDIT' && (
          <Button variant='secondary' onClick={() => props.onClose()}>
            취소
          </Button>
        )}
        <Button onClick={handleSaveComment} disabled={isPending}>
          {isPending ? '등록중...' : props.type === 'EDIT' ? '수정' : '작성'}
        </Button>
      </div>
    </div>
  );
}
```

- `/src/components/comment/ComponentItem.tsx` 업데이트

```tsx
'use client';
import { Comment } from '@/types/types';
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

export default function CommentItem(comment: Comment) {
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
    <div className={'flex flex-col gap-8  border-b pb-5'}>
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
              <div>{comment.content}</div>
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
          />
        </div>
      )}
    </div>
  );
}
```

### 5.2. UI 개선

- `/src/components/comment/CommentEditor.tsx` 업데이트

```tsx
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
};

type Props = CreateMode | EditMode | reflyMode;

export default function CommentEditor(props: Props) {
  // mutation 활용
  const { mutate: createComment, isPending: isCreateCommentPending } =
    useCreateComment({
      onSuccess: () => {
        setContent('');
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
```

### 5.3. 대댓글 작성 기능 업데이트

- `/src/components/comment/CommentEditor.tsx`

```tsx
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
    });
  }
};
```

- Test : supabase 테이블에서 대댓글 들어간 것 확인함

## 6. Mutation 업데이트 하기

- `/src/components/comment/CommentEditor.tsx`

```tsx
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
```

## 7. 부모 댓글 아래에 자식 댓글 배치하기

- 중첩 배치
- `/src/components/comment/CommentList.tsx` 추가 업데이트

### 7.1. 리턴 받은 Comment 타입을 정렬해주는

- 1 단계

```tsx
// parent_comment_id 를 이용하여 중첩 배열 구조 만들기
import type { Comment } from '@/types/types';
function toNestedComments(connents: Comment[]) {}
```

- 2 단계

```tsx
// parent_comment_id 를 이용하여 중첩 배열 구조 만들기
import type { Comment } from '@/types/types';
function toNestedComments(connents: Comment[]): 반환할 타입[] {}
```

- 3 단계 : 중첩타입 정의 (`/src/types/types.ts`)

```ts
// 중첩 댓글 타입
// 중첩 댓글 타입
export type NestedComment = Comment & {
  parentComment?: Comment;
  children: NestedComment[]; // 재귀구조 패턴
};
```

- 4 단계 : 반환타입 적용

```tsx
// parent_comment_id 를 이용해서 중첩 배열 구조 만들기
import type { Comment, NestedComment } from '@/types/types';
function toNestedComments(comments: Comment[]): NestedComment[] {}
```

- 5 단계 : 함수 내부 작성

```tsx
function toNestedComments(comments: Comment[]): NestedComment[] {
  const result: NestedComment[] = [];
  comments.forEach(comment => {
    if (!comment.parent_comment_id) {
      // 부모 댓글이 없으면 부모 댓글로 추가
      result.push({ ...comment, children: [] });
    } else {
      // 특정 댓글에 부모가 존재하므로 대댓글
      // 부모 댓글 찾기, 중첩 반복으로 찾아냄
      const parentCommentIndex = result.findIndex(
        item => item.id === comment.parent_comment_id
      );
      // 부모인덱스를 찾았다면, 인덱스를 통해서 자식을 추가
      result[parentCommentIndex].children.push({
        ...comment,
        children: [],
        parentComment: result[parentCommentIndex],
      });
    }
  });

  return result;
}
```

- 6 단계 : 함수 활용

```tsx
'use client';
import CommentItem from '@/components/comment/CommentItem';
import { useCommentsData } from '@/hooks/queries/useCommentsData';
import FallBack from '../FallBack';
import Loader from '../Loader';

// parent_comment_id 를 이용하여 중첩 배열 구조 만들기
import type { Comment, NestedComment } from '@/types/types';

function toNestedComments(comments: Comment[]): NestedComment[] {
  const result: NestedComment[] = [];
  comments.forEach(comment => {
    if (!comment.parent_comment_id) {
      // 부모 댓글이 없으면 부모 댓글로 추가
      result.push({ ...comment, children: [] });
    } else {
      // 특정 댓글에 부모가 존재하므로 대댓글
      // 부모 댓글 찾기, 중첩 반복으로 찾아냄
      const parentCommentIndex = result.findIndex(
        item => item.id === comment.parent_comment_id
      );
      // 부모인덱스를 찾았다면, 인덱스를 통해서 자식을 추가
      result[parentCommentIndex].children.push({
        ...comment,
        children: [],
        parentComment: result[parentCommentIndex],
      });
    }
  });

  return result;
}

export default function CommentList({ postId }: { postId: number }) {
  // 활용하기
  const {
    data: comments,
    error: fetchCommentsError,
    isPending: isFetchCommentsPending,
  } = useCommentsData(postId);

  if (fetchCommentsError) return <FallBack />;
  if (isFetchCommentsPending) return <Loader />;

  // 중첩된 댓글 목록 뽑기
  const nestedCommnets = toNestedComments(comments || []);

  return (
    <div className='flex flex-col gap-5'>
      {nestedCommnets.map(comment => (
        <CommentItem key={comment.id} {...comment} />
      ))}
    </div>
  );
}
```

### 7.2. 대댓글 출력하기

- `/src/components/comment/CommentItem.tsx`
- Props 타입 변경 (`NestedComment`)

```tsx
export default function CommentItem(comment: NestedComment) {
```

```tsx
{
  /* Children 댓글 출력 */
}
{
  comment.children.map(comment => (
    <CommentItem key={comment.id} {...comment} />
  ));
}
```

```tsx
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
    <div className={'flex flex-col gap-8  border-b pb-5'}>
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
              <div>{comment.content}</div>
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
          />
        </div>
      )}
      {/* Children 댓글 출력 */}
      {comment.children.map(comment => (
        <CommentItem key={comment.id} {...comment} />
      ))}
    </div>
  );
}
```

### 7.3. UI / UX 적용하기

- `/src/components/comment/CommentItem.tsx` 업데이트

```tsx
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
              <div>{comment.content}</div>
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
          />
        </div>
      )}
      {/* Children 댓글 출력 */}
      {comment.children.map(comment => (
        <CommentItem key={comment.id} {...comment} />
      ))}
    </div>
  );
}
```

## 8. 무한 대댓글

- 대대댓글에 대해서 태그를 통해서 바로 위의 대대댓글임을 표현함.
- 자신의 `최상위 댓글의 아이디`와 `댓글의 아이디` 도 알아야함

### 8.1. 최상위 글의 아이디를 위한 칼럼 추가

- `root_comment_id` → `int8` → `NULL`
- 외래키 관계 설정
- `public` → `comments` → `root_comment_id` → `id` → `Cascade` → `Cascade` → Save

### 8.2. 타입 정의

```bash
npm run generate-types
```

### 8.3. 댓글 추가 API 수정

- `src\apis\comment.ts`

```ts
export async function createComment({
  postId,
  content,
  parentCommentId,
  rootCommentId,
}: {
  postId: number;
  content: string;
  parentCommentId?: number;
  rootCommentId?: number;
}) {
  const { data, error } = await supabase
    .from('comments')
    .insert({
      post_id: postId,
      content,
      parent_comment_id: parentCommentId,
      rootCommentId,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}
```

### 8.4. 컴포넌트 수정

- `/src/components/comment/CommentItem.tsx`

```tsx
{
  /* 대댓글 영역 */
}
{
  isReplying && (
    <div className='flex flex-col gap-2'>
      <CommentEditor
        type='REPLY'
        postId={comment.post_id}
        parentCommentId={comment.id}
        onClose={toggleReply}
        rootCommentId={comment.root_comment_id || comment.id}
      />
    </div>
  );
}
```

- `/src/components/comment/CommentEditor.tsx`

```tsx
type reflyMode = {
  type: 'REPLY';
  postId: number;
  parentCommentId: number;
  onClose: () => void;
  rootCommentId: number;
};
```

```tsx
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
```

### 8.5. 댓글 리스트 `Comment ID` 출력

- `/src/components/comment/CommentList.tsx`

```tsx
function toNestedComments(comments: Comment[]): NestedComment[] {
  const result: NestedComment[] = [];
  comments.forEach(comment => {
    if (!comment.parent_comment_id) {
      result.push({ ...comment, children: [] });
    } else {
      // 특정 댓글에 부모가 존재하므로 대댓글
      // 부모에 대한 정보를 찾아냄
      const rootCommentIndex = result.findIndex(
        item => item.id === comment.root_comment_id
      );

      // 실제 부모의 Comment 정보
      const parentComment = comments.find(
        item => item.id === comment.parent_comment_id
      );

      if (rootCommentIndex === -1) return;
      if (!parentComment) return;

      result[rootCommentIndex].children.push({
        ...comment,
        children: [],
        parentComment: result[rootCommentIndex],
      });
    }
  });

  return result;
}
```

- `/src/components/comment/CommentItem.tsx` 해시태그 출력

```tsx
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
```

