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
    <div>
      <div className="title">{title}</div>
      {uploader.username && (
        <small style={{ color: Color.gray() }}>
          Posted by {uploader.username}
        </small>
      )}
      {description && <div className="description">{description}</div>}
    </div>
  );
}
