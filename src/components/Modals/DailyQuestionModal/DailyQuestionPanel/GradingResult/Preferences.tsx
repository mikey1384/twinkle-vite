import React from 'react';
import Icon from '~/components/Icon';
import NextDayCountdown from '~/components/NextDayCountdown';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import {
  FOCUS_OPTIONS,
  VIBE_OPTIONS,
  type FocusOptionId,
  type VibeOptionId
} from '../helpers/questionPreferences';
import {
  getFocusLabel,
  getFocusOptionDescription,
  getFocusOptionTitle,
  getVibeLabel
} from './helpers';
import PendingPaymentConfirmModal from './PendingPaymentConfirmModal';
import { PAPER, paperPrimaryButtonCls } from '../../paperTheme';

// Classic's choices for tomorrow, in Daily Reflection's paper style (Mikey
// 2026-10-12). On the full page the option lists open in place under each
// card instead of in pop-up modals; the coin confirmation stays a modal.
export default function Preferences({
  availableTwinkleCoins,
  canChooseTomorrowPreferences,
  currentFocus,
  currentFocusPrice,
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
  doneColor?: string;
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
  const selectorsHidden = showVersionSelector || showAIVersionSelector;

  return (
    <>
      {canChooseTomorrowPreferences && !selectorsHidden && (
        <section className={sectionCls}>
          <div className={sectionTitleCls}>For tomorrow</div>
          <div className={cardsCls}>
            <div className={cardWrapCls}>
              <button
                type="button"
                className={cardCls(isVibeModalOpen)}
                onClick={isVibeModalOpen ? onCloseVibeModal : onOpenVibeModal}
                aria-expanded={isVibeModalOpen}
              >
                <span className={cardHeadCls}>
                  <span className={cardNameCls}>
                    <Icon icon="sparkles" /> Tomorrow’s vibe
                  </span>
                  <span className={priceCls}>
                    <Icon icon="coins" /> {tomorrowVibePrice.toLocaleString()}
                  </span>
                </span>
                <span className={cardHintCls}>
                  The style of tomorrow’s question.
                </span>
                <span className={cardValueCls}>
                  {getVibeLabel(nextCategory)}
                  <Icon
                    icon={isVibeModalOpen ? 'chevron-up' : 'chevron-down'}
                  />
                </span>
              </button>
              {isVibeModalOpen && (
                <div className={optionListCls}>
                  {VIBE_OPTIONS.map((option) => {
                    const isSelected =
                      (nextCategory || 'default') === option.id;
                    const isPaidOption = option.id !== 'default';
                    const isOwnedPaidOption =
                      isPaidOption && ownedVibeSelections.includes(option.id);
                    const requiresPayment = isPaidOption && !isOwnedPaidOption;
                    const isDisabledForCoins =
                      requiresPayment &&
                      availableTwinkleCoins < tomorrowVibePrice;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        className={optionCls(isSelected)}
                        onClick={() => onSelectVibe(option.id)}
                        disabled={isSettingVibe || isDisabledForCoins}
                        title={
                          isDisabledForCoins
                            ? `You don't have enough coins for this choice (need ${tomorrowVibePrice.toLocaleString()} coins).`
                            : undefined
                        }
                      >
                        <span className={optionTextCls}>
                          <span className={optionTitleCls}>{option.title}</span>
                          <span className={optionDescCls}>
                            {option.description}
                          </span>
                        </span>
                        <span className={optionMetaCls}>
                          {requiresPayment && (
                            <span className={priceCls}>
                              <Icon icon="coins" />{' '}
                              {tomorrowVibePrice.toLocaleString()}
                            </span>
                          )}
                          {isSelected && (
                            <Icon icon="check" style={{ color: PAPER.done }} />
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className={cardWrapCls}>
              <button
                type="button"
                className={cardCls(isFocusModalOpen)}
                onClick={
                  isFocusModalOpen ? onCloseFocusModal : onOpenFocusModal
                }
                aria-expanded={isFocusModalOpen}
              >
                <span className={cardHeadCls}>
                  <span className={cardNameCls}>
                    <Icon icon="magic" /> Current focus
                  </span>
                  <span className={priceCls}>
                    <Icon icon="coins" /> {currentFocusPrice.toLocaleString()}
                  </span>
                </span>
                <span className={cardHintCls}>
                  The part of life tomorrow’s question is about.
                </span>
                {isFollowUpSelected && (
                  <span className={warnHintCls}>
                    Keep Going is selected, so Current Focus is ignored tomorrow
                    unless you change the vibe.
                  </span>
                )}
                <span className={cardValueCls}>
                  {getFocusLabel(currentFocus, isAdultUser)}
                  <Icon
                    icon={isFocusModalOpen ? 'chevron-up' : 'chevron-down'}
                  />
                </span>
              </button>
              {isFocusModalOpen && (
                <div className={optionListCls}>
                  {FOCUS_OPTIONS.map((option) => {
                    const isSelected = (currentFocus || 'infer') === option.id;
                    const isPaidOption = option.id !== 'infer';
                    const isFreeToday =
                      isPaidOption && isFocusSelectionFreeToday(option.id);
                    const requiresPayment =
                      isPaidOption && !isFreeToday && !isSelected;
                    const isDisabledForCoins =
                      requiresPayment &&
                      availableTwinkleCoins < currentFocusPrice;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        className={optionCls(isSelected)}
                        onClick={() => onSelectFocus(option.id)}
                        disabled={isSettingFocus || isDisabledForCoins}
                        title={
                          isDisabledForCoins
                            ? `You don't have enough coins for this choice (need ${currentFocusPrice.toLocaleString()} coins).`
                            : undefined
                        }
                      >
                        <span className={optionTextCls}>
                          <span className={optionTitleCls}>
                            {getFocusOptionTitle(option, isAdultUser)}
                          </span>
                          <span className={optionDescCls}>
                            {getFocusOptionDescription(option, isAdultUser)}
                          </span>
                        </span>
                        <span className={optionMetaCls}>
                          {requiresPayment && (
                            <span className={priceCls}>
                              <Icon icon="coins" />{' '}
                              {currentFocusPrice.toLocaleString()}
                            </span>
                          )}
                          {isSelected && (
                            <Icon icon="check" style={{ color: PAPER.done }} />
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <NextDayCountdown
        label="Next Daily Reflection"
        className={css`
          margin-top: 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          color: ${PAPER.inkSoft};
          font-size: 1.3rem;
        `}
        labelClassName={css`
          font-size: 1.1rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 0.3rem;
          color: ${PAPER.inkFaint};
        `}
        timerClassName={css`
          font-family: ${PAPER.serif};
          font-size: 2.2rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          color: ${PAPER.ink};
        `}
      />

      {!selectorsHidden && (
        <div
          className={css`
            display: flex;
            justify-content: center;
            margin-top: 1.6rem;
          `}
        >
          <button
            type="button"
            className={paperPrimaryButtonCls}
            onClick={onClose}
          >
            Done
          </button>
        </div>
      )}

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

const sectionCls = css`
  margin-top: 2.2rem;
  padding-top: 1.8rem;
  border-top: 1px solid ${PAPER.line};
`;

const sectionTitleCls = css`
  margin-bottom: 1rem;
  text-align: center;
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${PAPER.inkFaint};
`;

const cardsCls = css`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  align-items: start;
  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 1fr;
  }
`;

const cardWrapCls = css`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
`;

function cardCls(open: boolean) {
  return css`
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    text-align: left;
    border: 1px solid ${open ? PAPER.accent : PAPER.line};
    border-radius: 14px;
    background: ${PAPER.paper};
    padding: 1.2rem 1.3rem;
    cursor: pointer;
    transition: border-color 0.15s;
    &:hover {
      border-color: ${PAPER.accent};
    }
  `;
}

const cardHeadCls = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
`;

const cardNameCls = css`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.45rem;
  font-weight: 700;
  color: ${PAPER.ink};
  svg {
    color: ${PAPER.accent};
  }
`;

const cardHintCls = css`
  font-size: 1.25rem;
  color: ${PAPER.inkSoft};
`;

const warnHintCls = css`
  font-size: 1.2rem;
  font-weight: 600;
  color: ${PAPER.warn};
`;

const cardValueCls = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.3rem;
  font-family: ${PAPER.serif};
  font-size: 1.6rem;
  color: ${PAPER.ink};
  svg {
    font-size: 1.2rem;
    color: ${PAPER.inkFaint};
  }
`;

const priceCls = css`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 1.2rem;
  font-weight: 700;
  color: ${PAPER.accent};
  flex-shrink: 0;
`;

const optionListCls = css`
  border: 1px solid ${PAPER.line};
  border-radius: 14px;
  background: ${PAPER.paper};
  max-height: 46vh;
  overflow-y: auto;
`;

function optionCls(selected: boolean) {
  return css`
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.8rem;
    text-align: left;
    border: none;
    border-bottom: 1px solid ${PAPER.line};
    background: ${selected ? PAPER.accentSoft : 'transparent'};
    padding: 0.9rem 1.2rem;
    cursor: pointer;
    &:last-child {
      border-bottom: none;
    }
    &:hover:not(:disabled) {
      background: ${selected ? PAPER.accentSoft : PAPER.paperDeep};
    }
    &:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }
  `;
}

const optionTextCls = css`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
`;

const optionTitleCls = css`
  font-size: 1.35rem;
  font-weight: 700;
  color: ${PAPER.ink};
`;

const optionDescCls = css`
  font-size: 1.2rem;
  color: ${PAPER.inkSoft};
`;

const optionMetaCls = css`
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  flex-shrink: 0;
`;
