import React, { useLayoutEffect, useRef } from 'react';
import TargetMessage from './TargetMessage';

export default function TargetMessagePreview({
  onClose,
  onHeightChange,
  replyTarget
}: {
  onClose: () => void;
  onHeightChange?: (height: number) => void;
  replyTarget: {
    [key: string]: any;
    userId: number;
    username: string;
    timeStamp: number;
    wordleResult: {
      result: string;
      solution: string;
      solutionId: number;
      solutionType: string;
      solutionUserId: number;
      solutionUsername: string;
    };
  };
}) {
  const previewRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const preview = previewRef.current;
    if (!preview || !onHeightChange) return;
    const reportHeight = () => onHeightChange(preview.getBoundingClientRect().height);
    reportHeight();
    const observer = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(reportHeight);
    observer?.observe(preview);
    return () => {
      observer?.disconnect();
      onHeightChange(0);
    };
  }, [onHeightChange]);

  return (
    <div
      ref={previewRef}
      style={{
        width: '100%',
        position: 'relative',
        padding: '0.5rem 4rem 1rem 0.5rem',
        marginBottom: '2px'
      }}
    >
      <TargetMessage onClose={onClose} replyTarget={replyTarget} />
    </div>
  );
}
