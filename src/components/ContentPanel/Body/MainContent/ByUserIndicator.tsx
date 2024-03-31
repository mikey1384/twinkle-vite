import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { User } from '~/types';

ByUserIndicator.propTypes = {
  contentType: PropTypes.string.isRequired,
  byUser: PropTypes.bool.isRequired,
  subjectIsAttachedToVideo: PropTypes.bool.isRequired,
  byUserIndicatorColor: PropTypes.string.isRequired,
  byUserIndicatorOpacity: PropTypes.number.isRequired,
  byUserIndicatorTextColor: PropTypes.string.isRequired,
  byUserIndicatorTextShadowColor: PropTypes.string,
  uploader: PropTypes.object.isRequired,
  filePath: PropTypes.string
};
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
}: {
  contentType: string;
  byUser: boolean;
  subjectIsAttachedToVideo: boolean;
  byUserIndicatorColor: string;
  byUserIndicatorOpacity: number;
  byUserIndicatorTextColor: string;
  byUserIndicatorTextShadowColor: string;
  uploader: User;
  filePath?: string;
}) {
  if ((contentType !== 'url' && contentType !== 'subject') || !byUser)
    return null;
  const { background, color, textShadow } = useMemo(() => {
    return {
      background: Color[byUserIndicatorColor](byUserIndicatorOpacity),
      color: Color[byUserIndicatorTextColor](),
      textShadow: byUserIndicatorTextShadowColor
        ? `0 0 1px ${Color[byUserIndicatorTextShadowColor]()}`
        : 'none'
    };
  }, [
    byUserIndicatorColor,

    byUserIndicatorOpacity,
    byUserIndicatorTextColor,
    byUserIndicatorTextShadowColor
  ]);
  return (
    <div
      className={css`
        padding: 0.7rem;
        background: ${background};
        color: ${color};
        text-shadow: ${textShadow};
        display: flex;
        justify-content: center;
        align-items: center;
        font-weight: bold;
        font-size: 1.7rem;
        ${subjectIsAttachedToVideo ? 'margin-top: 0.5rem;' : ''};
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
