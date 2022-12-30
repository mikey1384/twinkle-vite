import PropTypes from 'prop-types';
import { qualityProps } from '~/constants/defaultValues';
import { css } from '@emotion/css';
import { desktopMinWidth, mobileMaxWidth } from '~/constants/css';

CardInfo.propTypes = {
  style: PropTypes.object,
  quality: PropTypes.string
};

export default function CardInfo({ quality, style }) {
  return (
    <div style={style}>
      <div
        className={css`
          font-size: 1.6rem;
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 1.2rem;
          }
        `}
      >
        <div
          className={css`
            @media (min-width: ${desktopMinWidth}) {
              display: inline;
            }
          `}
        >
          summoned {quality === 'elite' ? 'an' : 'a'}{' '}
        </div>
        <span style={{ ...qualityProps[quality] }}>{quality}</span> card
      </div>
    </div>
  );
}
