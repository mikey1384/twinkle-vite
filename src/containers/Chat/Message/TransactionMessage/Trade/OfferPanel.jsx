import PropTypes from 'prop-types';
import UsernameText from '~/components/Texts/UsernameText';
import AICardsPreview from '~/components/AICardsPreview';
import { Color } from '~/constants/css';

OfferPanel.propTypes = {
  from: PropTypes.object.isRequired,
  myId: PropTypes.number.isRequired,
  offerCardIds: PropTypes.array,
  offerCoins: PropTypes.number,
  onSetAICardModalCardId: PropTypes.func.isRequired
};

export default function OfferPanel({
  from,
  myId,
  offerCardIds,
  offerCoins,
  onSetAICardModalCardId
}) {
  return (
    <div>
      <UsernameText
        displayedName={from.id === myId ? 'You' : from.username}
        color={Color.black()}
        user={{
          id: from.id,
          username: from.username
        }}
      />
      <div>{`offer${from.id === myId ? '' : 's'}`}</div>
      {offerCardIds.length ? (
        <div>
          <AICardsPreview
            cardIds={offerCardIds}
            onSetAICardModalCardId={onSetAICardModalCardId}
          />
          {offerCoins > 0 && <div>and</div>}
        </div>
      ) : null}
      {offerCoins > 0 && <div>{`${offerCoins} coins`}</div>}
    </div>
  );
}
