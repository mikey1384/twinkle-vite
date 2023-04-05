import PropTypes from 'prop-types';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';

ByUserIndicator.propTypes = {
  contentType: PropTypes.string.isRequired,
  byUser: PropTypes.bool,
  subjectIsAttachedToVideo: PropTypes.bool,
  byUserIndicatorColor: PropTypes.string,
  byUserIndicatorOpacity: PropTypes.number,
  byUserIndicatorTextColor: PropTypes.string,
  byUserIndicatorTextShadowColor: PropTypes.string,
  uploader: PropTypes.shape({
    username: PropTypes.string.isRequired
  }).isRequired,
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
}) {
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
