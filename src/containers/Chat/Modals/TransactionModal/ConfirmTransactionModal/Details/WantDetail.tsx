import React from 'react';
import Icon from '~/components/Icon';
import AICardsPreview from '~/components/AICardsPreview';
import SelectedGroups from '../../SelectedGroups';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { borderRadius, Color } from '~/constants/css';

export default function WantDetail({
  isAICardModalShown,
  isExpressingInterest,
  cardIds,
  groupIds,
  coins,
  onSetAICardModalCardId,
  groupObjs
}: {
  isAICardModalShown: boolean;
  isExpressingInterest: boolean;
  cardIds: number[];
  groupIds: number[];
  coins: number;
  onSetAICardModalCardId: (cardId: number) => void;
  groupObjs: Record<number, any>;
}) {
  const selectedGroups = groupIds.map((id) => groupObjs[id]).filter(Boolean);

  return (
    <div
      style={{
        marginBottom: '2rem',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius,
        border: `1px solid ${Color.borderGray()}`
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '1rem',
          fontWeight: 'bold'
        }}
      >
        <span style={{ marginRight: '1rem' }}>
          {isExpressingInterest
            ? 'Express interest in...'
            : 'In exchange for...'}
        </span>
        <Icon icon="arrow-down" color={Color.green()} />
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
            {(!!cardIds.length || !!selectedGroups.length) && (
              <div style={{ padding: '1rem' }}>and</div>
            )}
          </div>
        )}
        <AICardsPreview
          isOnModal
          isAICardModalShown={isAICardModalShown}
          cardIds={cardIds}
          onSetAICardModalCardId={onSetAICardModalCardId}
        />
        {!!selectedGroups.length && (
          <div style={{ width: '100%', marginTop: '1rem' }}>
            <SelectedGroups
              selectedGroups={selectedGroups}
              isConfirmationView
            />
          </div>
        )}
      </div>
    </div>
  );
}
