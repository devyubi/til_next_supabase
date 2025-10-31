interface PostDetailProps {
  params: {
    id: string;
  };
}

function PostDetail({ params }: PostDetailProps) {
  const { id } = params;
  return <div>{id} PostDetail</div>;
}

export default PostDetail;
