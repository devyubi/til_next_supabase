# 댓글 UI

- `/src/components/post/PostItem.tsx` 업데이트

## 1. 포스트 리스트 아이템 클릭 시 상세페이지로 이동

- 내용을 클릭 시 상세페이지(PostDetail)로 이동하기

```tsx
<Link href={`/post/${post.id}`}>
  <div className='line-clamp-2 break-words whitespace-pre-wrap'>
    {post.content}
  </div>
</Link>
```

### 1.2. 댓글달기 버튼 클릭 시에도 상세페이지로 이동처리

- `/src/components/post/PostItem.tsx`

```tsx
<Link href={`/post/${post.id}`}>
  <div className='hover:bg-muted flex cursor-pointer items-center gap-2 rounded-xl border-1 p-2 px-4 text-sm'>
    <MessageCircle className='h-4 w-4' />
    <span>댓글 달기</span>
  </div>
</Link>
```

- 수정된 전체 코드

```tsx
'use client';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { usePostByIdData } from '@/hooks/queries/usePostByIdData';
import { formatTimeAgo } from '@/lib/time';
import { useSession } from '@/stores/session';
import { MessageCircle } from 'lucide-react';
import Image from 'next/image';
import FallBack from '../FallBack';
import Loader from '../Loader';
import DeletePostButton from './DeletePostButton';
import EditPostItemButton from './EditPostItemButton';
import LikeButton from './LikeButton';
import defaultAvatar from '/public/assets/icons/default-avatar.jpg';
import Link from 'next/link';

export default function PostItem({ postId }: { postId: number }) {
  // 내가 만든 post 인지 확인
  const session = useSession();
  const userId = session?.user.id;
  // 실제 쿼리로 id 를 전달해서 post를 가져오자.
  const {
    data: post,
    isPending,
    error,
  } = usePostByIdData({ postId, type: 'FEED' });

  if (isPending) return <Loader />;
  if (error) return <FallBack />;

  const isMine = userId === post.author.id;

  return (
    <div className='flex flex-col gap-4 border-b pb-8'>
      <div className='flex justify-between'>
        <div className='flex items-start gap-4'>
          {/* 사용자 페이지 이동하기 */}
          <Link href={`/profile/${post.author.id}`}>
            <Image
              src={post.author.avatar_url || defaultAvatar}
              alt={`${post.author.nickname}의 프로필 이미지`}
              className='h-10 w-10 rounded-full object-cover'
              width={40}
              height={40}
            />
          </Link>
          <div>
            <div className='font-bold hover:underline'>
              <Link href={`/profile/${post.author.id}`}>
                {post.author.nickname}
              </Link>
            </div>
            <div className='text-muted-foreground text-sm'>
              {formatTimeAgo(post.created_at)}
              {/* {new Date(post.created_at).toLocaleString()} */}
            </div>
          </div>
        </div>

        <div className='text-muted-foreground flex text-sm'>
          {isMine && (
            <>
              <EditPostItemButton {...post} />
              <DeletePostButton id={post.id} />
            </>
          )}
        </div>
      </div>

      <Link href={`/post/${post.id}`}>
        <div className='line-clamp-2 break-words whitespace-pre-wrap'>
          {post.content}
        </div>
      </Link>
      <div className='flex cursor-pointer flex-col gap-5'>
        <Carousel>
          <CarouselContent>
            {post.image_urls?.map((url, index) => (
              <CarouselItem className={`basis-3/5`} key={index}>
                <div className='overflow-hidden rounded-xl'>
                  <img
                    src={url}
                    className='h-full max-h-[350px] w-full object-cover'
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      <div className='flex gap-2'>
        <LikeButton
          id={post.id}
          likeCount={post.like_count}
          isLiked={post.isLiked}
        />
        <Link href={`/post/${post.id}`}>
          <div className='hover:bg-muted flex cursor-pointer items-center gap-2 rounded-xl border-1 p-2 px-4 text-sm'>
            <MessageCircle className='h-4 w-4' />
            <span>댓글 달기</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
```

## 2. 상세 화면 UI

- `/src/app/(protected)/post/[id]/page.tsx`

```tsx
import PostItem from '@/components/post/PostItem';
import { redirect } from 'next/navigation';

interface PostDetailProps {
  params: {
    id: string;
  };
}
async function PostDetail({ params }: PostDetailProps) {
  const { id } = await params;

  if (!id || id.trim() === '') {
    redirect('/');
  }

  return (
    <div>
      <PostItem postId={Number(id)} />
    </div>
  );
}

export default PostDetail;
```

## 3. 새로고침 시 캐시 적용하기

- 상세화면에서 렌더링 되는 경우에만.
- 캐시데이터 말고 서버에서 직접 불러오기 적용

- `/src/components/post/PostItem.tsx` 업데이트

### 3.1. PostItem 에 Props 추가

```tsx
export default function PostItem({
  postId,
  type,
}: {
  postId: number;
  type: 'FEED' | 'DETAIL';
}) {
  // 내가 만든 post 인지 확인
  const session = useSession();
  const userId = session?.user.id;
  // 실제 쿼리로 id 를 전달해서 post를 가져오자.
  const { data: post, isPending, error } = usePostByIdData({ postId, type }); // type 을 외부로부터 전달 받도록 구성
```

- `/src/app/(protected)/post/[id]/page.tsx`

```tsx
return (
  <div>
    <PostItem postId={Number(id)} type={'DETAIL'} />
  </div>
);
```

- `/src/components/post/PostFeed.tsx` 타입 추가로 인한 PostFeed 업데이트

```tsx
<PostItem key={postId} postId={postId} type={'FEED'} />
```

## 4. Props 의 type 값에 따른 UI 적용

- `/src/components/post/PostItem.tsx` 업데이트

```tsx
    <div
      className={`flex flex-col gap-4  pb-8 ${type === 'FEED' && 'border-b'}`}
    >
```

```tsx
<div className='flex cursor-pointer flex-col gap-5'>
        {type === 'FEED' ? (
          <Link href={`/post/${post.id}`}>
            <div className='line-clamp-2 break-words whitespace-pre-wrap'>
              {post.content}
            </div>
          </Link>
        ) : (
          <div className='break-words whitespace-pre-wrap'>{post.content}</div>
        )}
```

- 전체 PostItem.tsx

```tsx
'use client';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { usePostByIdData } from '@/hooks/queries/usePostByIdData';
import { formatTimeAgo } from '@/lib/time';
import { useSession } from '@/stores/session';
import { MessageCircle } from 'lucide-react';
import Image from 'next/image';
import FallBack from '../FallBack';
import Loader from '../Loader';
import DeletePostButton from './DeletePostButton';
import EditPostItemButton from './EditPostItemButton';
import LikeButton from './LikeButton';
import defaultAvatar from '/public/assets/icons/default-avatar.jpg';
import Link from 'next/link';

export default function PostItem({
  postId,
  type,
}: {
  postId: number;
  type: 'FEED' | 'DETAIL';
}) {
  const session = useSession();
  const userId = session?.user.id;
  const {
    data: post,
    isPending,
    error,
    // } = usePostByIdData({ postId, type: 'FEED' });

    // type 을 외부로 부터 전달 받도록 구성
  } = usePostByIdData({ postId, type: type });

  if (isPending) return <Loader />;
  if (error) return <FallBack />;

  const isMine = userId === post.author.id;

  return (
    <div
      className={`flex flex-col gap-4  pb-8 ${type === 'FEED' && 'border-b'}`}
    >
      <div className='flex justify-between'>
        <div className='flex items-start gap-4'>
          {/* 사용자 페이지 이동하기 */}
          <Link href={`/profile/${post.author.id}`}>
            <Image
              src={post.author.avatar_url || defaultAvatar}
              alt={`${post.author.nickname}의 프로필 이미지`}
              className='h-10 w-10 rounded-full object-cover'
              width={40}
              height={40}
            />
          </Link>
          <div>
            <div className='font-bold hover:underline'>
              <Link href={`/profile/${post.author.id}`}>
                {post.author.nickname}
              </Link>
            </div>
            <div className='text-muted-foreground text-sm'>
              {formatTimeAgo(post.created_at)}
              {/* {new Date(post.created_at).toLocaleString()} */}
            </div>
          </div>
        </div>

        <div className='text-muted-foreground flex text-sm'>
          {isMine && (
            <>
              <EditPostItemButton {...post} />
              <DeletePostButton id={post.id} />
            </>
          )}
        </div>
      </div>

      <div className='flex cursor-pointer flex-col gap-5'>
        {type === 'FEED' ? (
          <Link href={`/post/${post.id}`}>
            <div className='line-clamp-2 break-words whitespace-pre-wrap'>
              {post.content}
            </div>
          </Link>
        ) : (
          <div className='break-words whitespace-pre-wrap'>{post.content}</div>
        )}

        <Carousel>
          <CarouselContent>
            {post.image_urls?.map((url, index) => (
              <CarouselItem className={`basis-3/5`} key={index}>
                <div className='overflow-hidden rounded-xl'>
                  <img
                    src={url}
                    className='h-full max-h-[350px] w-full object-cover'
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      <div className='flex gap-2'>
        <LikeButton
          id={post.id}
          likeCount={post.like_count}
          isLiked={post.isLiked}
        />
        <Link href={`/post/${post.id}`}>
          <div className='hover:bg-muted flex cursor-pointer items-center gap-2 rounded-xl border-1 p-2 px-4 text-sm'>
            <MessageCircle className='h-4 w-4' />
            <span>댓글 달기</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
```

## 5. Comment 컴포넌트 만들기

- `/src/components/comment 폴더` 생성
- `/src/components/comment/CommentEditor.tsx 파일` 생성

### 5.1. Editor

```tsx
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export default function CommentEditor() {
  return (
    <div className='flex flex-col gap-2'>
      <Textarea />
      <div className='flex justify-end'>
        <Button>작성</Button>
      </div>
    </div>
  );
}
```

### 5.2. Item

- `/src/components/comment/CommentItem.tsx 파일` 생성

```tsx
import defaultAvatar from '/public/assets/icons/default-avatar.jpg';
import Image from 'next/image';
import Link from 'next/link';

export default function CommentItem() {
  return (
    <div className={'flex flex-col gap-8  border-b pb-5'}>
      <div className='flex items-start gap-4'>
        <Link href={'#'}>
          <div className='flex h-full flex-col'>
            <Image
              className='h-10 w-10 rounded-full object-cover'
              src={defaultAvatar}
              width={40}
              height={40}
              alt='사용자아바타'
            />
          </div>
        </Link>
        <div className='flex w-full flex-col gap-2'>
          <div className='font-bold'>작성자의 이름</div>
          <div>댓글 컨텐츠</div>
          <div className='text-muted-foreground flex justify-between text-sm'>
            <div className='flex items-center gap-2'>
              <div className='cursor-pointer hover:underline'>댓글</div>
              <div className='bg-border h-[13px] w-[2px]'></div>
              <div>10분 전</div>
            </div>
            <div className='flex items-center gap-2'>
              <div className='cursor-pointer hover:underline'>수정</div>
              <div className='bg-border h-[13px] w-[2px]'></div>
              <div className='cursor-pointer hover:underline'>삭제</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 5.3. List

- `/src/components/comment/CommentList.tsx 파일` 생성

```tsx
import CommentItem from '@/components/comment/CommentItem';

export default function CommentList() {
  return (
    <div className='flex flex-col gap-5'>
      <CommentItem />
      <CommentItem />
      <CommentItem />
    </div>
  );
}
```

### 5.4. 배치하기

- `/src/app/(protected)/post/[id]/page.tsx` 업데이트

```tsx
import CommentEditor from '@/components/comment/CommentEditor';
import CommentList from '@/components/comment/CommentList';
import PostItem from '@/components/post/PostItem';
import { redirect } from 'next/navigation';

interface PostDetailProps {
  params: {
    id: string;
  };
}
async function PostDetail({ params }: PostDetailProps) {
  const { id } = await params;

  if (!id || id.trim() === '') {
    redirect('/');
  }

  return (
    <div>
      <PostItem postId={Number(id)} type={'DETAIL'} />
      <div className='text-xl font-bold pb-3.5'> 댓글 </div>
      <CommentEditor />
      <CommentList />
    </div>
  );
}

export default PostDetail;
```

## 6. 기능 테스트

### 6.1. 포스트 수정 기능 정상

### 6.2. 포스트 삭제 기능 수정하기

- 삭제 시 `/` 로 이동 처리
- `/src/components/post/DeletePostButton.tsx` 업데이트

```tsx
import { Button } from '@/components/ui/button';
import { useDeletePost } from '@/hooks/mutations/post/useDeletePost';
import { useOpenAlertModal } from '@/stores/alertModalStore';
import { redirect, useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function DeletePostButton({ id }: { id: number }) {
  const openAlertModal = useOpenAlertModal();
  const router = useRouter();

  const { mutate: deletePost, isPending: isDeletePostPending } = useDeletePost({
    onSuccess: () => {
      // 현재 웹브라우저의 URI 를 읽어들이고, 만약 경로에 /post/아이디 가 있다면 상세페이지로 판단하고 '/' 경로로 이동함
      const pathName = window.location.pathname;
      if (pathName.includes(`/post/${id}`)) {
        router.push('/');
      } else {
        router.refresh();
      }
    },
    onError: error => {
      toast.error('포스트 삭제에 실패하였습니다.', {
        position: 'top-center',
      });
    },
  });

  const handleDeleteClick = () => {
    openAlertModal({
      title: '게시글 삭제',
      description: '삭제된 포스트는 되돌릴 수 없습니다. 정말 삭제하시겠습니까?',
      onPositive: () => {
        // 포스트 삭제 요청
        deletePost(id);
      },
    });
  };
  return (
    <Button
      disabled={isDeletePostPending}
      className='cursor-pointer'
      variant={'ghost'}
      onClick={handleDeleteClick}
    >
      삭제
    </Button>
  );
}
```

