# 데이터 캐싱 실습

## 1. 상세 페이지

- `/src/app/todo-detail 폴더` 생성
- `/src/app/todo-detail/[id] 폴더` 생성
- `/src/app/todo-detail/[id]/page.tsx 파일` 생성

```tsx
type TodoDetailPage = {
  params: Promise<{ id: number }>;
};

export default async function TodoDetailPage({ params }: TodoDetailPage) {
  const { id } = await params;
  return <div>{id} : 상세페이지</div>;
}
```

## 2. 링크 걸기

- `/src/components/todo/TodoItem.tsx` 업데이트

```tsx
'use client';
import Link from 'next/link';
import { Button } from '../ui/button';

export default function TodoItem({
  id,
  content,
}: {
  id: number;
  content: string;
}) {
  const handleDeleteClick = () => {};

  return (
    <div className='flex items-center justify-between border p-2'>
      {/* 링크걸기 */}
      <Link href={`/todo-detail/${id}`}>{content}</Link>

      <Button onClick={handleDeleteClick} variant={'destructive'}>
        삭제
      </Button>
    </div>
  );
}
```

## 3. API 만들기

- `/src/apis/todos.ts` : api 추가 업데이트

```ts
// API 함수로 1개의 id 를 전달 받아서 상세 내용 불러들이기 기능
export async function fetchTodoById(id: number) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL_DEMO}/todos/${id}`
  );
  if (!response.ok) throw new Error('상세 데이터가 없습니다.');
  const data: Todo = await response.json();
  return data;
}
```

## 4. query hook 만들기

- `/src/hooks/todos/queries/useTodoDataById.ts 파일` 생성

```ts
import { fetchTodoById } from '@/apis/todo';
import { useQuery } from '@tanstack/react-query';

export function useTodoDataById(id: number) {
  return useQuery({
    queryKey: ['todos', id],
    queryFn: () => fetchTodoById(id),
  });
}
```

## 5. 활용하기

- `/src/components/todo/TodoDetail.tsx 파일` 생성

```tsx
'use client';

import { useTodoDataById } from '@/hooks/todos/queries/useTodoDataById';

type TodoDetailProps = {
  id: number;
};

const TodoDetail = ({ id }: TodoDetailProps) => {
  const { data, isLoading, error } = useTodoDataById(id);
  if (isLoading) return <div>로딩 중 ...</div>;
  if (error) return <div>Error. {error.message}</div>;
  if (!data) return <div>자료가 존재하지 않습니다.</div>;

  return <div>TodoDetail : {data.title}</div>;
};

export default TodoDetail;
```

- `/src/app/todo-detail/[id]/page.tsx` 업데이트

```tsx
import TodoDetail from '@/components/todo/TodoDetail';

type TodoDetailPage = {
  params: Promise<{ id: number }>;
};

export default async function TodoDetailPage({ params }: TodoDetailPage) {
  const { id } = await params;
  return <TodoDetail id={id} />;
}
```

## 6. 데이터캐싱 확인해보기

- Devtools 를 활용
- 처음에는 `stale` 상태이다.
- 이유는 기본 `staleTime` 이 `0` 으로 글로벌 셋팅되어있다.
- 컴포넌트가 화면에 Mount 가 되면 `stale` 상태면 `Refetching` 으로 데이터 호출함
- 웹브라우저의 WindowFocus가 되면 `stale` 상태면 `Refetching` 으로 데이터 호출함
- 네트워크가 끊겼다가 연결(Reconnect) 되면 `stale` 상태면 `Refetching` 으로 데이터 호출함
- 옵션으로 refetchInterval 를 초 단위로 지정하게되면, `stale` 상태라면 `Refetching` 으로

### 6.1. refetching 끄기 옵션

- /src/hooks/todos/queries/useTodoDataById.ts

```ts
import { fetchTodoById } from '@/apis/todo';
import { useQuery } from '@tanstack/react-query';

export function useTodoDataById(id: number) {
  return useQuery({
    queryKey: ['todos', id],
    queryFn: () => fetchTodoById(id),
    // 1초마다 리패칭
    // refetchInterval : 1000,
    refetchOnMount: false, // 마운트 시점에 리패칭 끄기
    refetchOnWindowFocus: false, // 윈도우 포커스 시점에 리패칭 끄기
    refetchOnReconnect: false, // 리커넥트 시점에 리패칭 끄기
    refetchInterval: false, // interval 리패칭 끄기
  });
}
```

### 6.2. staleTime 옵션 이해하기

- /src/hooks/todos/queries/useTodoDataById.ts

```ts
import { fetchTodoById } from '@/apis/todo';
import { useQuery } from '@tanstack/react-query';

export function useTodoDataById(id: number) {
  return useQuery({
    queryKey: ['todos', id],
    queryFn: () => fetchTodoById(id),
    // 5초동안 fresh 유효기간
    staleTime: 5000,
  });
}
```

- stale 한 데이터의 역할은 일단 화면에 내용을 빠르게 출력을 해주는 역할
- refetching 이 끝나면, 새로운 데이터를 출력시켜줌
- 일단 캐싱된 데이터를 사용해서 빠르게 화면을 렌더링하고, 최신 데이터를 불러오는 리패칭 과정이 마무리 되면 그때 교체하는 방식임.

### 6.3. Refetching 4가지

- 전제 조건은 해당하는 캐시 데이터가 `stale` 상태일 때 아래 실행됨.

- Mount : 해당하는 캐시 데이터를 사용하는 컴포넌트가 마운트 될 때
- WindowFocus : 사용자가 현재 탭으로 돌아올 때
- Reconnect : 인터넷 연결이 끊어졌다가 다시 연결 될 때
- Interval : 특정 시간을 주기로

## 7. 데이터캐싱 inactive 와 deleted 상태

- 전제 조건이 다른 화면에 있을 때
- 컴포넌트가 unMount 가 된 경우 진행됨

### 7.1. inactive 상태

- 전제 조건은 `다른 화면에 있을 때` 임 (위 내용과 동일)

- fresh 상태에서 inactive 상태 가능
- stale 상태에서 inactive 상태 가능
- gcTime 값이 안지나면 계속 inactive 상태

### 7.2. deleted 상태

- 전제 조건이 다른 화면에 있을 때
- gcTime 값이 지나면 자동으로 deleted 시켜버림

- /src/hooks/todos/queries/useTodoDataById.ts

```ts
import { fetchTodoById } from '@/apis/todo';
import { useQuery } from '@tanstack/react-query';

export const useTodoDataById = (id: number) => {
  return useQuery({
    queryKey: ['todo', id],
    queryFn: () => fetchTodoById(id),

    // 5초동안 fresh 유효기간
    staleTime: 5000,

    // 10 초동안 inactive 유효기간
    gcTime: 10000,
  });
};
```

## 8. 모든 옵션은 글로벌, 개별 설정 가능

- 우선은 글로벌 적용되고, 개별 설정이 적용됨.
- 추천하는 글로벌 세팅
- `/src/components/providers/QueryProvider.tsx`

```tsx
/*
QueryClient 를 App 전체에 제공함
- 모든 하위 컴포넌트에서 useQuery, useMutaion 등의 훅을 사용할 수있게함
 **/
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools/production';
import { useState } from 'react';

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // React 라면 아래 설정은 달라집니다.
  // 현재 Next.js 에다가 셋팅을 진행함.
  // 서버 사이드 렌더링을 위한 QueryClient 인스턴스 생성
  // 각 요청마다 새로운 QueryClient 를 생성하여 상태 구분함.
  const [client, setClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 0,
            gcTime: 5 * 60 * 1000, // 5분
            refetchOnMount: true, // 마운트 시점에 리패칭 On
            refetchOnWindowFocus: false, // 윈도우 포커스 시점에 리패칭 끄기
            refetchOnReconnect: false, // 리커넥트 시점에 리패칭 끄기
            refetchInterval: false, // interval 리패칭 끄기
          },
        },
      })
  );

  return (
    <QueryClientProvider client={client}>
      {children}
      {/* npm run dev 상태에서만 개발자 도구 보기 */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition='bottom-right'
        />
      )}
    </QueryClientProvider>
  );
}
```
