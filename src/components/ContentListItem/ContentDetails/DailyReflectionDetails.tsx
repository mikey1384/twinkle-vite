import React from 'react';
import { Color } from '~/constants/css';
import { User } from '~/types';

export default function DailyReflectionDetails({
  description,
  question,
  uploader
}: {
  description: string;
  question?: string;
  uploader: User;
}) {
  return (
    <>
      <div className="title">
        <p>{question || 'Daily Reflection'}</p>
        {uploader.username && (
          <small style={{ color: Color.gray(), fontSize: '1.3rem' }}>
            Posted by {uploader.username}
          </small>
        )}
      </div>
      {description && (
        <div style={{ lineHeight: 1.3 }} className="description">
          {description}
        </div>
      )}
    </>
  );
}
