import React from 'react';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import {
  PAPER,
  paperPrimaryButtonCls,
  paperSecondaryButtonCls,
  paperTextButtonCls
} from '../../paperTheme';
import ciel from '~/assets/ciel.png';
import zero from '~/assets/zero.png';

export default function ShareActions({
  aiShareTarget,
  canGetAIShareCoins,
  canShareToAI,
  canShareToFeed,
  canShareToFeedNow,
  canShareWithCiel,
  canShareWithZero,
  preparingAIVersionTarget,
  refinedResponse,
  shareCoinsReward,
  sharing,
  sharingWithCiel,
  sharingWithZero,
  showAIVersionSelector,
  showVersionSelector,
  refining,
  onCancelAIVersionSelector,
  onCancelVersionSelector,
  onConfirmShare,
  onConfirmShareWithAI,
  onShareClick,
  onShareWithAI
}: {
  aiShareTarget: 'zero' | 'ciel' | null;
  canGetAIShareCoins: boolean;
  canShareToAI: boolean;
  canShareToFeed: boolean;
  canShareToFeedNow: boolean;
  canShareWithCiel: boolean;
  canShareWithZero: boolean;
  preparingAIVersionTarget: 'zero' | 'ciel' | null;
  refinedResponse: string | null;
  shareCoinsReward: number;
  sharing: boolean;
  sharingWithCiel: boolean;
  sharingWithZero: boolean;
  showAIVersionSelector: boolean;
  showVersionSelector: boolean;
  refining: boolean;
  onCancelAIVersionSelector: () => void;
  onCancelVersionSelector: () => void;
  onConfirmShare: () => void;
  onConfirmShareWithAI: () => void;
  onShareClick: () => void;
  onShareWithAI: (target: 'zero' | 'ciel') => void;
}) {
  return (
    <div
      className={css`
        display: flex;
        justify-content: center;
        gap: 1rem;
        flex-wrap: wrap;
        padding-top: 1.5rem;
      `}
    >
      {canShareToFeed && !showVersionSelector && !showAIVersionSelector && (
        <div
          className={css`
            display: flex;
            flex-direction: column;
            align-items: center;
          `}
        >
          <button
            type="button"
            className={paperPrimaryButtonCls}
            onClick={onShareClick}
            disabled={!canShareToFeedNow || refining || sharing}
          >
            {!canShareToFeedNow ? (
              <>
                <Icon icon="check" />
                Shared to Feed
              </>
            ) : sharing ? (
              'Sharing...'
            ) : refining && !preparingAIVersionTarget ? (
              'Polishing...'
            ) : refinedResponse ? (
              <>
                <Icon icon="share" />
                Share to Feed
              </>
            ) : (
              <>
                <Icon icon="magic" />
                See AI Polished Version
              </>
            )}
          </button>
          {canShareToFeedNow && refinedResponse && (
            <span
              className={css`
                margin-top: 0.4rem;
                font-size: 1.1rem;
                color: ${PAPER.accent};
                font-weight: 600;
              `}
            >
              +{shareCoinsReward.toLocaleString()} coins
            </span>
          )}
        </div>
      )}

      {!showVersionSelector && !showAIVersionSelector && canShareToAI && (
        <>
          <div
            className={css`
              display: flex;
              flex-direction: column;
              align-items: center;
            `}
          >
            <button
              type="button"
              className={paperSecondaryButtonCls}
              onClick={() => onShareWithAI('zero')}
              disabled={
                !canShareWithZero ||
                sharingWithCiel ||
                sharingWithZero ||
                preparingAIVersionTarget !== null
              }
            >
              <img
                src={zero}
                alt="Zero"
                className={css`
                  width: 2rem;
                  height: 2rem;
                  border-radius: 50%;
                  margin-right: 0.5rem;
                  object-fit: contain;
                  background: #fff;
                `}
              />
              {!canShareWithZero ? (
                <>
                  <Icon icon="check" />
                  Shared with Zero
                </>
              ) : sharingWithZero ? (
                'Sharing with Zero...'
              ) : (
                'Share with Zero'
              )}
            </button>
            {canShareWithZero && canGetAIShareCoins && (
              <span
                className={css`
                  margin-top: 0.4rem;
                  font-size: 1.1rem;
                  color: ${PAPER.accent};
                  font-weight: 600;
                `}
              >
                +{shareCoinsReward.toLocaleString()} coins
              </span>
            )}
          </div>

          <div
            className={css`
              display: flex;
              flex-direction: column;
              align-items: center;
            `}
          >
            <button
              type="button"
              className={paperSecondaryButtonCls}
              onClick={() => onShareWithAI('ciel')}
              disabled={
                !canShareWithCiel ||
                sharingWithCiel ||
                sharingWithZero ||
                preparingAIVersionTarget !== null
              }
            >
              <img
                src={ciel}
                alt="Ciel"
                className={css`
                  width: 2rem;
                  height: 2rem;
                  border-radius: 50%;
                  margin-right: 0.5rem;
                  object-fit: contain;
                  background: #fff;
                `}
              />
              {!canShareWithCiel ? (
                <>
                  <Icon icon="check" />
                  Shared with Ciel
                </>
              ) : sharingWithCiel ? (
                'Sharing with Ciel...'
              ) : (
                'Share with Ciel'
              )}
            </button>
            {canShareWithCiel && canGetAIShareCoins && (
              <span
                className={css`
                  margin-top: 0.4rem;
                  font-size: 1.1rem;
                  color: ${PAPER.accent};
                  font-weight: 600;
                `}
              >
                +{shareCoinsReward.toLocaleString()} coins
              </span>
            )}
          </div>
        </>
      )}

      {showVersionSelector && (
        <>
          <button
            type="button"
            className={paperTextButtonCls}
            onClick={onCancelVersionSelector}
            style={{ marginRight: '2rem' }}
          >
            Go Back
          </button>
          <div
            className={css`
              display: flex;
              flex-direction: column;
              align-items: center;
            `}
          >
            <button
              type="button"
              className={paperPrimaryButtonCls}
              onClick={onConfirmShare}
              disabled={sharing}
            >
              <Icon icon="share" />
              {sharing ? 'Sharing...' : 'Share to Feed'}
            </button>
            <span
              className={css`
                margin-top: 0.4rem;
                font-size: 1.1rem;
                color: ${PAPER.accent};
                font-weight: 600;
              `}
            >
              +{shareCoinsReward.toLocaleString()} coins
            </span>
          </div>
        </>
      )}

      {showAIVersionSelector && aiShareTarget && (
        <>
          <button
            type="button"
            className={paperTextButtonCls}
            onClick={onCancelAIVersionSelector}
          >
            Go Back
          </button>
          <button
            type="button"
            className={paperPrimaryButtonCls}
            onClick={onConfirmShareWithAI}
            disabled={sharingWithZero || sharingWithCiel}
          >
            <Icon icon="share" />
            {aiShareTarget === 'zero'
              ? sharingWithZero
                ? 'Sharing with Zero...'
                : 'Confirm Share with Zero'
              : sharingWithCiel
                ? 'Sharing with Ciel...'
                : 'Confirm Share with Ciel'}
          </button>
        </>
      )}
    </div>
  );
}
