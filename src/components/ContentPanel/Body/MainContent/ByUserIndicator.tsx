import React from 'react';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';

interface Props {
  contentType: string;
  byUser: any;
  subjectIsAttachedToVideo: boolean;
  byUserIndicatorColor: string;
  byUserIndicatorOpacity: number;
  byUserIndicatorTextColor: string;
  byUserIndicatorTextShadowColor: string;
  uploader: any;
  filePath: string;
}
export default function ByUserIndicator({
  contentType,
  byUser,
  subjectIsAttachedToVideo,
  byUserIndicatorColor,
  byUserIndicatorOpacity,
  byUserIndicatorTextColor,
  byUserIndicatorTextShadowColor,
  uploader,
  filePath
}: Props) {
  if ((contentType !== 'url' && contentType !== 'subject') || !byUser)
    return null;
  return (
    <div
      style={{
        ...(subjectIsAttachedToVideo ? { marginTop: '0.5rem' } : {}),
        padding: '0.7rem',
        background: Color[byUserIndicatorColor](byUserIndicatorOpacity),
        color: Color[byUserIndicatorTextColor](),
        textShadow: byUserIndicatorTextShadowColor
          ? `0 0 1px ${Color[byUserIndicatorTextShadowColor]()}`
          : 'none',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontWeight: 'bold',
        fontSize: '1.7rem'
      }}
      className={css`
        margin-left: -1px;
        margin-right: -1px;
        @media (max-width: ${mobileMaxWidth}) {
          margin-left: 0;
          margin-right: 0;
        }
      `}
    >
      This was {contentType === 'subject' && !filePath ? 'written' : 'made'} by{' '}
      {uploader.username}
    </div>
  );
}
