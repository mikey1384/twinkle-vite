import { useCallback, useState } from 'react';
import { observe } from 'react-intersection-observer';

// A leaner useInView() for long lists. react-intersection-observer's hook keeps
// the node in state (one extra render of every row when refs attach) and
// stores each observer entry in state (another render of every row on the
// observer's first report, even when nothing is in view). This keeps only the
// boolean, so a row re-renders when it actually enters or leaves the viewport.
// It shares react-intersection-observer's pooled observers.
export function useInViewFlag(): [(node: Element | null) => () => void, boolean] {
  const [inView, setInView] = useState(false);
  const ref = useCallback((node: Element | null) => {
    if (!node) return noop;
    return observe(node, (nextInView) => setInView(nextInView));
  }, []);
  return [ref, inView];
}

function noop() {}
