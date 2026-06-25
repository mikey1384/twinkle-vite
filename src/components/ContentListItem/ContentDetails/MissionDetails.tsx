import React from 'react';
import { Color } from '~/constants/css';

export default function MissionDetails({
  description,
  title
}: {
  description?: string;
  title: string;
}) {
  return (
    <>
      <div className="title">
        <p>{title}</p>
        <small
          style={{ color: Color.gold(), fontSize: '1.3rem', fontWeight: 'bold' }}
        >
          Mission
        </small>
      </div>
      {description && (
        <div style={{ lineHeight: 1.3 }} className="description">
          {description}
        </div>
      )}
    </>
  );
}
