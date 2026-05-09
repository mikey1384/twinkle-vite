import React from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
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
          <Button
            variant="solid"
            color="logoBlue"
            onClick={onShareClick}
            disabled={!canShareToFeedNow || refining}
            loading={canShareToFeedNow && refining && !preparingAIVersionTarget}
          >
            {!canShareToFeedNow ? (
              <>
                <Icon icon="check" style={{ marginRight: '0.5rem' }} />
                Shared to Feed
              </>
            ) : refining && !preparingAIVersionTarget ? (
              'Polishing...'
            ) : refinedResponse ? (
              <>
                <Icon icon="share" style={{ marginRight: '0.5rem' }} />
                Share to Feed
              </>
            ) : (
              <>
                <Icon icon="magic" style={{ marginRight: '0.5rem' }} />
                See AI Polished Version
              </>
            )}
          </Button>
          {canShareToFeedNow && refinedResponse && (
            <span
              className={css`
                margin-top: 0.4rem;
                font-size: 1.1rem;
                color: ${Color.orange()};
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
            <Button
              color="logoBlue"
              variant="solid"
              tone="raised"
              onClick={() => onShareWithAI('zero')}
              disabled={
                !canShareWithZero ||
                sharingWithCiel ||
                sharingWithZero ||
                preparingAIVersionTarget !== null
              }
              loading={
                sharingWithZero ||
                (preparingAIVersionTarget === 'zero' &&
                  refining &&
                  !refinedResponse)
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
                  <Icon icon="check" style={{ marginRight: '0.5rem' }} />
                  Shared with Zero
                </>
              ) : sharingWithZero ? (
                'Sharing with Zero...'
              ) : (
                'Share with Zero'
              )}
            </Button>
            {canShareWithZero && canGetAIShareCoins && (
              <span
                className={css`
                  margin-top: 0.4rem;
                  font-size: 1.1rem;
                  color: ${Color.orange()};
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
            <Button
              color="purple"
              variant="solid"
              tone="raised"
              onClick={() => onShareWithAI('ciel')}
              disabled={
                !canShareWithCiel ||
                sharingWithCiel ||
                sharingWithZero ||
                preparingAIVersionTarget !== null
              }
              loading={
                sharingWithCiel ||
                (preparingAIVersionTarget === 'ciel' &&
                  refining &&
                  !refinedResponse)
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
                  <Icon icon="check" style={{ marginRight: '0.5rem' }} />
                  Shared with Ciel
                </>
              ) : sharingWithCiel ? (
                'Sharing with Ciel...'
              ) : (
                'Share with Ciel'
              )}
            </Button>
            {canShareWithCiel && canGetAIShareCoins && (
              <span
                className={css`
                  margin-top: 0.4rem;
                  font-size: 1.1rem;
                  color: ${Color.orange()};
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
          <Button
            style={{ marginRight: '2rem' }}
            variant="ghost"
            onClick={onCancelVersionSelector}
          >
            Go Back
          </Button>
          <div
            className={css`
              display: flex;
              flex-direction: column;
              align-items: center;
            `}
          >
            <Button
              variant="solid"
              color="logoBlue"
              onClick={onConfirmShare}
              disabled={sharing}
              loading={sharing}
            >
              <Icon icon="share" style={{ marginRight: '0.5rem' }} />
              {sharing ? 'Sharing...' : 'Share to Feed'}
            </Button>
            <span
              className={css`
                margin-top: 0.4rem;
                font-size: 1.1rem;
                color: ${Color.orange()};
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
          <Button variant="ghost" onClick={onCancelAIVersionSelector}>
            Go Back
          </Button>
          <Button
            variant="solid"
            color={aiShareTarget === 'ciel' ? 'purple' : 'logoBlue'}
            onClick={onConfirmShareWithAI}
            disabled={sharingWithZero || sharingWithCiel}
            loading={aiShareTarget === 'zero' ? sharingWithZero : sharingWithCiel}
          >
            <Icon icon="share" style={{ marginRight: '0.5rem' }} />
            {aiShareTarget === 'zero'
              ? sharingWithZero
                ? 'Sharing with Zero...'
                : 'Confirm Share with Zero'
              : sharingWithCiel
                ? 'Sharing with Ciel...'
                : 'Confirm Share with Ciel'}
          </Button>
        </>
      )}
    </div>
  );
}
