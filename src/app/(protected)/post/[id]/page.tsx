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
