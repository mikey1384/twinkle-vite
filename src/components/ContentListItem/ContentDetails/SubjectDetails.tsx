import React from 'react';
import { Color } from '~/constants/css';
import { User } from '~/types';

export default function SubjectDetails({
  description,
  title,
  uploader
}: {
  description: string;
  title: string;
  uploader: User;
}) {
  return (
    <>
      <div className="title">
        <p style={{ lineHeight: 1.5 }}>{title}</p>
        {uploader.username && (
          <small style={{ color: Color.gray() }}>
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
