import React, { useEffect, useRef } from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { useKeyContext } from '~/contexts';
import { getGradeFromMeasure } from '../../constants';

export default function LiveGradeIndicator({
  baseTime,
  getMeasureTime,
  onGradeChange
}: {
  baseTime: number;
  getMeasureTime: () => number;
  onGradeChange: (grade: string) => void;
}) {
  const textRef = useRef<HTMLDivElement | null>(null);
  const gradeRef = useRef<string>('');
  const rafRef = useRef<number | null>(null);
  const sKey = useKeyContext((v) => v.theme.grammarGameScoreS.color);
  const aKey = useKeyContext((v) => v.theme.grammarGameScoreA.color);
  const bKey = useKeyContext((v) => v.theme.grammarGameScoreB.color);
  const cKey = useKeyContext((v) => v.theme.grammarGameScoreC.color);
  const dKey = useKeyContext((v) => v.theme.grammarGameScoreD.color);

  useEffect(() => {
    let mounted = true;
    const loop = () => {
      if (!mounted) return;
      const measure = getMeasureTime();
      const grade = getGradeFromMeasure({ measureTime: measure, baseTime });
      if (gradeRef.current !== grade) {
        gradeRef.current = grade;
        onGradeChange(grade);
        if (textRef.current) {
          textRef.current.textContent = `Grade if correct now: ${grade}`;
          textRef.current.style.color = gradeColor({
            grade,
            sKey,
            aKey,
            bKey,
            cKey,
            dKey
          });
        }
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

  return (
    <div
      ref={textRef}
      className={css`
        margin-top: 0.75rem;
        font-weight: 700;
        font-size: 1.6rem;
        color: ${Color.darkerGray()};
      `}
    />
  );
}

function gradeColor({
  grade,
  sKey,
  aKey,
  bKey,
  cKey,
  dKey
}: {
  grade: string;
  sKey: string;
  aKey: string;
  bKey: string;
  cKey: string;
  dKey: string;
}) {
  try {
    if (grade === 'S') return Color[sKey]();
    if (grade === 'A') return Color[aKey]();
    if (grade === 'B') return Color[bKey]();
    if (grade === 'C') return Color[cKey]();
    if (grade === 'D') return Color[dKey]();
    return Color.gray(0.7);
  } catch {
    // Fallback mapping if theme keys are unavailable
    switch (grade) {
      case 'S':
        return '#6D28D9';
      case 'A':
        return '#3b82f6';
      case 'B':
        return '#f59e0b';
      case 'C':
      case 'D':
        return '#ef4444';
      default:
        return Color.gray(0.7);
    }
  }
}
