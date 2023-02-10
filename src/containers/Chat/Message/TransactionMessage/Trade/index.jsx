import { useMemo } from 'react';
import PropTypes from 'prop-types';
import AICardsPreview from '~/components/AICardsPreview';
import UsernameText from '~/components/Texts/UsernameText';
import { Color } from '~/constants/css';

Trade.propTypes = {
  myId: PropTypes.number.isRequired,
  myUsername: PropTypes.string.isRequired,
  partner: PropTypes.object.isRequired,
  onSetAICardModalCardId: PropTypes.func.isRequired,
  wantCardIds: PropTypes.array,
  wantCoins: PropTypes.number,
  offerCardIds: PropTypes.array,
  offerCoins: PropTypes.number,
  fromId: PropTypes.number.isRequired
};

export default function Trade({
  myId,
  myUsername,
  partner,
  onSetAICardModalCardId,
  offerCardIds,
  offerCoins,
  wantCardIds,
  wantCoins,
  fromId
}) {
  const from = useMemo(() => {
    return fromId === myId ? { id: myId, username: myUsername } : partner;
  }, [fromId, myId, myUsername, partner]);

  return (
    <div
      style={{
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
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
      <div>in exchange for</div>
      {wantCardIds.length ? (
        <div>
          <AICardsPreview
            cardIds={wantCardIds}
            onSetAICardModalCardId={onSetAICardModalCardId}
          />
          {wantCoins > 0 && <div>and</div>}
        </div>
      ) : null}
      {wantCoins > 0 && <div>{`${wantCoins} coins`}</div>}
    </div>
  );
}
