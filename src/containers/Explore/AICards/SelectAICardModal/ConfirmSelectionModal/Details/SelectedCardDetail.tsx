import React, { useMemo } from 'react';
import Icon from '~/components/Icon';
import AICardsPreview from '~/components/AICardsPreview';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { borderRadius, innerBorderRadius, Color } from '~/constants/css';
import { User } from '~/types';

export default function SelectedCardDetail({
  isAICardModalShown,
  isShowing,
  selectedOption,
  cardIds,
  coins,
  onSetAICardModalCardId,
  partner
}: {
  isAICardModalShown: boolean;
  isShowing: boolean;
  selectedOption: string;
  cardIds: number[];
  coins: number;
  onSetAICardModalCardId: (v: number) => void;
  partner: User;
}) {
  const actionLabel = useMemo(() => {
    if (selectedOption === 'want') {
      if (isShowing) {
        return 'Show';
      } else {
        return 'Offer';
      }
    }
    if (selectedOption === 'offer') {
      return 'Show';
    }
    return 'Send';
  }, [isShowing, selectedOption]);
  const backgroundColor = useMemo(() => {
    if (selectedOption === 'want') {
      if (isShowing) {
        return Color.pink();
      }
      return 'transparent';
    }
    if (selectedOption === 'offer') {
      return Color.pink();
    }
    return Color.green();
  }, [isShowing, selectedOption]);

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius,
        border: `1px solid ${Color.borderGray()}`
      }}
    >
      <div
        style={{
          color: selectedOption === 'want' && !isShowing ? '#000' : '#fff',
          borderTopLeftRadius: innerBorderRadius,
          borderTopRightRadius: innerBorderRadius,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '1rem',
          background: backgroundColor,
          fontWeight: 'bold'
        }}
      >
        <span style={{ marginRight: '1rem' }}>
          {actionLabel} {partner.username}...
        </span>
        <Icon
          icon="arrow-up"
          color={actionLabel !== 'Offer' ? '#fff' : Color.red()}
        />
      </div>
      <div
        style={{
          width: '100%',
          borderTop: `1px solid ${Color.borderGray()}`,
          padding: '1rem',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column'
        }}
      >
        {!!coins && (
          <div
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <div style={{ fontWeight: 'bold' }}>
              <Icon
                style={{ color: Color.brownOrange() }}
                icon={['far', 'badge-dollar']}
              />{' '}
              <span style={{ color: Color.darkerGray() }}>
                {addCommasToNumber(coins)}
              </span>
            </div>
            {!!cardIds.length && <div style={{ padding: '1rem' }}>and</div>}
          </div>
        )}
        <AICardsPreview
          isOnModal
          isAICardModalShown={isAICardModalShown}
          cardIds={cardIds}
          onSetAICardModalCardId={onSetAICardModalCardId}
        />
      </div>
    </div>
  );
}
