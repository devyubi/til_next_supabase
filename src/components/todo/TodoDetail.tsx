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
