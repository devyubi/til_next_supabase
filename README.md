# Supabase 테이블 세팅

## 1. posts 테이블 생성해보기

- 게시글을 보관하는 용도

## 2. 컬럼 구조

- id : 글의 아이디 / int8 / Not Null
- author_id : 작성자 / uuid / auth.uid()
- content : 내용 / text / Not Null
- like_count : 좋아요수 / int8 / Not null
- image_urls : 게시글에 여러 이미지경로를 문자열로 관리 / text / Null / Array
- crated_at : 생성날짜 / timestampz / Not Null

## 3. Supabase CLI 설치

- 용도 : table 에 대한 types.ts 생성 목적

```bash
npx supabase login
```

- 웹브라우저에 출력된 키 복사 후 터미널에 입력 (or 복붙)

## 4. package.json 추가

- supabase 타입 자동 생성 스크립트 추가
- `/src/types 폴더` 생성
- package.json 에 밑에 구문 추가.

```json
    "generate-types": "npx supabase gen types typescript --project-id 프로젝트아이디 > src/types/database.types.ts"
```

```json
{
  "name": "til_next_supabase",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "format:staged": "prettier --write --ignore-unknown",
    "generate-types": "npx supabase gen types typescript --project-id 프로젝트 아이디 > src/types/database.types.ts"
  },
  "dependencies": {
    "@radix-ui/react-alert-dialog": "^1.1.15",
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-popover": "^1.1.15",
    "@radix-ui/react-slot": "^1.2.3",
    "@supabase/ssr": "^0.7.0",
    "@tanstack/react-query": "^5.90.5",
    "@tanstack/react-query-devtools": "^5.90.2",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "embla-carousel-react": "^8.6.0",
    "immer": "^10.1.3",
    "lucide-react": "^0.546.0",
    "next": "15.5.5",
    "next-themes": "^0.4.6",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "sonner": "^2.0.7",
    "tailwind-merge": "^3.3.1",
    "zustand": "^5.0.8"
  },
  "devDependencies": {
    "@eslint/eslintrc": "^3",
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "15.5.5",
    "eslint-config-prettier": "^10.1.8",
    "eslint-plugin-prettier": "^5.5.4",
    "prettier": "^3.6.2",
    "tailwindcss": "^4",
    "tw-animate-css": "^1.4.0",
    "typescript": "^5"
  }
}
```

```bash
npm run generate-types
```

## 5. 타입 활용

- `/src/lib/supabase/client.ts` 업데이트
- Supabase 연동시 타입을 자동 추론하는데 도움을 주기 위한 처리

```ts
import { Database } from '@/types/database.types';
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const createClient = () =>
  createBrowserClient<Database>(supabaseUrl!, supabaseKey!);
```

## 6. `/src/lib/supabase/server.ts` 업데이트

- Next.js 15부터 cookies() 가 비동기로 변경 됨
- 현재 Connect 예시에는 반영 안되어 있음

```ts
import { Database } from '@/types/database.types';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const createClient = async () => {
  // 최신 문법 처리
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
};
```

## 7. 테이블의 타입을 별도 관리

- `/src/types/types.ts 파일` 생성

```ts
import { type Database } from './database.types';

export type PostEntity = Database['public']['Tables']['posts']['Row'];
export type InsertPostEntity = Database['public']['Tables']['posts']['Insert'];
export type UpdatePostEntity = Database['public']['Tables']['posts']['Update'];
export type PostTableEntity = Database['public']['Tables']['posts'];
```
