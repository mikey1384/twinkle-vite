import React, { useState } from 'react';
import { css } from '@emotion/css';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import Icon from '~/components/Icon';
import Modal from '~/components/Modal';
import { mobileMaxWidth } from '~/constants/css';

const activityRailBreakpoint = '1180px';

const panelClass = css`
  display: flex;
  flex-direction: column;
  max-height: calc(
    100dvh - var(
        --build-activity-panel-top-offset,
        var(--build-activity-rail-top, 6.5rem)
      ) - var(--build-activity-rail-bottom-gap, 2rem)
  );
  border: 1px solid var(--ui-border);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08);
  font-size: 1.1rem;
  overflow: hidden;
`;

const headerClass = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1rem 1rem 0.75rem;
  border-bottom: 1px solid rgba(65, 140, 235, 0.16);
`;

const titleClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  color: var(--chat-text);
  font-size: 1.22rem;
  font-weight: 900;
`;

const refreshButtonClass = css`
  width: 2.1rem;
  height: 2.1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(65, 140, 235, 0.24);
  border-radius: 999px;
  background: rgba(65, 140, 235, 0.08);
  color: #1d4ed8;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }
`;

const listClass = css`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
`;

const mobilePanelClass = css`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-height: calc(100dvh - 5.75rem);
  min-height: 0;
  font-size: 1.1rem;

  > *:not(:last-child) {
    flex-shrink: 0;
  }
`;

const mobileModalStyle: React.CSSProperties = {
  maxHeight: 'calc(100dvh - 1rem)'
};

const mobileListClass = css`
  width: 100%;
  flex: 0 1 auto;
  min-height: 0;
  overflow-y: auto;
`;

export const activityPanelStateClass = css`
  min-height: 9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.4rem;
  color: var(--chat-text);
  font-size: 1.1rem;
  font-weight: 800;
  opacity: 0.72;
  text-align: center;
`;

export const activityPanelLoadMoreWrapClass = css`
  padding: 0.85rem 1rem 1rem;
  border-top: 1px solid rgba(15, 23, 42, 0.08);
`;

const mobileTriggerClass = css`
  width: 100%;
  margin: -0.5rem 0 1.1rem;
  display: none;

  @media (max-width: ${activityRailBreakpoint}) {
    display: flex;
    justify-content: flex-end;
  }

  @media (max-width: ${mobileMaxWidth}) {
    margin-top: -0.7rem;
    justify-content: stretch;

    > button {
      width: 100%;
    }
  }
`;

export default function ActivityPanelShell({
  hasNewActivity = false,
  icon = 'bell',
  loading,
  mobileTriggerLabel,
  modalKey,
  onMobileClose,
  onMobileOpen,
  onRefresh,
  refreshAriaLabel,
  renderContent,
  renderTabs,
  title,
  variant
}: {
  hasNewActivity?: boolean;
  icon?: string;
  loading: boolean;
  mobileTriggerLabel: string;
  modalKey: string;
  onMobileClose?: () => void;
  onMobileOpen?: () => void;
  onRefresh: () => void;
  refreshAriaLabel: string;
  renderContent: (controls: { closeMobile: () => void }) => React.ReactNode;
  renderTabs: () => React.ReactNode;
  title: string;
  variant: 'rail' | 'mobile';
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  if (variant === 'mobile') {
    return (
      <>
        <div className={mobileTriggerClass}>
          <GameCTAButton
            variant={hasNewActivity ? 'logoBlue' : 'neutral'}
            size="md"
            icon={icon}
            shiny={hasNewActivity}
            onClick={handleMobileOpen}
          >
            {mobileTriggerLabel}
          </GameCTAButton>
        </div>
        {mobileOpen ? (
          <Modal
            modalKey={modalKey}
            isOpen
            onClose={handleMobileClose}
            title={title}
            size="md"
            bodyPadding={0}
            style={mobileModalStyle}
          >
            <div className={mobilePanelClass}>
              {renderTabs()}
              <div className={mobileListClass}>
                {renderContent({ closeMobile: handleMobileClose })}
              </div>
            </div>
          </Modal>
        ) : null}
      </>
    );
  }

  return (
    <section className={panelClass}>
      <div className={headerClass}>
        <div className={titleClass}>
          <Icon icon={icon} />
          {title}
        </div>
        <button
          type="button"
          className={refreshButtonClass}
          onClick={onRefresh}
          disabled={loading}
          aria-label={refreshAriaLabel}
          title="Refresh"
        >
          <Icon icon={loading ? 'spinner' : 'sync'} pulse={loading} />
        </button>
      </div>
      {renderTabs()}
      <div className={listClass}>
        {renderContent({ closeMobile: () => undefined })}
      </div>
    </section>
  );

  function handleMobileOpen() {
    onMobileOpen?.();
    setMobileOpen(true);
  }

  function handleMobileClose() {
    onMobileClose?.();
    setMobileOpen(false);
  }
}
