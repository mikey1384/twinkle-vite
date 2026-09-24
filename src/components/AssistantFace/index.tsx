import React from 'react';
import { css } from '@emotion/css';
import {
  CIEL_PFP_URL,
  ZERO_PFP_URL,
  cloudFrontURL
} from '~/constants/defaultValues';

// Zero or Ciel's face (their profile picture), for everywhere on the site
// except a call, which shows their full picture (ZeroPic).
export default function AssistantFace({
  assistant,
  size
}: {
  assistant: 'Zero' | 'Ciel' | null;
  size: string;
}) {
  const storedPicture =
    assistant === 'Ciel'
      ? CIEL_PFP_URL
      : assistant === 'Zero'
        ? ZERO_PFP_URL
        : '';
  // Stored as a path on the image CDN, like other profile pictures.
  const picture =
    storedPicture && storedPicture.startsWith('/')
      ? `${cloudFrontURL}${storedPicture}`
      : storedPicture;
  if (!picture) return null;
  return (
    <img
      src={picture}
      alt=""
      draggable={false}
      onError={(event) => {
        event.currentTarget.style.display = 'none';
      }}
      className={css`
        width: ${size};
        height: ${size};
        border-radius: 50%;
        flex-shrink: 0;
        user-select: none;
      `}
    />
  );
}
