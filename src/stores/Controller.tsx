'use client';

import { Button } from '@/components/ui/button';
import { useDecrement, useIncrement } from './count';

const Controller = () => {
  const increment = useIncrement();
  const decrement = useDecrement();
  // const reset = useReset();

  return (
    <div className='flex gap-2'>
      <Button onClick={increment}>증가</Button>
      <Button onClick={decrement}>감소</Button>
      {/* <Button onClick={reset}>초기화</Button> */}
    </div>
  );
};

export default Controller;
