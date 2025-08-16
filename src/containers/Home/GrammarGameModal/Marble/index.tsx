import React from 'react';

import LetterGrade from './LetterGrade';

export default function Marble({
  letterGrade,
  style,
  isAllS
}: {
  letterGrade?: string;
  style?: React.CSSProperties;
  isAllS?: boolean;
}) {
  return (
    <span style={{ display: 'inline-flex', verticalAlign: 'middle', ...style }}>
      <LetterGrade letter={letterGrade || ''} size={28} isAllS={isAllS} />
    </span>
  );
}
