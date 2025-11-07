import { fetchTodoById } from '@/apis/todo';
import { QUERY_KEYS } from '@/lib/constants';
import { useQuery } from '@tanstack/react-query';

export function useTodoDataById(id: number, type: 'LIST' | 'DETAIL') {
  return useQuery({
    queryKey: QUERY_KEYS.todo.detail(id.toString()),
    queryFn: () => fetchTodoById(id),
    // enabled 옵션은 true 이면 캐시를 리턴받음 (false 이면 queryFn 진행)
    enabled: type === 'DETAIL',
  });
}
