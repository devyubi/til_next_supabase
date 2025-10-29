'use client';

import { useCountStore } from '@/stores/count';

const Viewer = () => {
  const { count } = useCountStore();
  return <div className='text-2xl'>{count}</div>;
};

export default Viewer;
