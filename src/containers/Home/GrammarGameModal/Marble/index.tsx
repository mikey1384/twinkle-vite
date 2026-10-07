import React from 'react';

import GlassMarble from './GlassMarble';

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
      <GlassMarble letter={letterGrade || ''} size={28} isAllS={isAllS} />
    </span>
  );
}
