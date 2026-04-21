import React from 'react';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import ErrorBoundary from '~/components/ErrorBoundary';
import Icon from '~/components/Icon';
import Modal from '~/components/Modal';
import NextDayCountdown from '~/components/NextDayCountdown';
import { Color } from '~/constants/css';
import RoulettePass from './RoulettePass';
import { BreakAccent } from './types';
import { formatCoins } from './utils';

export default function Content({
  actionLoading,
  body,
  bypassCost,
  canBypass,
  canClearRequirement,
  confirmBypassShown,
  hasActiveBreak,
  hasRolledPrice,
  isOpen,
  loading,
  modalTitle,
  onClear,
  onClose,
  onConfirmBypass,
  onCountdownComplete,
  onModalClose,
  onRefresh,
  onSetConfirmBypassShown,
  onSpinRoulette,
  rolledPrice,
  statusIsError,
  statusMessage,
  strikeBlurb,
  summaryAccent,
  summaryLabel
}: {
  actionLoading: boolean;
  body: React.ReactNode;
  bypassCost: number;
  canBypass: boolean;
  canClearRequirement: boolean;
  confirmBypassShown: boolean;
  hasActiveBreak: boolean;
  hasRolledPrice: boolean;
  isOpen: boolean;
  loading?: boolean;
  modalTitle: string;
  onClear: () => void;
  onClose: () => void;
  onConfirmBypass: () => void;
  onCountdownComplete: () => void;
  onModalClose: () => void;
  onRefresh: () => Promise<void>;
  onSetConfirmBypassShown: (shown: boolean) => void;
  onSpinRoulette: () => Promise<any>;
  rolledPrice: number | null;
  statusIsError: boolean;
  statusMessage: string;
  strikeBlurb: string;
  summaryAccent: BreakAccent;
  summaryLabel: string;
}) {
  return (
    <ErrorBoundary componentPath="Chat/Body/Collect/Vocabulary/WordMasterBreakModal">
      <Modal
        modalKey="WordMasterBreakModal/Main"
        isOpen={isOpen}
        onClose={onModalClose}
        title={modalTitle}
        size="lg"
        closeOnBackdropClick
        showCloseButton
        allowOverflow
      >
        <div
          className={css`
            display: flex;
            flex-direction: column;
            gap: 1.8rem;
          `}
        >
          <section
            className={css`
              padding: 1.4rem 1.6rem;
              border-radius: 1.2rem;
              background: ${Color.white()};
              border: 1px solid ${Color.borderGray()};
              display: flex;
              flex-direction: column;
              gap: 1rem;
              box-shadow: 0 10px 24px ${Color.black(0.06)};
            `}
          >
            <div
              className={css`
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                justify-content: space-between;
                gap: 1rem;
              `}
            >
              <div
                className={css`
                  display: flex;
                  align-items: center;
                  gap: 0.9rem;
                  flex-wrap: wrap;
                `}
              >
                <div
                  className={css`
                    width: 3.1rem;
                    height: 3.1rem;
                    border-radius: 1rem;
                    background: ${summaryAccent.soft};
                    color: ${summaryAccent.main};
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.6rem;
                  `}
                >
                  <Icon icon={hasActiveBreak ? 'lock' : 'sparkles'} />
                </div>
                <div
                  className={css`
                    padding: 0.35rem 1rem;
                    border-radius: 999px;
                    background: ${summaryAccent.soft};
                    color: ${summaryAccent.main};
                    font-size: 1.2rem;
                    font-weight: 800;
                    letter-spacing: 0.02em;
                  `}
                >
                  {summaryLabel}
                </div>
              </div>
            </div>
            <div
              className={css`
                padding: 0.9rem 1.1rem;
                border-radius: 1rem;
                border: 1px solid ${Color.borderGray()};
                background: ${Color.whiteGray()};
                font-size: 1.15rem;
                color: ${Color.darkGray()};
                font-weight: 600;
                line-height: 1.5;
              `}
            >
              {strikeBlurb}
            </div>
          </section>

          {body}

          {statusMessage ? (
            <div
              className={css`
                font-size: 1.3rem;
                color: ${statusIsError ? Color.rose() : Color.darkerGray()};
                font-weight: 600;
                text-align: center;
                ${statusIsError
                  ? `
                  background: ${Color.rose(0.1)};
                  padding: 0.8rem 1rem;
                  border-radius: 8px;
                  border: 1px solid ${Color.rose(0.3)};
                  margin: 0.5rem 0;
                `
                  : ''}
              `}
            >
              {statusMessage}
            </div>
          ) : null}

          {canClearRequirement ? (
            <div
              className={css`
                display: flex;
                justify-content: center;
                padding: 0.9rem 1.4rem;
              `}
            >
              <GameCTAButton
                variant="success"
                icon="arrow-right"
                shiny
                size="lg"
                disabled={actionLoading || loading}
                loading={actionLoading}
                onClick={onClear}
              >
                Keep Collecting Words
              </GameCTAButton>
            </div>
          ) : (
            <>
              {hasActiveBreak && !hasRolledPrice ? (
                <RoulettePass
                  onSpinRoulette={onSpinRoulette}
                  onRefresh={onRefresh}
                  onClose={onClose}
                />
              ) : null}
              <div
                className={css`
                  display: grid;
                  grid-auto-flow: column;
                  align-items: center;
                  justify-content: center;
                  column-gap: 1.2rem;
                  padding: 0.9rem 1.4rem;
                  text-align: center;
                  border-radius: 1rem;
                  background: ${summaryAccent.soft};
                  border: 1px solid ${summaryAccent.main};
                `}
              >
                <Icon
                  icon="clock"
                  style={{ color: summaryAccent.main, fontSize: '1.7rem' }}
                />
                <NextDayCountdown
                  label="Next reset"
                  onComplete={onCountdownComplete}
                  className={css`
                    display: grid;
                    grid-auto-rows: max-content;
                    row-gap: 0.35rem;
                    font-size: 1.45rem;
                    font-weight: 700;
                    color: ${Color.black(0.75)};
                    line-height: 1.2;
                    text-align: center;
                  `}
                  timerClassName={css`
                    font-family: 'Fira Code', 'Roboto Mono', monospace;
                    font-size: 2.1rem;
                    font-weight: 700;
                    letter-spacing: 0.05em;
                    color: ${summaryAccent.main};
                  `}
                />
              </div>
            </>
          )}

          <div
            className={css`
              display: flex;
              flex-wrap: wrap;
              gap: 1rem;
              justify-content: flex-end;
            `}
          >
            {!canClearRequirement ? (
              <Button variant="ghost" onClick={onModalClose}>
                Close
              </Button>
            ) : null}
            {hasActiveBreak && !canClearRequirement && hasRolledPrice ? (
              <GameCTAButton
                variant="gold"
                icon="coins"
                shiny
                disabled={!canBypass || actionLoading || loading}
                onClick={() => onSetConfirmBypassShown(true)}
              >
                {`Pay ${formatCoins(rolledPrice ?? bypassCost)} coins to bypass`}
              </GameCTAButton>
            ) : null}
          </div>
        </div>
      </Modal>
      {confirmBypassShown ? (
        <Modal
          modalKey="WordMasterBreakModal/ConfirmBypass"
          isOpen={confirmBypassShown}
          onClose={() => onSetConfirmBypassShown(false)}
          title="Confirm Bypass"
          size="sm"
          closeOnBackdropClick
          showCloseButton
        >
          <div
            className={css`
              display: flex;
              flex-direction: column;
              gap: 1.5rem;
            `}
          >
            <div
              className={css`
                font-size: 1.4rem;
                color: ${Color.darkerGray()};
                text-align: center;
                line-height: 1.5;
              `}
            >
              Are you sure you want to spend{' '}
              <strong style={{ color: Color.orange() }}>
                {formatCoins(rolledPrice ?? bypassCost)} coins
              </strong>{' '}
              to bypass this break?
            </div>
            <div
              className={css`
                display: flex;
                gap: 1rem;
                justify-content: center;
              `}
            >
              <Button
                variant="ghost"
                onClick={() => onSetConfirmBypassShown(false)}
              >
                Cancel
              </Button>
              <GameCTAButton
                variant="gold"
                icon="coins"
                shiny
                disabled={actionLoading || loading}
                loading={actionLoading}
                onClick={onConfirmBypass}
              >
                Confirm
              </GameCTAButton>
            </div>
          </div>
        </Modal>
      ) : null}
    </ErrorBoundary>
  );
}
