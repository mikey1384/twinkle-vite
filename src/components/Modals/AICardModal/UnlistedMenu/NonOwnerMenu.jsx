import PropTypes from 'prop-types';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';

NonOwnerMenu.propTypes = {
  burnXP: PropTypes.number.isRequired,
  xpNumberColor: PropTypes.string.isRequired
};

export default function NonOwnerMenu({ burnXP, xpNumberColor }) {
  return (
    <div style={{ width: '100%' }}>
      <div
        className={css`
          width: 100%;
          font-size: 1.6rem;
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 1.1rem;
          }
        `}
        style={{ width: '100%', textAlign: 'center' }}
      >
        <b style={{ color: Color.redOrange() }}>Burn</b> value
        <div style={{ marginTop: '0.5rem' }}>
          <b style={{ color: Color[xpNumberColor]() }}>
            {addCommasToNumber(burnXP)}
          </b>{' '}
          <b style={{ color: Color.gold() }}>XP</b>
        </div>
        <p
          className={css`
            margin-top: 0.8rem;
            font-size: 1.1rem;
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 0.8rem;
            }
          `}
        >
          (Burning this card yields{' '}
          <b style={{ color: Color[xpNumberColor]() }}>
            {addCommasToNumber(burnXP)}
          </b>{' '}
          <b style={{ color: Color.gold() }}>XP</b>)
        </p>
      </div>
    </div>
  );
}
