import PropTypes from 'prop-types';
import OwnerMenu from './OwnerMenu';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

UnlistedMenu.propTypes = {
  cardLevel: PropTypes.number.isRequired,
  cardQuality: PropTypes.string.isRequired,
  onSetSellModalShown: PropTypes.func.isRequired,
  onSetIsBurned: PropTypes.func.isRequired,
  userIsOwner: PropTypes.bool.isRequired
};

export default function UnlistedMenu({
  onSetSellModalShown,
  onSetIsBurned,
  cardLevel,
  cardQuality,
  userIsOwner
}) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column'
      }}
      className={css`
        font-size: 1.6rem;
        @media (max-width: ${mobileMaxWidth}) {
          font-size: 1.1rem;
        }
      `}
    >
      {userIsOwner ? (
        <OwnerMenu
          cardLevel={cardLevel}
          cardQuality={cardQuality}
          onSetIsBurned={onSetIsBurned}
          onSetSellModalShown={onSetSellModalShown}
        />
      ) : null}
    </div>
  );
}
