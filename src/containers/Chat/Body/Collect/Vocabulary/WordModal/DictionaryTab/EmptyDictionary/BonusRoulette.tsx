import React, { memo, useCallback, useMemo } from 'react';
import { css } from '@emotion/css';
import { vocabRouletteChances } from '~/constants/defaultValues';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts/hooks';
import Icon from '~/components/Icon';
import Roulette, { RouletteResolveResult, RouletteSegment } from '~/components/Roulette';

function BonusRoulette({
  word,
  onAIDefinitionsGenerated,
  onWordMasterBreak
}: {
  word: string;
  onAIDefinitionsGenerated: (data: {
    partOfSpeechOrder: string[];
    partOfSpeeches: any;
  }) => void;
  onWordMasterBreak?: (status: any) => void;
}) {
  const userId = useKeyContext((v) => v.myState.userId);
  const twinkleCoins = useKeyContext((v) => v.myState.twinkleCoins);
  const onInsertBlackAICardUpdateLog = useChatContext(
    (v) => v.actions.onInsertBlackAICardUpdateLog
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const getVocabRouletteResult = useAppContext(
    (v) => v.requestHelpers.getVocabRouletteResult
  );

  const segments = useMemo<RouletteSegment[]>(
    () => [
      {
        key: 'better_luck',
        label: 'Too Bad',
        weight: vocabRouletteChances.better_luck,
        gradient: ['#4f4f4f', '#2f2f2f']
      },
      {
        key: 'coins_500',
        label: '500',
        weight: vocabRouletteChances.coins_500,
        gradient: ['#4A90E2', '#357ABD']
      },
      {
        key: 'coins_1000',
        label: '1,000',
        weight: vocabRouletteChances.coins_1000,
        gradient: ['#FF1493', '#FF69B4']
      },
      {
        key: 'ai_card',
        label: 'AI Card',
        weight: vocabRouletteChances.ai_card,
        gradient: ['#FFD700', '#FFA500']
      }
    ],
    []
  );

  const resolveOutcome = useCallback(async (): Promise<
    RouletteResolveResult<{ coins?: number }>
  > => {
    const result = await getVocabRouletteResult({ word });
    if (result?.wordMasterBreak) {
      onWordMasterBreak?.(result.wordMasterBreak);
      return { type: 'cancel' };
    }

    const { coins, message, outcome, partOfSpeechOrder, partOfSpeeches } =
      result;

    onAIDefinitionsGenerated({
      partOfSpeechOrder,
      partOfSpeeches
    });

    return {
      type: 'outcome',
      outcome: {
        outcomeKey: outcome,
        message,
        data: { coins }
      }
    };
  }, [
    getVocabRouletteResult,
    onAIDefinitionsGenerated,
    onWordMasterBreak,
    word
  ]);

  const costLabel = useMemo(() => {
    if (twinkleCoins < 500) return null;
    return (
      <div className={costTextStyles}>
        Wager: <Icon icon="coins" /> 500
      </div>
    );
  }, [twinkleCoins]);

  return (
    <Roulette
      segments={segments}
      spinButtonDisabled={twinkleCoins < 500}
      spinButtonLabel="Spin the Wheel"
      spinButtonDisabledLabel={
        <>
          <Icon icon="coins" /> 500
        </>
      }
      costLabel={costLabel}
      onResolveOutcome={resolveOutcome}
      onError={(error) => {
        onInsertBlackAICardUpdateLog(
          (error as any)?.message || 'Something went wrong'
        );
      }}
      onSpinComplete={(outcome) => {
        if (outcome.outcomeKey === 'ai_card') {
          onInsertBlackAICardUpdateLog('Summoning AI Card...');
        }
        const coins = (outcome.data as any)?.coins;
        if (typeof coins === 'number') {
          onSetUserState({
            userId,
            newState: { twinkleCoins: coins }
          });
        }
      }}
    />
  );
}

export default memo(BonusRoulette);

const costTextStyles = css`
  font-size: 1.2rem;
  color: #666;
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.3rem;
`;
