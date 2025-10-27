# 인증

## 1. 활성화

- Authentication → Sign In / Providers
- 개발 할 때엔 `Confirm email 은 비활성화` 해주는게 좋음.
- `Save Change 실행`

## 2. email 관련 옵션

- 실제 서비스 들어갈 때엔 고민 해보고 결정
- 개발 단계에선 Auth Providers → email → `Enable Email provider` 만 활성화

## 3. 회원 가입 UI 작업

- http://localhost:3000/signup

```tsx
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

function SignUp() {
  return (
    <div className='flex flex-col gap-8'>
      <div className='text-xl font-bold'>회원가입</div>
      <div className='flex flex-col gap-2'>
        <Input type='email' placeholder='이메일을 입력해주세요.' />
        <Input type='password' placeholder='비밀번호를 입력해주세요.' />
      </div>
      <div>
        <Button className='w-full'>회원가입</Button>
      </div>
      <div>
        <Link
          href={'/signin'}
          className='text-muted-foreground hover:text-gray-400'
        >
          이미 계정이 있다면? 로그인
        </Link>
      </div>
    </div>
  );
}

export default SignUp;
```

## 4. 클라이언트 컴포넌트 상태 및 이벤트 관리

- useState 활용
- 이벤트 핸들러 활용

```tsx
'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useState } from 'react';

function SignUp() {
  // 컴포넌트 상태
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 회원가입 버튼 클릭 처리
  const handleSignUpClick = () => {
    if (!email.trim()) return;
    if (!password.trim()) return;

    // supabase 회원가입 처리 코드
  };

  return (
    <div className='flex flex-col gap-8'>
      <div className='text-xl font-bold'>회원가입</div>
      <div className='flex flex-col gap-2'>
        <Input
          value={email}
          onChange={e => setEmail(e.target.value)}
          type='email'
          placeholder='이메일을 입력해주세요.'
        />
        <Input
          value={password}
          onChange={e => setPassword(e.target.value)}
          type='password'
          placeholder='비밀번호를 입력해주세요.'
        />
      </div>
      <div>
        <Button className='w-full'>회원가입</Button>
      </div>
      <div>
        <Link
          href={'/signin'}
          className='text-muted-foreground hover:text-gray-400'
        >
          이미 계정이 있다면? 로그인
        </Link>
      </div>
    </div>
  );
}

export default SignUp;
```

## 5. React Query 의 `Mutation` 에 대한 이해

- 데이터 등록, 수정, 삭제 요청 관리하기

### 5.1. 백엔드 서버에 데이터 추가 요청을 보낼 때 `비동기 함수` 필요

- 경로 주의! 절대로 `/src/app/api` 폴더에 작성 X.
  - `/src/app/api` 폴더에 작성하면 Next 가 작동 됨.
- `/src/apis 폴더` 생성

## 5.2. Sample 참조해보기

- `/src/apis/create-todo.ts 파일` 생성 : 할 일 생성 API 함수

```tsx
// Todo 를 등록하는 함수 : API 즉, 백엔드 연동용 함수
export async function createTodo({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  const response = await fetch(`서버_URL/api/todos`, {
    method: 'POST',
    body: JSON.stringify({ title, content }),
  });
  if (response.ok) throw new Error('할 일 등록에 실패하였습니다.');

  const data = response.json();
  return data;
}
```

- 백엔드 연동 `API 가 완성`되면, `관리 해줄 Mutation` 을 만듦

### 5.3. Mutation 이 필요한 이유

- 현재 글을 등록 하는데, `isPending : 현재 등록중인 상태` 를 개발자가 코딩으로 관리함.
- 현재 글이 등록 완료가 되었는지, `response 가 true : 개발자가 코딩으로 관리` 함.
- 현재 글이 등록 실패 했는지, `error : 개발자가 코딩으로 관리` 함.
- 현재 글 등록 했을 때 오류가 발생 시, `error : 개발자가 코딩으로 관리` 함.
- 각각의 상황에 맞는 함수(이벤트에 따라서 실행할 콜백 함수 등)들을 직접 작성하고 있음.
- 하지만, Mutation 을 쓸 경우 편하다.

### 5.3. Mutation 적용

- api 함수를 만들고 나면 mutation 을 생성해 줌
- `/src/hooks 폴더` 생성
- `/src/hooks/mutations 폴더` 생성
- `/src/hooks/mutations/useCreateTodo.ts 파일` 생성

```ts
import { createTodo } from '@/apis/create-todo';
import { useMutation } from '@tanstack/react-query';

const useCreateTodo = () => {
  // 1단계 : useMutation 생성
  //   const {} = useMutation();

  // 2단계 : 객체를 인자로 전달함
  //   const {} = useMutation({});

  // 3단계 : 객체 안에 mutationFn: 실행할 API 함수 작성
  //   const {} = useMutation({
  //     mutationFn: 실행할 API 함수
  //   });

  // 4단계
  //   const {} = useMutation({
  //     mutationFn: createTodo,
  //   });

  // 5단계
  //   const {mutate} = useMutation({
  //     mutationFn: createTodo,
  //   })

  // 6단계 : 추가 (선택사항.. 옵션들...)
  const { mutate, isPending } = useMutation({
    mutationFn: createTodo,
  });
};

// 외부로 훅 내보내기
export default useCreateTodo;
```

### 5.4. Mutation 이벤트 처리 적용

```ts
import { createTodo } from '@/apis/create-todo';
import { useMutation } from '@tanstack/react-query';

const useCreateTodo = () => {
  const { mutate, isPending } = useMutation({
    mutationFn: createTodo,
    // onMutate : 요청이 시작 될 때 실행
    onMutate: () => {
      console.log('요청 시작');
    },
    // onSuccess : 요청이 성공 했을 때 실행
    onSuccess: () => {
      console.log('요청 성공');
    },
    // onError : 요청에 실패 했을 때 실행
    // Error 에는 에러가 자동에는 매개변수로 전달됨
    onError: () => {
      console.log('요청 실패');
    },
    // onSettled : 요청이 완료 되었을 때 실행
    onSettled: () => {
      console.log('요청 완료');
    },
  });
};

// 외부로 훅 내보내기
export default useCreateTodo;
```

### 5.5. 만약 데이터가 onSuccess 했을 때

- useQuery 로 생성한 `특정 키`를 `전체 캐시 갱신` : 성능상 좋지 않음

```ts
queryClient.invalidateQueries({ queryKey: ['todos'] });
```

- 캐시를 업데이트 하는 형식이 성능상 좋음

```ts
import { createTodo } from '@/apis/create-todo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const useCrateTodo = () => {
  // 전체 useQuery 로 만든 캐시와
  // 전체 useMutation 으로 만든 캐시를 관리하는 저장소 참조
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: createTodo,
    // 요청이 시작 될때 실행됨.
    onMutate: () => {
      console.log('요청 시작');
    },
    // 요청이 성공했을때 실행됨
    // 자동으로 성공된 데이터를 매개변수로 전달을 해줌.
    onSuccess: newTodo => {
      console.log('요청 성공');
      // 데이터 새로읽기 좋은 자리
      //window.location.reload();

      // 아래는 데이터 전체를 모두 가지고 오므로 부하가 발생할 소지가 있다
      // queryKey: ['todos'] : 가지고 있던 데이터를 갱신해줘
      // queryClient.invalidateQueries({ queryKey: ['todos'] });

      // 캐시에 직접 데이터를 추가해주는 방식
      queryClient.setQueryData<
        { id: string; title: string; description: string }[]
      >(['todo'].todo.list, prevTodos => {
        if (!prevTodos) return [newTodo];
        return [...prevTodos, newTodo];
      });
    },
    // 요청이 실패했을때 실행됨
    // error 에는 에러가 자동으로 매개변수로 전달됨.
    onError: error => {
      console.log('요청 에러', error);
    },
    // 요청이 완료되었을 때 실행됨
    onSettled: () => {
      console.log('요청 완료');
    },
  });
};

// 외부로 훅 내보내기
export default useCrateTodo;
```

## 6. Supabase 이메일 회원 추가 Mutation 적용

### 6.1. api 만들기

- client.ts 업데이트

```ts
import { Database } from '@/types/database.types';
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const createClient = () =>
  createBrowserClient<Database>(supabaseUrl!, supabaseKey!);

// 외부 클라이언트 컴포넌트에서 자유롭게 사용하도록 설정
const supabase = createClient();
export default supabase;
```

- `/src/apis/auth.ts 파일` 생성

```ts
import supabase from '@/lib/supabase/client';

// Supabase 백엔드에 사용자 이메일 회원 가입
export async function signUp({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  // 웹브라우저를 이용해서 이메일 회원가입
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}
```

### 6.2. mutation 만들기

- `/src/hooks/mutations/useSignUp.ts 파일` 생성

```ts
import { signUpWithEmail } from '@/apis/auth';
import { useMutation } from '@tanstack/react-query';

export function useSignUp() {
  return useMutation({
    mutationFn: signUpWithEmail,
  });
}
```

### 6.3. mutation 활용하기

- `/src/app/signup/page.tsx`

```tsx
'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSignUp } from '@/hooks/mutations/useSignUp';
import Link from 'next/link';
import { useState } from 'react';

function SignUp() {
  // 컴포넌트 상태
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Mutation Hook 활용하기
  // 1. 이메일 mutation 훅
  const { mutate, isPending, isError } = useSignUp();

  // 회원가입 버튼 클릭처리
  const handleSignUpClick = () => {
    if (!email.trim()) return;
    if (!password.trim()) return;
    // supabase 회원가입 처리 코드
    mutate({ email, password });
  };

  if (isError) {
    return <div>회원가입 Error 입니다.</div>;
  }

  return (
    <div className='flex flex-col gap-8'>
      <div className='text-xl font-bold'>회원가입</div>
      <div className='flex flex-col gap-2'>
        <Input
          value={email}
          disabled={isPending}
          onChange={e => setEmail(e.target.value)}
          type='email'
          placeholder='example@example.com'
        />
        <Input
          value={password}
          disabled={isPending}
          onChange={e => setPassword(e.target.value)}
          type='password'
          placeholder='password'
        />
      </div>
      <div>
        <Button
          disabled={isPending}
          className='w-full'
          onClick={handleSignUpClick}
        >
          {isPending ? '회원등록중...' : '회원가입'}
        </Button>
      </div>
      <div>
        <Link
          href={'/signin'}
          className='text-muted-foreground hover:text-gray-300'
        >
          이미 계정이 있다면? 로그인
        </Link>
      </div>
    </div>
  );
}

export default SignUp;
```
