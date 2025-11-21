import supabase from '@/lib/supabase/client';

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
