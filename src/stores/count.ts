import { create } from 'zustand';

type CountStoreType = {
  count: number;
  actions: {
    increment: () => void;
    decrement: () => void;
    reset: () => void;
  };
};

// 커스텀 훅을 리턴해준다. 아주 좋다.
export const useCountStore = create<CountStoreType>(set => {
  return {
    // state : 초기값
    count: 0,
    actions: {
      // action : state 변경
      increment: () => {
        // 함수형태 지원
        set(store => ({ count: store.count + 1 }));
      },
      decrement: () => {
        set(store => ({ count: store.count - 1 }));
      },
      reset: () => set({ count: 0 }),
    },
  };
});

// 전용 훅들
export const useCount = () => {
  const count = useCountStore(store => store.count);
  return count;
};
export const useIncrement = () => {
  const increment = useCountStore(store => store.actions.increment);
  return increment;
};
export const useDecrement = () => {
  const decrement = useCountStore(store => store.actions.decrement);
  return decrement;
};
export const useReset = () => {
  const Reset = useCountStore(store => store.actions.reset);
  return Reset;
};
