import PropTypes from 'prop-types';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';

MaxLevelItemInfo.propTypes = {
  icon: PropTypes.string,
  title: PropTypes.string,
  description: PropTypes.oneOfType([PropTypes.string, PropTypes.node])
};

export default function MaxLevelItemInfo({ icon, title, description }) {
  return (
    <div
      style={{
        width: '100%',
        padding: '2rem',
        display: 'flex',
        justifyContent: 'center'
      }}
    >
      <div
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          fontSize: '2rem',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Icon size="3x" icon={icon} />
        </div>
        <div
          className={css`
            margin-left: 5rem;
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
          `}
        >
          <div
            className={css`
              font-size: 2.5rem;
              font-weight: bold;
              width: 100%;
              text-align: center;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 2rem;
              }
            `}
          >
            {title}
          </div>
          <div
            className={css`
              font-size: 1.7rem;
              width: 90%;
              text-align: center;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1.5rem;
              }
            `}
          >
            {description}
          </div>
        </div>
      </div>
    </div>
  );
}
