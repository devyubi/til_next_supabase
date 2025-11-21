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
