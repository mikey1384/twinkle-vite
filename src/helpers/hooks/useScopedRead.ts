import { useEffect, useRef, useState } from 'react';
import readWithTimeout from '../readWithTimeout';

export default function useScopedRead<T>(
  scope: string,
  read: () => Promise<T>,
  delay = 0
) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    data?: T;
    error: boolean;
    loading: boolean;
  }>({ key: '', error: false, loading: true });
  const key = JSON.stringify([scope, attempt]);
  const latest = useRef(key);
  latest.current = key;
  const reader = useRef(read);
  reader.current = read;
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      void readWithTimeout(reader.current).then(
        (data) => {
          if (active && latest.current === key)
            setResult({ key, data, error: false, loading: false });
        },
        () => {
          if (active && latest.current === key)
            setResult({ key, error: true, loading: false });
        }
      );
    }, delay);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [key, delay]);
  return {
    ...(result.key === key
      ? result
      : { data: undefined, loading: true, error: false }),
    retry: () => setAttempt((value) => value + 1)
  };
}
