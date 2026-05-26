import React, { useMemo, memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { css } from '@emotion/css';
import ErrorBoundary from '~/components/ErrorBoundary';
import { timeSince } from '~/helpers/timeStampHelpers';
import { notiFeedListItem } from '../../Styles';
import NotiMessage from './NotiMessage';
import UsernameText from '~/components/Texts/UsernameText';
import { resolveColorValue } from '~/theme/resolveColor';
import Icon from '~/components/Icon';
import BuildAppNotificationSettingsModal from './BuildAppNotificationSettingsModal';

const buildAppItemClass = css`
  position: relative;
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    background-color 0.18s ease;
  &:hover {
    background: rgba(65, 140, 235, 0.06);
  }
`;

const buildAppContentRowClass = css`
  width: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: 0.7rem;
`;

const settingsButtonClass = css`
  width: 2.25rem;
  height: 2.25rem;
  border: 1px solid var(--ui-border);
  border-radius: 999px;
  background: #fff;
  color: var(--chat-text);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  flex: 0 0 auto;
  &:hover {
    background: rgba(65, 140, 235, 0.08);
  }
`;

function NotiItem({
  actionColor,
  infoColor,
  linkColor,
  mentionColor,
  missionColor,
  recommendationColor,
  rewardColor,
  userId,
  notification: {
    id,
    actionObj = {},
    targetComment = {},
    targetObj = {},
    targetSubject = {},
    timeStamp,
    user = {},
    rewardType,
    rewardRootId,
    rewardRootType,
    rewardRootTargetType,
    rewardRootMissionType,
    isNotification,
    isTask,
    rootMissionType
  }
}: {
  actionColor?: string;
  infoColor?: string;
  linkColor: string;
  mentionColor?: string;
  missionColor?: string;
  recommendationColor?: string;
  rewardColor?: string;
  userId?: number;
  notification: {
    id: number;
    actionObj?: any;
    targetComment?: any;
    targetObj?: any;
    targetSubject?: any;
    timeStamp: string;
    user?: any;
    rewardType?: string;
    rewardRootId?: number;
    rewardRootType?: string;
    rewardRootTargetType?: string;
    rewardRootMissionType?: string;
    isNotification?: boolean;
    isTask?: boolean;
    rootMissionType?: string;
  };
}) {
  const navigate = useNavigate();
  const [settingsModalShown, setSettingsModalShown] = useState(false);
  const isBuildAppNotification = actionObj.contentType === 'buildApp';
  const buildId = Number(actionObj.buildId || targetObj.id || 0);
  const buildLaunchTarget = useMemo(
    () =>
      isBuildAppNotification
        ? {
            notificationId: id,
            buildId,
            eventKey: actionObj.eventKey || '',
            eventLabel: actionObj.eventLabel || '',
            target: actionObj.target || null,
            payload: actionObj.payload || null
          }
        : null,
    [
      actionObj.eventKey,
      actionObj.eventLabel,
      actionObj.payload,
      actionObj.target,
      buildId,
      id,
      isBuildAppNotification
    ]
  );
  const userLabel = useMemo(() => {
    if (actionObj.contentType !== 'pass' && actionObj.contentType !== 'fail') {
      return (
        <div style={{ display: 'inline' }}>
          <UsernameText
            user={user}
            color={resolveColorValue(linkColor) || linkColor}
          />{' '}
        </div>
      );
    }
    return '';
  }, [actionObj.contentType, linkColor, user]);
  const isToday = useMemo(() => {
    const d = new Date(Number(timeStamp) * 1000);
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  }, [timeStamp]);

  function openBuildAppNotification() {
    if (!isBuildAppNotification || !buildId) return;
    navigate(`/app/${buildId}?notificationId=${id}`, {
      state: {
        buildLaunchTarget,
        notificationId: id
      }
    });
  }

  function handleBuildAppItemKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    openBuildAppNotification();
  }

  function openSettingsModal(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    setSettingsModalShown(true);
  }

  function handleSettingsButtonKeyDown(
    event: React.KeyboardEvent<HTMLButtonElement>
  ) {
    event.stopPropagation();
  }

  return (
    <ErrorBoundary componentPath="Notification/MainFeeds/NotiItem/index">
      <nav
        className={`${notiFeedListItem} ${
          isBuildAppNotification ? buildAppItemClass : ''
        }`}
        key={id}
        onClick={isBuildAppNotification ? openBuildAppNotification : undefined}
        onKeyDown={
          isBuildAppNotification ? handleBuildAppItemKeyDown : undefined
        }
        role={isBuildAppNotification ? 'button' : undefined}
        tabIndex={isBuildAppNotification ? 0 : undefined}
      >
        <div className={isBuildAppNotification ? buildAppContentRowClass : ''}>
          <div>
            {userLabel}
            <NotiMessage
              actionColor={actionColor || ''}
              actionObj={actionObj}
              infoColor={infoColor || ''}
              isNotification={isNotification || false}
              isTask={isTask || false}
              linkColor={linkColor}
              mentionColor={mentionColor || ''}
              missionColor={missionColor || ''}
              recommendationColor={recommendationColor || ''}
              rewardColor={rewardColor || ''}
              rewardRootId={rewardRootId || 0}
              rewardType={rewardType || ''}
              rewardRootMissionType={rewardRootMissionType || ''}
              rewardRootType={rewardRootType || ''}
              rewardRootTargetType={rewardRootTargetType || ''}
              rootMissionType={rootMissionType || ''}
              targetObj={targetObj}
              targetComment={targetComment}
              targetSubject={targetSubject}
              myId={userId || 0}
            />
          </div>
          {isBuildAppNotification && buildId ? (
            <button
              aria-label="Notification settings"
              className={settingsButtonClass}
              onKeyDown={handleSettingsButtonKeyDown}
              onClick={openSettingsModal}
              title="Notification settings"
              type="button"
            >
              <Icon icon="gear" />
            </button>
          ) : null}
        </div>
        {isToday && <small>{timeSince(timeStamp)}</small>}
      </nav>
      {isBuildAppNotification && buildId ? (
        <BuildAppNotificationSettingsModal
          buildId={buildId}
          buildTitle={targetObj.content || 'this Build'}
          eventKey={actionObj.eventKey || ''}
          eventLabel={actionObj.eventLabel || ''}
          isOpen={settingsModalShown}
          onClose={() => setSettingsModalShown(false)}
        />
      ) : null}
    </ErrorBoundary>
  );
}

export default memo(NotiItem);
