import React from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import Modal from '~/components/Modal';
import NextDayCountdown from '~/components/NextDayCountdown';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import {
  FOCUS_OPTIONS,
  VIBE_OPTIONS,
  type FocusOptionId,
  type VibeOptionId
} from '../questionPreferences';
import {
  getFocusLabel,
  getFocusOptionDescription,
  getFocusOptionTitle,
  getVibeLabel
} from './helpers';
import PendingPaymentConfirmModal from './PendingPaymentConfirmModal';

export default function Preferences({
  availableTwinkleCoins,
  canChooseTomorrowPreferences,
  currentFocus,
  currentFocusPrice,
  doneColor,
  isAdultUser,
  isFocusModalOpen,
  isFocusSelectionFreeToday,
  isFollowUpSelected,
  isSettingFocus,
  isSettingVibe,
  isVibeModalOpen,
  nextCategory,
  onClose,
  ownedVibeSelections,
  pendingPayment,
  showAIVersionSelector,
  showVersionSelector,
  tomorrowVibePrice,
  onCloseFocusModal,
  onCloseVibeModal,
  onConfirmPendingPayment,
  onDismissPendingPayment,
  onOpenFocusModal,
  onOpenVibeModal,
  onSelectFocus,
  onSelectVibe
}: {
  availableTwinkleCoins: number;
  canChooseTomorrowPreferences: boolean;
  currentFocus: string | null;
  currentFocusPrice: number;
  doneColor: string;
  isAdultUser: boolean;
  isFocusModalOpen: boolean;
  isFocusSelectionFreeToday: (selection: FocusOptionId) => boolean;
  isFollowUpSelected: boolean;
  isSettingFocus: boolean;
  isSettingVibe: boolean;
  isVibeModalOpen: boolean;
  nextCategory: string | null;
  onClose: () => void;
  ownedVibeSelections: VibeOptionId[];
  pendingPayment: {
    type: 'vibe' | 'focus';
    selection: string;
    price: number;
  } | null;
  showAIVersionSelector: boolean;
  showVersionSelector: boolean;
  tomorrowVibePrice: number;
  onCloseFocusModal: () => void;
  onCloseVibeModal: () => void;
  onConfirmPendingPayment: () => void;
  onDismissPendingPayment: () => void;
  onOpenFocusModal: () => void;
  onOpenVibeModal: () => void;
  onSelectFocus: (selection: FocusOptionId) => void;
  onSelectVibe: (selection: VibeOptionId) => void;
}) {
  const pendingPaymentLabel = pendingPayment
    ? pendingPayment.type === 'vibe'
      ? getVibeLabel(pendingPayment.selection)
      : getFocusLabel(pendingPayment.selection, isAdultUser)
    : '';

  return (
    <>
      {canChooseTomorrowPreferences &&
        !showVersionSelector &&
        !showAIVersionSelector && (
          <div
            className={css`
              margin-top: 1.6rem;
              display: flex;
              flex-direction: column;
              gap: 1rem;
            `}
          >
            <button
              type="button"
              className={css`
                width: 100%;
                text-align: left;
                border: 1px solid ${Color.borderGray()};
                border-radius: 12px;
                background: ${Color.white()};
                padding: 1.2rem 1.3rem;
                cursor: pointer;
                &:hover {
                  border-color: ${Color.logoBlue(0.5)};
                }
              `}
              onClick={onOpenVibeModal}
            >
              <div
                className={css`
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  margin-bottom: 0.45rem;
                  gap: 1rem;
                `}
              >
                <div
                  className={css`
                    display: flex;
                    align-items: center;
                    gap: 0.6rem;
                    font-size: 1.3rem;
                    color: ${Color.black()};
                    font-weight: 700;
                  `}
                >
                  <Icon icon="sparkles" />
                  Tomorrow's Vibe
                </div>
                <div
                  className={css`
                    display: flex;
                    align-items: center;
                    gap: 0.35rem;
                    color: ${Color.orange()};
                    font-size: 1.15rem;
                    font-weight: 700;
                    flex-shrink: 0;
                  `}
                >
                  <Icon icon="coins" />
                  {tomorrowVibePrice.toLocaleString()}
                </div>
              </div>
              <p
                className={css`
                  margin: 0 0 0.7rem;
                  font-size: 1.15rem;
                  color: ${Color.darkerGray()};
                `}
              >
                Pick the style of tomorrow's reflection question.
              </p>
              <div
                className={css`
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  gap: 0.8rem;
                  font-size: 1.15rem;
                `}
              >
                <span
                  className={css`
                    color: ${Color.darkGray()};
                  `}
                >
                  Current selection
                </span>
                <span
                  className={css`
                    color: ${Color.black()};
                    font-weight: 700;
                  `}
                >
                  {getVibeLabel(nextCategory)}
                </span>
              </div>
            </button>

            <button
              type="button"
              className={css`
                width: 100%;
                text-align: left;
                border: 1px solid ${Color.borderGray()};
                border-radius: 12px;
                background: ${Color.white()};
                padding: 1.2rem 1.3rem;
                cursor: pointer;
                &:hover {
                  border-color: ${Color.purple(0.5)};
                }
              `}
              onClick={onOpenFocusModal}
            >
              <div
                className={css`
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  margin-bottom: 0.45rem;
                  gap: 1rem;
                `}
              >
                <div
                  className={css`
                    display: flex;
                    align-items: center;
                    gap: 0.6rem;
                    font-size: 1.3rem;
                    color: ${Color.black()};
                    font-weight: 700;
                  `}
                >
                  <Icon icon="magic" />
                  Current Focus
                </div>
                <div
                  className={css`
                    display: flex;
                    align-items: center;
                    gap: 0.35rem;
                    color: ${Color.orange()};
                    font-size: 1.15rem;
                    font-weight: 700;
                    flex-shrink: 0;
                  `}
                >
                  <Icon icon="coins" />
                  {currentFocusPrice.toLocaleString()}
                </div>
              </div>
              <p
                className={css`
                  margin: 0 0 0.7rem;
                  font-size: 1.15rem;
                  color: ${Color.darkerGray()};
                `}
              >
                Pick the main life area to focus on tomorrow.
              </p>
              {isFollowUpSelected && (
                <p
                  className={css`
                    margin: 0 0 0.7rem;
                    font-size: 1.05rem;
                    color: ${Color.orange()};
                    font-weight: 700;
                  `}
                >
                  Keep Going is selected, so Current Focus will be ignored for
                  tomorrow unless you change the vibe.
                </p>
              )}
              <div
                className={css`
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  gap: 0.8rem;
                  font-size: 1.15rem;
                `}
              >
                <span
                  className={css`
                    color: ${Color.darkGray()};
                  `}
                >
                  Current selection
                </span>
                <span
                  className={css`
                    color: ${Color.black()};
                    font-weight: 700;
                  `}
                >
                  {getFocusLabel(currentFocus, isAdultUser)}
                </span>
              </div>
            </button>
          </div>
        )}

      <NextDayCountdown
        label="Next Daily Reflection"
        className={css`
          margin-top: 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          color: ${Color.darkerGray()};
          font-size: 1.3rem;
        `}
        labelClassName={css`
          font-weight: 700;
          margin-bottom: 0.3rem;
          color: ${Color.black()};
        `}
        timerClassName={css`
          font-size: 1.4rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          color: ${Color.logoBlue()};
        `}
      />

      {!showVersionSelector && !showAIVersionSelector && (
        <div
          className={css`
            display: flex;
            justify-content: center;
            margin-top: 1.5rem;
          `}
        >
          <Button variant="solid" color={doneColor} onClick={onClose}>
            Done
          </Button>
        </div>
      )}

      <Modal
        modalKey="DailyQuestionVibeModal"
        isOpen={isVibeModalOpen}
        onClose={onCloseVibeModal}
        hasHeader
        title="Tomorrow's Vibe"
        size="md"
      >
        <div
          className={css`
            max-height: 55vh;
            overflow-y: auto;
            border: 1px solid ${Color.borderGray()};
            border-radius: 10px;
            > div:first-of-type > button {
              border-top: none;
            }
            > div:last-of-type > button {
              border-bottom: none;
            }
          `}
        >
          {VIBE_OPTIONS.map((option) => {
            const isSelected = (nextCategory || 'default') === option.id;
            const isPaidOption = option.id !== 'default';
            const isOwnedPaidOption =
              isPaidOption && ownedVibeSelections.includes(option.id);
            const requiresPayment = isPaidOption && !isOwnedPaidOption;
            const isDisabledForCoins =
              requiresPayment && availableTwinkleCoins < tomorrowVibePrice;
            const disabledReason = isDisabledForCoins
              ? `You don't have enough coins for this choice (need ${tomorrowVibePrice.toLocaleString()} coins).`
              : '';

            return (
              <div key={option.id} title={disabledReason || undefined}>
                <button
                  type="button"
                  className={css`
                    width: 100%;
                    text-align: left;
                    background: ${isSelected ? Color.logoBlue(0.07) : 'white'};
                    border: none;
                    border-bottom: 1px solid ${Color.borderGray()};
                    padding: 1rem 1rem;
                    opacity: ${isDisabledForCoins ? 0.55 : 1};
                    cursor: ${isDisabledForCoins ? 'not-allowed' : 'pointer'};
                    &:hover {
                      background: ${isDisabledForCoins
                        ? isSelected
                          ? Color.logoBlue(0.07)
                          : 'white'
                        : Color.wellGray()};
                    }
                  `}
                  onClick={() => onSelectVibe(option.id)}
                  disabled={isSettingVibe || isDisabledForCoins}
                >
                  <div
                    className={css`
                      display: flex;
                      justify-content: space-between;
                      align-items: center;
                      gap: 0.75rem;
                    `}
                  >
                    <div>
                      <div
                        className={css`
                          font-size: 1.25rem;
                          color: ${Color.black()};
                          font-weight: 700;
                          margin-bottom: 0.3rem;
                        `}
                      >
                        {option.title}
                      </div>
                      <div
                        className={css`
                          font-size: 1.1rem;
                          color: ${Color.darkerGray()};
                        `}
                      >
                        {option.description}
                      </div>
                    </div>
                    <div
                      className={css`
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        flex-shrink: 0;
                      `}
                    >
                      {requiresPayment && (
                        <span
                          className={css`
                            display: inline-flex;
                            align-items: center;
                            gap: 0.3rem;
                            font-size: 1.05rem;
                            color: ${Color.orange()};
                            font-weight: 700;
                          `}
                        >
                          <Icon icon="coins" />
                          {tomorrowVibePrice.toLocaleString()}
                        </span>
                      )}
                      {isSelected && <Icon icon="check" />}
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </Modal>

      <Modal
        modalKey="DailyQuestionFocusModal"
        isOpen={isFocusModalOpen}
        onClose={onCloseFocusModal}
        hasHeader
        title="Current Focus"
        size="md"
      >
        <div
          className={css`
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 0.8rem;
          `}
        >
          <div
            className={css`
              max-height: 55vh;
              overflow-y: auto;
              border: 1px solid ${Color.borderGray()};
              border-radius: 10px;
              > div:first-of-type > button {
                border-top: none;
              }
              > div:last-of-type > button {
                border-bottom: none;
              }
            `}
          >
            {FOCUS_OPTIONS.map((option) => {
              const isSelected = (currentFocus || 'infer') === option.id;
              const isPaidOption = option.id !== 'infer';
              const isFreeToday =
                isPaidOption && isFocusSelectionFreeToday(option.id);
              const requiresPayment =
                isPaidOption && !isFreeToday && !isSelected;
              const isDisabledForCoins =
                requiresPayment && availableTwinkleCoins < currentFocusPrice;
              const disabledReason = isDisabledForCoins
                ? `You don't have enough coins for this choice (need ${currentFocusPrice.toLocaleString()} coins).`
                : '';

              return (
                <div key={option.id} title={disabledReason || undefined}>
                  <button
                    type="button"
                    className={css`
                      width: 100%;
                      text-align: left;
                      background: ${isSelected
                        ? Color.logoBlue(0.07)
                        : 'white'};
                      border: none;
                      border-bottom: 1px solid ${Color.borderGray()};
                      padding: 1rem 1rem;
                      opacity: ${isDisabledForCoins ? 0.55 : 1};
                      cursor: ${isDisabledForCoins ? 'not-allowed' : 'pointer'};
                      &:hover {
                        background: ${isDisabledForCoins
                          ? isSelected
                            ? Color.logoBlue(0.07)
                            : 'white'
                          : Color.wellGray()};
                      }
                    `}
                    onClick={() => onSelectFocus(option.id)}
                    disabled={isSettingFocus || isDisabledForCoins}
                  >
                    <div
                      className={css`
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        gap: 0.75rem;
                      `}
                    >
                      <div>
                        <div
                          className={css`
                            font-size: 1.25rem;
                            color: ${Color.black()};
                            font-weight: 700;
                            margin-bottom: 0.3rem;
                          `}
                        >
                          {getFocusOptionTitle(option, isAdultUser)}
                        </div>
                        <div
                          className={css`
                            font-size: 1.1rem;
                            color: ${Color.darkerGray()};
                          `}
                        >
                          {getFocusOptionDescription(option, isAdultUser)}
                        </div>
                      </div>
                      <div
                        className={css`
                          display: flex;
                          align-items: center;
                          gap: 0.5rem;
                          flex-shrink: 0;
                        `}
                      >
                        {requiresPayment && (
                          <span
                            className={css`
                              display: inline-flex;
                              align-items: center;
                              gap: 0.3rem;
                              font-size: 1.05rem;
                              color: ${Color.orange()};
                              font-weight: 700;
                            `}
                          >
                            <Icon icon="coins" />
                            {currentFocusPrice.toLocaleString()}
                          </span>
                        )}
                        {isSelected && <Icon icon="check" />}
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </Modal>

      {pendingPayment && (
        <PendingPaymentConfirmModal
          label={pendingPaymentLabel}
          price={pendingPayment.price}
          availableTwinkleCoins={availableTwinkleCoins}
          onHide={onDismissPendingPayment}
          onConfirm={onConfirmPendingPayment}
        />
      )}
    </>
  );
}
