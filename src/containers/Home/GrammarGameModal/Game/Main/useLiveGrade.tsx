import { useEffect, useRef } from 'react';

export default function useLiveGrade({
  baseTime,
  getWrongCount,
  onGradeChange
}: {
  baseTime: number;
  getWrongCount: () => number;
  onGradeChange: (grade: string) => void;
}) {
  const gradeRef = useRef<string>('');
  const rafRef = useRef<number | null>(null);
  const penaltyPerWrongMs = 2000;
  const startMsRef = useRef<number>(0);

  useEffect(() => {
    let mounted = true;
    const loop = () => {
      if (!mounted) return;
      const now =
        typeof performance !== 'undefined' ? performance.now() : Date.now();
      const elapsed = Math.max(
        0,
        Math.floor(now - (startMsRef.current || now))
      );
      const penalty = Math.ceil((getWrongCount() || 0) * penaltyPerWrongMs);
      const measure = elapsed + penalty;
      const grade = getGradeFromMeasure({ measureTime: measure, baseTime });
      if (gradeRef.current !== grade) {
        gradeRef.current = grade;
        onGradeChange(grade);
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      mounted = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseTime]);

  function start() {
    startMsRef.current =
      typeof performance !== 'undefined' ? performance.now() : Date.now();
  }

  function getElapsedMs() {
    const now =
      typeof performance !== 'undefined' ? performance.now() : Date.now();
    return Math.max(0, Math.floor(now - (startMsRef.current || now)));
  }

  function getGradeFromMeasure({
    measureTime,
    baseTime
  }: {
    measureTime: number;
    baseTime: number;
  }): 'S' | 'A' | 'B' | 'C' | 'D' | 'F' {
    if (measureTime < baseTime * 0.2) return 'S';
    if (measureTime < baseTime * 0.3) return 'A';
    if (measureTime < baseTime * 0.5) return 'B';
    if (measureTime < baseTime * 0.7) return 'C';
    if (measureTime < baseTime) return 'D';
    return 'F';
  }

  return { start, getElapsedMs } as const;
}
