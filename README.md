# comments 테이블 작업

## 1. 테이블 설정

- 테이블명 : `comments`
- RLS : `활성화 해둠`

### 1.1. 컬럼 설정 

- `id` : 기본대로 둠
- `created_at` : 기본값
- `content` → text → `Set as Empty String` → `Not Null`
- `author_id` → uuid → `auth.uid()` → `Not Null`
- `post_id` → int8 → NULL → `Not Null`

### 1.2. FK 설정

- `public` → `posts` → public.comments : `post_id` → `id` → Casecade → Casecade → 저장
- `public` → `profiles` → public.comments : `author_id` → `id` → Casecade → Casecade → 저장

### 1.3. RLS 설정

- `Authentication` → `Policies` → `comments` → Create Policy 버튼

- `Anyone can select comment` → `SELECT` → `Default` → `true` → 저장버튼
- `Users can insert comment` → `INSERT` → `authnicated` → `(select auth.uid()) = author_id` → 저장버튼
- `Users can update comment` → `UPDATE` → `authnicated` → `(select auth.uid()) = author_id` → `(select auth.uid()) = author_id` → 저장버튼
- `Users can delete comment` → `DELETE` → `authnicated` → `(select auth.uid()) = author_id` → 저장버튼

## 2. 타입 생성

- Supabase 로그인 후 진행

```bash
npx supabase login
npm run generate-types
```

## 3. 타입 정리

- `/src/types/types.ts` 업데이트

```ts
// 댓글 기능
export type CommentEntity = Database['public']['Tables']['comments']['Row'];
export type InsertCommentEntity = Database['public']['Tables']['comments']['Insert'];
export type UpdateCommentEntity = Database['public']['Tables']['comments']['Update'];
export type CommentTableEntity = Database['public']['Tables']['comments'];
```