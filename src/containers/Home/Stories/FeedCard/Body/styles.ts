import React from 'react';
import { css } from '@emotion/css';
import { mainPreviewStyles } from './styles/mainPreviewStyles';
import { mobilePreviewStyles } from './styles/mobilePreviewStyles';
import { panelPreviewStyles } from './styles/panelPreviewStyles';
import { commentPreviewStyles } from './styles/commentPreviewStyles';
import { skeletonPreviewStyles } from './styles/skeletonPreviewStyles';
import { targetPreviewStyles } from './styles/targetPreviewStyles';

export const compactSecretCommentStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  maxWidth: '100%',
  minHeight: '4.2rem',
  padding: '0.75rem 1.15rem',
  borderRadius: '999px',
  fontSize: '1.35rem',
  fontWeight: 850,
  lineHeight: 1.15
};

export const bodyClass = css`
  --home-feed-content-font-size: max(1.9rem, 19px);
  --home-feed-secondary-content-font-size: max(1.8rem, 18px);
  --home-feed-question-font-size: max(1.85rem, 18.5px);
  --home-feed-compact-content-font-size: max(1.7rem, 17px);
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  width: 100%;
${panelPreviewStyles}
${mainPreviewStyles}
${targetPreviewStyles}
${commentPreviewStyles}
${skeletonPreviewStyles}
${mobilePreviewStyles}
`;
