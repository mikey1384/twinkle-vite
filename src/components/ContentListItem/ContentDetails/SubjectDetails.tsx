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
        {title}
        {uploader.username && (
          <small style={{ color: Color.gray() }}>
            Posted by {uploader.username}
          </small>
        )}
      </div>
      {description && <div className="description">{description}</div>}
    </>
  );
}
