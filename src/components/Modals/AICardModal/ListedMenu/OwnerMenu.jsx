import PropTypes from 'prop-types';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import { useAppContext, useChatContext } from '~/contexts';

OwnerMenu.propTypes = {
  cardId: PropTypes.number.isRequired,
  style: PropTypes.object
};

export default function OwnerMenu({ cardId, style }) {
  const delistAICard = useAppContext((v) => v.requestHelpers.delistAICard);
  const onDelistAICard = useChatContext((v) => v.actions.onDelistAICard);

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        ...style
      }}
    >
      <Button
        className={css`
          @media (max-width: ${mobileMaxWidth}) {
            padding: 0.7rem !important;
          }
        `}
        onClick={handleCancelListing}
        color="rose"
        filled
      >
        <Icon
          className={css`
            font-size: 1.6rem;
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1rem;
            }
          `}
          icon="redo"
        />
        <span
          className={css`
            font-size: 1.6rem;
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1rem;
            }
          `}
          style={{ marginLeft: '0.7rem' }}
        >
          Cancel Listing
        </span>
      </Button>
    </div>
  );

  async function handleCancelListing() {
    const success = await delistAICard(cardId);
    if (success) {
      onDelistAICard(cardId);
    }
  }
}
