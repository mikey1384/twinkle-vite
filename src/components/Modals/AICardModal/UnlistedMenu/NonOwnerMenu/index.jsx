import PropTypes from 'prop-types';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { useKeyContext } from '~/contexts';
import MakeOffer from './MakeOffer';

NonOwnerMenu.propTypes = {
  burnXP: PropTypes.number.isRequired,
  xpNumberColor: PropTypes.string.isRequired,
  owner: PropTypes.object.isRequired,
  onSetOfferModalShown: PropTypes.func.isRequired,
  myOffer: PropTypes.object
};

export default function NonOwnerMenu({
  burnXP,
  xpNumberColor,
  owner,
  onSetOfferModalShown,
  myOffer
}) {
  const {
    userLink: { color: userLinkColor }
  } = useKeyContext((v) => v.theme);

  return (
    <div
      className={css`
        width: 100%;
        font-size: 1.6rem;
        @media (max-width: ${mobileMaxWidth}) {
          font-size: 1.1rem;
        }
      `}
    >
      <div style={{ width: '100%', textAlign: 'center' }}>
        <b style={{ color: Color.redOrange() }}>Burn</b> value
        <div style={{ marginTop: '0.5rem' }}>
          <b style={{ color: Color[xpNumberColor]() }}>
            {addCommasToNumber(burnXP)}
          </b>{' '}
          <b style={{ color: Color.gold() }}>XP</b>
        </div>
        <p
          className={css`
            margin-top: 0.5rem;
            font-size: 1.1rem;
            @media (max-width: ${mobileMaxWidth}) {
              margin-top: 0.3rem;
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
      {myOffer ? (
        <div>my outstanding offer</div>
      ) : (
        <MakeOffer
          owner={owner}
          onSetOfferModalShown={onSetOfferModalShown}
          userLinkColor={userLinkColor}
          style={{ width: '100%', marginTop: '3rem', textAlign: 'center' }}
        />
      )}
    </div>
  );
}
