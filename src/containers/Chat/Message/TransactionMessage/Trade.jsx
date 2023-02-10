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
  wantCardIds: PropTypes.array.isRequired,
  fromId: PropTypes.number.isRequired,
  toId: PropTypes.number.isRequired
};

export default function Trade({
  myId,
  myUsername,
  partner,
  onSetAICardModalCardId,
  wantCardIds,
  fromId,
  toId
}) {
  const from = useMemo(() => {
    return fromId === myId ? { id: myId, username: myUsername } : partner;
  }, [fromId, myId, myUsername, partner]);
  const to = useMemo(() => {
    return toId === myId ? { id: myId, username: myUsername } : partner;
  }, [myId, myUsername, partner, toId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      from:
      <UsernameText
        displayedName={from.id === myId ? 'You' : from.username}
        color={Color.black()}
        user={{
          id: from.id,
          username: from.username
        }}
      />
      to:
      <UsernameText
        displayedName={to.id === myId ? 'You' : to.username}
        color={Color.black()}
        user={{
          id: to.id,
          username: to.username
        }}
      />
      <AICardsPreview
        cardIds={wantCardIds}
        onSetAICardModalCardId={onSetAICardModalCardId}
      />
    </div>
  );
}
