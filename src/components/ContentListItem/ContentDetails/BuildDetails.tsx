import React from 'react';
import Icon from '~/components/Icon';
import { User } from '~/types';

export default function BuildDetails({
  description,
  title,
  uploader
}: {
  description: string;
  title: string;
  uploader: User;
}) {
  return (
    <div className="build-details">
      <div className="title">
        <div className="build-badge">
          <Icon icon="rocket" />
          <span>Lumine App</span>
        </div>
        <p>{title || 'Lumine App'}</p>
        {uploader.username && (
          <small>Published by {uploader.username}</small>
        )}
      </div>
      {description && <div className="description">{description}</div>}
      <div className="build-card-action">
        <span>Open app</span>
        <Icon icon="external-link-alt" />
      </div>
    </div>
  );
}
