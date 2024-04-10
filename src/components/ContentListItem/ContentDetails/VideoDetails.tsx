import React from 'react';
import { Color } from '~/constants/css';
import { User } from '~/types';

export default function VideoDetails({
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
      <div style={{ marginLeft: '1rem' }}>
        <div>{title}</div>
        <small style={{ color: Color.gray() }}>
          Uploaded by {uploader.username}
        </small>
      </div>
      <div>{description}</div>
    </div>
  );
}
