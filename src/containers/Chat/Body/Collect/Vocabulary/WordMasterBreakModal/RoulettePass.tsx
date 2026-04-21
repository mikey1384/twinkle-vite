import React, { useRef, useState } from 'react';
import { css } from '@emotion/css';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import Roulette, { RouletteResolveResult } from '~/components/Roulette';
import { Color } from '~/constants/css';
import { BREAK_PASS_ROULETTE_SEGMENTS } from './utils';

export default function RoulettePass({
  onSpinRoulette,
  onRefresh,
  onClose
}: {
  onSpinRoulette: () => Promise<any>;
  onRefresh: () => Promise<void>;
  onClose: () => void;
}) {
  const [spinComplete, setSpinComplete] = useState(false);
  const [rolledOutcome, setRolledOutcome] = useState<string | null>(null);
  const pendingResultRef = useRef<{
    cleared?: boolean;
  } | null>(null);

  return (
    <section
      className={css`
        padding: 1.8rem;
        border-radius: 1.2rem;
        border: 1px solid ${Color.borderGray()};
        background: ${Color.white()};
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.2rem;
        box-shadow: 0 10px 20px ${Color.black(0.04)};
      `}
    >
      <div
        className={css`
          font-size: 1.5rem;
          font-weight: 700;
          color: ${Color.darkerGray()};
          text-align: center;
        `}
      >
        Spin to set your bypass price
      </div>
      <div
        className={css`
          font-size: 1.2rem;
          color: ${Color.gray()};
          text-align: center;
          max-width: 320px;
        `}
      >
        Spin the wheel to determine your break pass price for today. You might
        get lucky!
      </div>
      <Roulette
        segments={BREAK_PASS_ROULETTE_SEGMENTS}
        spinButtonLabel="Spin for Price"
        onResolveOutcome={handleResolveOutcome}
        onSpinComplete={handleSpinComplete}
        wheelSize={220}
      />
      {spinComplete ? (
        <GameCTAButton
          variant={rolledOutcome === 'discount' ? 'success' : 'neutral'}
          icon="arrow-right"
          shiny
          onClick={handleContinue}
        >
          Continue
        </GameCTAButton>
      ) : null}
    </section>
  );

  async function handleResolveOutcome(): Promise<
    RouletteResolveResult<{ price?: number; cleared?: boolean }>
  > {
    try {
      const minWarmupMs = 1200;
      const [result] = await Promise.all([
        onSpinRoulette(),
        new Promise((resolve) => setTimeout(resolve, minWarmupMs))
      ]);
      const price = result?.price ?? 0;
      const outcome = result?.outcome ?? 'full';
      pendingResultRef.current = { cleared: result?.cleared };

      return {
        type: 'outcome',
        outcome: {
          outcomeKey: outcome,
          message: result?.message || '',
          data: { price, cleared: result?.cleared }
        }
      };
    } catch (error) {
      console.error('Failed to spin roulette:', error);
      return { type: 'cancel' };
    }
  }

  function handleSpinComplete(outcome: { outcomeKey: string }) {
    const pending = pendingResultRef.current;
    setRolledOutcome(outcome.outcomeKey);
    if (pending?.cleared) {
      onRefresh().then(() => onClose());
    } else {
      setSpinComplete(true);
    }
  }

  function handleContinue() {
    onRefresh();
  }
}
