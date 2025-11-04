import { RefObject, useEffect, useRef, useState } from "react";

export const useDebouncedState = <T,>(
  state: T,
  options: { duration?: number } = { duration: 500 },
): { debouncedState: T; timerRef: RefObject<NodeJS.Timeout | null>; isWaiting: boolean } => {
  const [isWaiting, setIsWaiting] = useState(false);
  const [debouncedState, setDebouncedState] = useState<T>(state);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { duration } = options;

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setIsWaiting(true);
    timerRef.current = setTimeout(() => {
      setDebouncedState(state);
      setIsWaiting(false);
    }, duration);

    return (): void => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [state, duration]);

  return { debouncedState, timerRef, isWaiting };
};
