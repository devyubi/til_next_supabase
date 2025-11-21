# comments 테이블 작업

## 1. 테이블 설정

- 테이블 명 : `commnets`
- RLS : `활성화`

- 전체 테이블 컬럼 및 FK
  <img width="574" height="635" alt="Image" src="https://github.com/user-attachments/assets/9972acf2-3c53-4a96-b429-6390ae80aa0a" />

### 1.1. 컬럼 설정

- `id` : 기본대로 둠
- `created_at` : 기본대로 둠
- `content` : `text`, `Set as Empty String`, `Not Null`
- `author_id` : `uuid`, `auth.uid()` `Not Null`
- `content` : `int8`, `null`, `Not Null`

### 1.2. FK 설정

- `public` > `posts` > public.comments : `post_id` > public.posts : `id` > `Cascade` > `Cascade` > 저장

- `public` > `profiles` > public.comments : `author_id` > public.profiles : `id` > `Cascade` > `Cascade` > 저장

### 1.3. RLS 설정

- `Authentication` > `Policies` > `comments` > Create Policy 버튼

- `Anyone can select comment` > `SELECT` > `Default` > `true` > 저장버튼
- `Users can insert comment` > `INSERT` > `authnicated` > `(select auth.uid()) = author_id` > 저장버튼
- `Users can update comment` > `UPDATE` > `authnicated` > `(select auth.uid()) = author_id` > `(select auth.uid()) = author_id` > 저장버튼
- `Users can delete comment` > `DELETE` > `authnicated` > `(select auth.uid()) = author_id` > 저장버튼

## 2. 타입 생성

- Supabase 로그인 후 진행

```bash
npx supabase login
npm run generate-types
```

### 3. 타입 정리

- `/src/types/types.ts`

```ts
export type CommentEntity = Database['public']['Tables']['comments']['Row'];
export type InsertCommentEntity =
  Database['public']['Tables']['comments']['Insert'];
export type UpdateCommentEntity =
  Database['public']['Tables']['comments']['Update'];
export type CommentTableEntity = Database['public']['Tables']['comments'];
```

## 4. 댓글 저장하기

- `/src/components/comment/CommentEditor.tsx`

### 4.1. 컴포넌트 상태관리

```tsx
'use client';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function CommentEditor() {
  const [content, setContent] = useState('');
  const handleSaveComment = () => {
    if (content.trim() === '') return;
    // 요청을 보내서 Insert 진행함.
  };
  return (
    <div className='flex flex-col gap-2'>
      <Textarea value={content} onChange={e => setContent(e.target.value)} />
      <div className='flex justify-end'>
        <Button onClick={handleSaveComment}>작성</Button>
      </div>
    </div>
  );
}
```

### 4.2. API 만들기

- `/src/apis/comment.ts 파일` 생성

```ts
import supabase from '@/lib/supabase/client';

// 1. 댓글 추가하기
export async function createComment({
  postId,
  content,
}: {
  postId: number;
  content: string;
}) {
  const { data, error } = await supabase
    .from('comments')
    .insert({ post_id: postId, content })
    .select()
    .single();
  if (error) throw error;
  return data;
}
```

### 4.3. Mutation 만들기

- `/src/hooks/mutation/comment 폴더` 생성
- `/src/hooks/mutation/comment/useCreateComment.ts 파일` 생성

```ts
import { createComment } from '@/apis/comment';
import { UseMutationCallback } from '@/types/types';
import { useMutation } from '@tanstack/react-query';

export default function useCreateComment(callback?: UseMutationCallback) {
  return useMutation({
    mutationFn: createComment,
    onSuccess: () => {
      if (callback?.onSuccess) callback.onSuccess();
    },
    onError: error => {
      if (callback?.onError) callback.onError(error);
    },
  });
}
```

### 4.4. 활용하기

- props 추가 : 포스트의 아이디

```tsx
export default function CommentEditor({ postId }: { postId: number }) {
```

- mutation 활용

```tsx
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
```

- 전송하기

```tsx
const handleSaveComment = () => {
  if (content.trim() === '') return;
  // 요청을 보내서 Insert 진행함.
  createComment({ postId, content });
};
```

- 연속 등록 방지

```tsx
<div className='flex flex-col gap-2'>
  <Textarea
    value={content}
    onChange={e => setContent(e.target.value)}
    disabled={isCreateCommentPending}
  />
  <div className='flex justify-end'>
    <Button onClick={handleSaveComment} disabled={isCreateCommentPending}>
      {isCreateCommentPending ? '등록중...' : '작성'}
    </Button>
  </div>
</div>
```

- 전체코드

```tsx
'use client';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import useCreateComment from '@/hooks/mutations/comment/useCreateComment';
import { toast } from 'sonner';

export default function CommentEditor({ postId }: { postId: number }) {
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
  const [content, setContent] = useState('');
  const handleSaveComment = () => {
    if (content.trim() === '') return;
    // 요청을 보내서 Insert 진행함.
    createComment({ postId, content });
  };
  return (
    <div className='flex flex-col gap-2'>
      <Textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        disabled={isCreateCommentPending}
      />
      <div className='flex justify-end'>
        <Button onClick={handleSaveComment} disabled={isCreateCommentPending}>
          {isCreateCommentPending ? '등록중...' : '작성'}
        </Button>
      </div>
    </div>
  );
}
```

### 4.5. page 에서 props 전달하기 적용

- `/src/app/(protected)/post/[id]/page.tsx`
- 변경내용

```tsx
<CommentEditor postId={Number(id)} />
```

- 전체코드

```tsx
import CommentEditor from '@/components/comment/CommentEditor';
import CommentList from '@/components/comment/CommentList';
import PostItem from '@/components/post/PostItem';
import { redirect } from 'next/navigation';

interface PostDetailPageProps {
  params: {
    id: string;
  };
}

async function PostDetailPage({ params }: PostDetailPageProps) {
  const { id } = await params;
  if (!id || id.trim() === '') {
    redirect('/');
  }

  return (
    <div className='flex flex-col gap-5'>
      <PostItem postId={Number(id)} type='DETAIL' />
      <CommentEditor postId={Number(id)} />
      <CommentList />
    </div>
  );
}

export default PostDetailPage;
```

## 5. 댓글 조회하기

### 5.1. 댓글 조회하기

- `/src/apis/comment.ts` 추가

```ts
// 2. 댓글 조회하기
export async function fetchComments(postId: number) {
  const { data, error } = await supabase
    .from('comments')
    .select('*, author: profiles!author_id(*)')
    .eq('post_id', postId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}
```

### 5.2. Query 키 관리

- `/src/lib/constants.ts`

```ts
// 쿼리키 팩토링 상수

export const QUERY_KEYS = {
 ...,
  // 댓글 useQuery 키 생성 및 관리
  comments: {
    all: ['comments'],
    post: (postId: number) => ['comments', 'post', postId],
  },
};
...
```

- 전체코드

```ts
// 쿼리키 팩토링 상수

export const QUERY_KEYS = {
  // 프로필 useQuery 키 생성 및 관리
  profile: {
    all: ['profile'],
    list: ['profile', 'list'],
    byId: (userId: string) => ['profile', 'byId', userId],
  },
  // 포스트 useQuery 키 생성 및 관리
  posts: {
    all: ['posts'],
    list: ['posts', 'list'],
    byId: (postId: number) => ['posts', 'byId', postId],
    // 추가됨
    userList: (userId: string) => ['posts', 'userList', userId],
  },
  // 댓글 useQuery 키 생성 및 관리
  comments: {
    all: ['comments'],
    post: (postId: number) => ['comments', 'post', postId],
  },
};

// 버킷 이름 : Supabase 저장소
export const BUCKET_NAME = 'uploads';

// const session = useSession();

// export const userId = session!.user.id;
```

### 5.3. Query 생성

- `/src/hooks/queries/useCommentsData.ts 파일` 생성

```ts
import { QUERY_KEYS } from '@/lib/constants';
import { useQuery } from '@tanstack/react-query';
import { fetchComments } from '@/apis/comment';

export function useCommentsData(postId: number) {
  return useQuery({
    queryKey: QUERY_KEYS.comments.post(postId),
    queryFn: async () => fetchComments(postId),
  });
}
```

### 5.4. 활용하기

- `/src/app/(protected)/post/[id]/page.tsx`

```tsx
<CommentList postId={Number(id)} />
```

- `src\components\comment\CommentList.tsx` Props 처리

```tsx
export default function CommentList({ postId }: { postId: number }) {
```

- 활용하기

```tsx
// 활용하기
const {
  data: comments,
  error: fetchCommentsError,
  isPending: isFetchCommentsPending,
} = useCommentsData(postId);
```

- 전체코드

```tsx
'use client';
import CommentItem from '@/components/comment/CommentItem';
import { useCommentsData } from '@/hooks/queries/useCommentsData';
import FallBack from '../FallBack';
import Loader from '../Loader';

export default function CommentList({ postId }: { postId: number }) {
  // 활용하기
  const {
    data: comments,
    error: fetchCommentsError,
    isPending: isFetchCommentsPending,
  } = useCommentsData(postId);

  if (fetchCommentsError) return <FallBack />;
  if (isFetchCommentsPending) return <Loader />;

  return (
    <div className='flex flex-col gap-5'>
      {comments?.map(comment => (
        <CommentItem key={comment.id} {...comment} />
      ))}
    </div>
  );
}
```

### 5.5. Comment 타입과 Profile 타입 조합

- `/src/types/types.ts` 추가

```ts
// 댓글과 프로필 타입 조합
export type Comment = CommentEntity & {
  author: ProfileEntity;
};
```

### 5.6. 개별 아이템에 각 내용 출력

```tsx
import { Comment } from '@/types/types';
import defaultAvatar from '/public/assets/icons/default-avatar.jpg';
import Image from 'next/image';
import Link from 'next/link';
import { formatTimeAgo } from '@/lib/time';

export default function CommentItem(comment: Comment) {
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
          <div>{comment.content}</div>
          <div className='text-muted-foreground flex justify-between text-sm'>
            <div className='flex items-center gap-2'>
              <div className='cursor-pointer hover:underline'>댓글</div>
              <div className='bg-border h-[13px] w-0.5'></div>
              <div>{formatTimeAgo(comment.created_at)}</div>
            </div>
            <div className='flex items-center gap-2'>
              <div className='cursor-pointer hover:underline'>수정</div>
              <div className='bg-border h-[13px] w-0.5'></div>
              <div className='cursor-pointer hover:underline'>삭제</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## 6. 댓글 수정하기

- `/src/components/comment/CommentItem.tsx` 업데이트

### 6.1. 작성자만 수정이 가능하도록 처리

```tsx
'use client';
```

```tsx
const session = useSession();
const isMine = session?.user.id === comment.author.id;
```

```tsx
{
  isMine && (
    <>
      <div className='cursor-pointer hover:underline'>수정</div>
      <div className='bg-border h-[13px] w-0.5'></div>
      <div className='cursor-pointer hover:underline'>삭제</div>
    </>
  );
}
```

### 6.2. 수정 버튼 클릭시 수정 영역 출력하기

```tsx
const [iseEditing, setIsEditing] = useState(false);
const toggleEditing = () => {
  setIsEditing(prev => !prev);
};
```

```tsx
{
  iseEditing ? (
    <>
      <CommentEditor postId={comment.post_id} />
    </>
  ) : (
    <>
      <div>{comment.content}</div>
    </>
  );
}
```

```tsx
{
  isMine && (
    <>
      <div className='cursor-pointer hover:underline' onClick={toggleEditing}>
        수정
      </div>
      <div className='bg-border h-[13px] w-0.5'></div>
      <div className='cursor-pointer hover:underline'>삭제</div>
    </>
  );
}
```

- 전체코드

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

export default function CommentItem(comment: Comment) {
  const session = useSession();

  const [iseEditing, setIsEditing] = useState(false);
  const toggleEditing = () => {
    setIsEditing(prev => !prev);
  };

  const isMine = session?.user.id === comment.author.id;

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
              <CommentEditor postId={comment.post_id} />
            </>
          ) : (
            <>
              <div>{comment.content}</div>
            </>
          )}

          <div className='text-muted-foreground flex justify-between text-sm'>
            <div className='flex items-center gap-2'>
              <div className='cursor-pointer hover:underline'>댓글</div>
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
                  <div className='cursor-pointer hover:underline'>삭제</div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 6.3. 댓글 수정 기능

- `/src/components/comment/CommentEditor.tsx` 업데이트

```tsx
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
type Props = CreateMode | EditMode;
```

```tsx
export default function CommentEditor(props: Props) {
```

- `CommentItem.tsx 에서 props 를 CommentEditor 에 전달하도록 추가`

```tsx
const handleSaveComment = () => {
  if (content.trim() === '') return;
  // 요청을 보내서 Insert 진행함.
  if (props.type === 'CREATE') {
    createComment({ postId: props.postId, content });
  } else {
    // update 실행
  }
};
```

- `src\components\post\PostItem.tsx` 수정

```tsx
{
  iseEditing ? (
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
  );
}
```

- `src\app\(protected)\post\[id]\page.tsx` 업데이트

```tsx
import CommentEditor from '@/components/comment/CommentEditor';
import CommentList from '@/components/comment/CommentList';
import PostItem from '@/components/post/PostItem';
import { redirect } from 'next/navigation';

interface PostDetailPageProps {
  params: {
    id: string;
  };
}

async function PostDetailPage(props: PostDetailPageProps) {
  const params = await props.params;
  const { id } = params;
  if (!id || id.trim() === '') {
    redirect('/');
  }

  return (
    <div className='flex flex-col gap-5'>
      <PostItem postId={Number(id)} type='DETAIL' />
      <CommentEditor type='CREATE' postId={Number(id)} />
      <CommentList postId={Number(id)} />
    </div>
  );
}

export default PostDetailPage;
```

- `src\components\comment\commentEditor.tsx` 업데이트

```tsx
// 초기에 EDIT 이라면 내용 출력
useEffect(() => {
  if (props.type === 'EDIT') {
    setContent(props.initialContent);
  }
}, []);
```

### 6.4. 업데이트 API 작성하기

- `/src\apis\comment.ts` 추가

```ts
// 3. 댓글 수정하기
export async function updateComment({
  id,
  content,
}: {
  id: number;
  content: string;
}) {
  const { data, error } = await supabase
    .from('comments')
    .update({ content })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
```

### 6.5. Mutation 작성하기

- `/src/hooks/mutations/comment/useUpdateComment.ts 파일` 생성

```ts
import { updateComment } from '@/apis/comment';
import { UseMutationCallback } from '@/types/types';
import { useMutation } from '@tanstack/react-query';

export default function useUpdateComment(callback?: UseMutationCallback) {
  return useMutation({
    mutationFn: updateComment,
    onSuccess: () => {
      if (callback?.onSuccess) callback.onSuccess();
    },
    onError: error => {
      if (callback?.onError) callback.onError(error);
    },
  });
}
```

### 6.6. 활용하기

- `src\components\comment\commentEditor.tsx` 업데이트

```tsx
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
```

```tsx
const handleSaveComment = () => {
  if (content.trim() === '') return;
  // 요청을 보내서 Insert 진행함.
  if (props.type === 'CREATE') {
    createComment({ postId: props.postId, content });
  } else {
    // update 실행
    updateComment({ id: props.commentId, content });
  }
};
```

### 6.7. 취소버튼 추가하기

- `src\components\comment\commentEditor.tsx` 업데이트

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
type Props = CreateMode | EditMode;

export default function CommentEditor(props: Props) {
  ...

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
          {isPending ? '등록중...' : '작성'}
        </Button>
      </div>
    </div>
  );
}
```

- 전체 코드

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
type Props = CreateMode | EditMode;

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
    } else {
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
          {isPending ? '등록중...' : '작성'}
        </Button>
      </div>
    </div>
  );
}
```

- 로딩 처리

```tsx
const isPending = isCreateCommentPending || isUpdateCommentPending;

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
```

## 7. 댓글 삭제하기

### 7.1. API 만들기

- `src\apis\comment.ts` 추가

```ts
// 4. 댓글 삭제하기
export async function deleteComment(id: number) {
  const { data, error } = await supabase
    .from('comments')
    .delete()
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
```

### 7.2. Mutation 만들기

- `src\hooks\mutations\comment\useDeleteComment.ts 파일` 생성

```ts
import { deleteComment } from '@/apis/comment';
import { UseMutationCallback } from '@/types/types';
import { useMutation } from '@tanstack/react-query';

export default function useDeleteComment(callback?: UseMutationCallback) {
  return useMutation({
    mutationFn: deleteComment,
    onSuccess: () => {
      if (callback?.onSuccess) callback.onSuccess();
    },
    onError: error => {
      if (callback?.onError) callback.onError(error);
    },
  });
}
```

### 7.3. 활용하기

- `src\components\comment\CommentItem.tsx` 업데이트

```tsx
// 삭제 mutation 활용하기
const { mutate: deleteComment, isPending: isDeleteCommentPending } =
  useDeleteComment({
    onSuccess: () => {},
    onError: error => {
      toast.error('댓글 삭제에 실패했습니다.', { position: 'top-center' });
    },
  });
```

- 얼라트창 띄우기

```tsx
const openAlertModal = useOpenAlertModal();
```

```tsx
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
```

```tsx
{
  isMine && (
    <>
      <div className='cursor-pointer hover:underline' onClick={toggleEditing}>
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
  );
}
```

## 8. 댓글 생성 캐시 관리

- `/src/hooks/mutations/comment/useCreateComment.ts` 업데이트

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

          return [{ ...newComment, author: profile }, ...comments];
        }
      );
    },
    onError: error => {
      if (callback?.onError) callback.onError(error);
    },
  });
}
```

## 9. 댓글 수정 캐시 관리

- `/src/hooks/mutations/comment/useUpdateComment.ts` 업데이트

```ts
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
```

## 10. 댓글 삭제 캐시 관리

- `/src/hooks/mutations/comment/useDeleteComments.ts` 업데이트

```ts
import { deleteComment } from '@/apis/comment';
import { QUERY_KEYS } from '@/lib/constants';
import { Comment, UseMutationCallback } from '@/types/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function useDeleteComment(callback?: UseMutationCallback) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteComment,
    // 삭제 성공된 리턴 결과를 자동 매개변수로 전달
    onSuccess: deletedComment => {
      if (callback?.onSuccess) callback.onSuccess();

      queryClient.setQueryData<Comment[]>(
        QUERY_KEYS.comments.post(deletedComment.post_id),
        comments => {
          if (!comments)
            throw new Error('댓글이 캐시데이터에 보관되어있지 않습니다.');
          return comments.filter(comment => comment.id !== deletedComment.id);
        }
      );
    },
    onError: error => {
      if (callback?.onError) callback.onError(error);
    },
  });
}
```

## 11. UI 마무리하기
