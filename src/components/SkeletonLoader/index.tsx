import React from 'react';
import SkeletonItem from './SkeletonItem';

export default function SkeletonLoader({
  count = 4,
  className
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, idx) => (
        <SkeletonItem key={idx} />
      ))}
    </div>
  );
}
