import React, { useMemo } from 'react';
import AIDisabledNotice from '~/components/AIDisabledNotice';
import { useViewContext } from '~/contexts';
import { MAX_NUM_SUMMONS } from '~/constants/defaultValues';
import GradientButton from '~/components/Buttons/GradientButton';
import Icon from '~/components/Icon';

export default function GenerateCardInterface({
  numSummoned,
  canGenerateAICard,
  loading,
  onGenerateAICard,
  posting,
  energyDepleted,
  energyLoading
}: {
  numSummoned: number;
  canGenerateAICard: boolean;
  loading: boolean;
  onGenerateAICard: () => void;
  posting: boolean;
  energyDepleted: boolean;
  energyLoading: boolean;
}) {
  const AI_FEATURES_DISABLED = useViewContext(
    (v) => v.state.aiFeaturesDisabled
  );
  const maxSummoned = useMemo(
    () => numSummoned >= MAX_NUM_SUMMONS,
    [numSummoned]
  );
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
            energyDepleted ||
            energyLoading ||
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
          ) : energyLoading ? (
            'Checking Energy...'
          ) : energyDepleted ? (
            <div>
              <span style={{ marginRight: '0.7rem' }}>Recharge Energy</span>
              <Icon style={{ fontWeight: 'bold' }} icon="battery-empty" />
            </div>
          ) : posting ? (
            'Summoning...'
          ) : (
            <div>
              <span style={{ marginRight: '0.7rem' }}>Summon Card</span>
              <Icon style={{ fontWeight: 'bold' }} icon="bolt" />
            </div>
          )}
        </GradientButton>
      </div>
    </div>
  );
}
