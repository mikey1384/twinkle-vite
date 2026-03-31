import React, { useMemo } from 'react';
import AIDisabledNotice from '~/components/AIDisabledNotice';
import { useKeyContext, useViewContext } from '~/contexts';
import { MAX_NUM_SUMMONS, priceTable } from '~/constants/defaultValues';
import GradientButton from '~/components/Buttons/GradientButton';
import Icon from '~/components/Icon';

export default function GenerateCardInterface({
  numSummoned,
  canGenerateAICard,
  loading,
  onGenerateAICard,
  posting
}: {
  numSummoned: number;
  canGenerateAICard: boolean;
  loading: boolean;
  onGenerateAICard: () => void;
  posting: boolean;
}) {
  const AI_FEATURES_DISABLED = useViewContext(
    (v) => v.state.aiFeaturesDisabled
  );
  const maxSummoned = useMemo(
    () => numSummoned >= MAX_NUM_SUMMONS,
    [numSummoned]
  );
  const twinkleCoins = useKeyContext((v) => v.myState.twinkleCoins);
  const hasEnoughTwinkleCoins = twinkleCoins >= priceTable.card;

  if (AI_FEATURES_DISABLED) {
    return <AIDisabledNotice title="AI Card Generation Is Unavailable" />;
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <GradientButton
          loading={posting}
          disabled={
            !hasEnoughTwinkleCoins ||
            loading ||
            !canGenerateAICard ||
            maxSummoned
          }
          onClick={onGenerateAICard}
          fontSize="1.5rem"
          mobileFontSize="1.1rem"
        >
          {!canGenerateAICard ? (
            'Need License'
          ) : maxSummoned ? (
            'Daily Limit Reached'
          ) : !hasEnoughTwinkleCoins ? (
            <div>
              <span style={{ marginRight: '0.7rem' }}>Not Enough Coins</span>(
              <Icon
                style={{ fontWeight: 'bold', marginRight: '0.2rem' }}
                icon="coins"
              />
              {priceTable.card})
            </div>
          ) : posting ? (
            'Summoning...'
          ) : (
            <div>
              <span style={{ marginRight: '0.7rem' }}>Summon Card</span>(
              <Icon
                style={{ fontWeight: 'bold', marginRight: '0.2rem' }}
                icon="coins"
              />
              {priceTable.card})
            </div>
          )}
        </GradientButton>
      </div>
    </div>
  );
}
