import React, { useContext, useEffect, useMemo, useState } from 'react';
import FullTextReveal from '~/components/Texts/FullTextReveal';
import ErrorBoundary from '~/components/ErrorBoundary';
import DropdownButton from '~/components/Buttons/DropdownButton';
import LegacyTopic from './LegacyTopic';
import ChatFilter from './ChatFilter';
import Icon from '~/components/Icon';
import { isMobile } from '~/helpers';
import { GENERAL_CHAT_ID, MOD_LEVEL } from '~/constants/defaultValues';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import { useToast } from '~/contexts/Toast';
import LocalContext from '../../../Context';
const deviceIsMobile = isMobile(navigator);
const addToFavoritesLabel = 'Add to favorites';
const changeTopicLabel = 'Change Topic';
const invitePeopleLabel = 'Invite People';
const leaveLabel = 'Leave';
const menuLabel = deviceIsMobile ? '' : 'Menu';
const settingsLabel = 'Settings';
const mutePushNotificationsLabel = 'Mute push notifications';
const unmutePushNotificationsLabel = 'Unmute push notifications';

export default function ChannelHeader({
  currentChannel,
  displayedThemeColor,
  isAIChannel,
  isSearchActive,
  onFavoriteClick,
  onInputFocus,
  onSaveScrollPositionForAll,
  onSearch,
  onSetHideModalShown,
  onSetInviteUsersModalShown,
  onSetLeaveConfirmModalShown,
  onSetSettingsModalShown,
  onSetBuyTopicModalShown,
  onSetTopicSelectorModalShown,
  searchText,
  selectedChannelId,
  subchannel,
  topicSelectorModalShown
}: {
  currentChannel: any;
  displayedThemeColor: string;
  isAIChannel: boolean;
  isSearchActive: boolean;
  onFavoriteClick: (arg0: any) => void;
  onInputFocus: () => void;
  onSaveScrollPositionForAll?: () => void;
  onSearch: (arg0: string) => void;
  onSetHideModalShown: (arg0: boolean) => void;
  onSetInviteUsersModalShown: (arg0: boolean) => void;
  onSetLeaveConfirmModalShown: (arg0: boolean) => void;
  onSetSettingsModalShown: (arg0: boolean) => void;
  onSetBuyTopicModalShown: (arg0: boolean) => void;
  onSetTopicSelectorModalShown: (arg0: boolean) => void;
  searchText: string;
  selectedChannelId: number;
  subchannel: any;
  topicSelectorModalShown: boolean;
}) {
  const {
    actions: { onLoadChatSubject, onSetIsSearchActive },
    requests: { loadChatSubject },
    state: { allFavoriteChannelIds }
  } = useContext(LocalContext);
  const banned = useKeyContext((v) => v.myState.banned);
  const level = useKeyContext((v) => v.myState.level);
  const username = useKeyContext((v) => v.myState.username);
  const userId = useKeyContext((v) => v.myState.userId);
  const notificationSettings = useChatContext(
    (v) => v.state.chatNotificationSettings
  );
  const onSetChatNotificationSettings = useChatContext(
    (v) => v.actions.onSetChatNotificationSettings
  );
  const loadChatNotificationSettings = useAppContext(
    (v) => v.requestHelpers.loadChatNotificationSettings
  );
  const updateChatNotificationMute = useAppContext(
    (v) => v.requestHelpers.updateChatNotificationMute
  );
  const showToast = useToast();
  const [isEditingTopic, setIsEditingTopic] = useState(false);
  const [addToFavoritesShown, setAddToFavoritesShown] = useState(false);
  const [subchannelLoading, setSubchannelLoading] = useState(false);
  const [notificationMuteSaving, setNotificationMuteSaving] = useState(false);
  const favorited = useMemo(() => {
    return allFavoriteChannelIds[selectedChannelId];
  }, [allFavoriteChannelIds, selectedChannelId]);
  const effectiveChannelName = useMemo(() => {
    if (currentChannel.twoPeople) {
      return username;
    }
    return currentChannel.channelName;
  }, [currentChannel.channelName, currentChannel.twoPeople, username]);
  const canChangeTopic = useMemo(() => {
    if (banned?.chat) {
      return false;
    }
    if (currentChannel.twoPeople) {
      return true;
    }
    if (subchannel) {
      // Modern topics are channel-level only; subchannels use legacyTopicObj.
      if (subchannel?.legacyTopicObj) {
        return subchannel?.canChangeSubject;
      }
      return false;
    }
    return currentChannel.canChangeSubject;
  }, [
    banned?.chat,
    currentChannel.canChangeSubject,
    currentChannel.twoPeople,
    subchannel
  ]);

  const isLegacyTopicShown = useMemo(() => {
    return selectedChannelId === GENERAL_CHAT_ID;
  }, [selectedChannelId]);

  useEffect(() => {
    if (!currentChannel.legacyTopicObj?.loaded) {
      init();
    }
    async function init() {
      try {
        const data = await loadChatSubject({
          channelId: selectedChannelId,
          subchannelId: subchannel?.id
        });
        onLoadChatSubject(data);
        return;
      } catch (error) {
        console.error(error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChannel.legacyTopicObj?.loaded]);

  useEffect(() => {
    if (subchannel?.loaded && !subchannel?.legacyTopicObj?.loaded) {
      setSubchannelLoading(true);
      handleInitialLoad();
    }
    async function handleInitialLoad() {
      const data = await loadChatSubject({
        channelId: selectedChannelId,
        subchannelId: subchannel?.id
      });
      onLoadChatSubject(data);
      setSubchannelLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subchannel?.loaded, subchannel?.legacyTopicObj?.loaded]);

  const legacyTopicObj = useMemo(() => {
    if (subchannel) {
      if (subchannel?.legacyTopicObj) {
        return subchannel?.legacyTopicObj;
      }
      return {};
    }
    if (currentChannel.legacyTopicObj) {
      return currentChannel.legacyTopicObj;
    }
    return {};
  }, [currentChannel, subchannel]);

  const notificationsMuted =
    notificationSettings?.mutedChannelIds.includes(selectedChannelId) || false;

  useEffect(() => {
    if (!userId || notificationSettings) return;
    let cancelled = false;
    loadSettings();

    async function loadSettings() {
      try {
        const settings = await loadChatNotificationSettings();
        if (!cancelled && Number(settings?.userId) === Number(userId)) {
          onSetChatNotificationSettings(settings);
        }
      } catch (error) {
        if (!cancelled) {
          console.error(
            'Failed to load chat notification settings in ChannelHeader:',
            error
          );
        }
      }
    }

    return () => {
      cancelled = true;
    };
    // Stable context actions and request helpers are intentionally omitted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notificationSettings, selectedChannelId, userId]);

  const menuProps = useMemo(() => {
    const notificationMenuItem = notificationSettings
      ? {
          label: (
            <>
              <Icon icon={notificationsMuted ? 'bell' : 'bell-slash'} />
              <span style={{ marginLeft: '1rem' }}>
                {notificationsMuted
                  ? unmutePushNotificationsLabel
                  : mutePushNotificationsLabel}
              </span>
            </>
          ),
          disabled: notificationMuteSaving,
          onClick: handleNotificationMuteChange
        }
      : null;

    if (currentChannel.twoPeople) {
      const result: any[] = [
        {
          label: (
            <>
              <Icon icon="minus" />
              <span style={{ marginLeft: '1rem' }}>Hide</span>
            </>
          ),
          onClick: () => onSetHideModalShown(true)
        }
      ];
      if (notificationMenuItem) {
        result.push({ separator: true }, notificationMenuItem);
      }
      return result;
    }
    const result: any[] = [];
    if (selectedChannelId === GENERAL_CHAT_ID && level >= MOD_LEVEL) {
      result.push({
        label: (
          <>
            <Icon icon="exchange-alt" />
            <span style={{ marginLeft: '1rem' }}>{changeTopicLabel}</span>
          </>
        ),
        onClick: () => setIsEditingTopic(true)
      });
    }
    if (selectedChannelId !== GENERAL_CHAT_ID) {
      if (
        !currentChannel.isClosed ||
        Number(currentChannel.creatorId) === Number(userId) ||
        currentChannel.isPublic
      ) {
        result.push({
          label: (
            <>
              <Icon icon="users" />
              <span style={{ marginLeft: '1rem' }}>{invitePeopleLabel}</span>
            </>
          ),
          onClick: () => onSetInviteUsersModalShown(true)
        });
      }
      result.push({
        label: (
          <>
            <Icon icon="sliders-h" />
            <span style={{ marginLeft: '1rem' }}>{settingsLabel}</span>
          </>
        ),
        onClick: () => onSetSettingsModalShown(true)
      });
    }
    if (notificationMenuItem) {
      result.push(notificationMenuItem);
    }
    if (selectedChannelId !== GENERAL_CHAT_ID) {
      result.push({
        separator: true
      });
      result.push({
        label: (
          <>
            <Icon icon="sign-out-alt" />
            <span style={{ marginLeft: '1rem' }}>{leaveLabel}</span>
          </>
        ),
        onClick: () => onSetLeaveConfirmModalShown(true)
      });
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentChannel.creatorId,
    currentChannel.isClosed,
    currentChannel.isPublic,
    currentChannel.twoPeople,
    level,
    notificationMuteSaving,
    notificationSettings,
    notificationsMuted,
    selectedChannelId,
    userId
  ]);

  const menuButtonShown = useMemo(() => {
    return (
      !!selectedChannelId &&
      !!currentChannel.id &&
      menuProps.length > 0 &&
      !banned?.chat
    );
  }, [
    selectedChannelId,
    currentChannel.id,
    menuProps.length,
    banned?.chat
  ]);

  return (
    <ErrorBoundary
      componentPath="MessagesContainer/ChannelHeader/index"
      className={css`
        z-index: 50000;
        position: ${isLegacyTopicShown ? 'relative' : 'absolute'};
        width: ${isLegacyTopicShown ? '100%' : 'auto'};
        height: 100%;
        padding: 1rem;
        height: 7rem;
        display: flex;
        align-items: center;
        right: ${isLegacyTopicShown ? 0 : '1rem'};
        > section {
          position: relative;
          display: flex;
          align-items: center;
          flex-direction: column;
          width: CALC(100% - ${level >= MOD_LEVEL ? '22rem' : '12rem'});
          @media (max-width: ${mobileMaxWidth}) {
            width: CALC(100% - ${level >= MOD_LEVEL ? '13rem' : '3rem'});
          }
        }
      `}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%'
        }}
      >
        <div
          className={css`
            flex-grow: 1;
            width: ${isLegacyTopicShown
              ? isEditingTopic
                ? '100%'
                : 'CALC(100% - 40px)'
              : 'auto'};
            height: 100%;
            display: inline-block;
            justify-content: space-between;
            align-items: center;
            padding: 0;
            @media (max-width: ${mobileMaxWidth}) {
              width: ${isLegacyTopicShown ? 'CALC(100% - 60px)' : 'auto'};
            }
          `}
        >
          {isLegacyTopicShown ? (
            <LegacyTopic
              displayedThemeColor={displayedThemeColor}
              isLoaded={
                currentChannel.legacyTopicObj?.loaded ||
                (subchannel?.loaded && !subchannelLoading)
              }
              isEditingTopic={isEditingTopic}
              currentChannel={currentChannel}
              onInputFocus={onInputFocus}
              selectedChannelId={selectedChannelId}
              subchannelId={subchannel?.id}
              legacyTopicObj={legacyTopicObj}
              onSetIsEditingTopic={setIsEditingTopic}
            />
          ) : selectedChannelId ? (
            <ChatFilter
              style={{ marginRight: '1rem' }}
              channelId={selectedChannelId}
              channelName={effectiveChannelName}
              creatorId={currentChannel.creatorId}
              canChangeSubject={currentChannel.canChangeSubject}
              isAIChannel={isAIChannel}
              isSearchActive={isSearchActive}
              isTwoPeopleChat={currentChannel.twoPeople}
              themeColor={displayedThemeColor}
              canChangeTopic={canChangeTopic}
              pathId={currentChannel.pathId}
              pinnedTopicIds={currentChannel.pinnedTopicIds}
              selectedTab={currentChannel.selectedTab}
              topicObj={currentChannel.topicObj}
              topicHistory={currentChannel.topicHistory}
              topicSelectorModalShown={topicSelectorModalShown}
              currentTopicIndex={currentChannel.currentTopicIndex}
              featuredTopicId={currentChannel.featuredTopicId}
              onSaveScrollPositionForAll={onSaveScrollPositionForAll}
              onSearch={onSearch}
              onSetBuyTopicModalShown={onSetBuyTopicModalShown}
              onSetIsSearchActive={onSetIsSearchActive}
              onSetTopicSelectorModalShown={onSetTopicSelectorModalShown}
              searchText={searchText}
              topicId={
                currentChannel.selectedTopicId ||
                currentChannel.lastTopicId ||
                currentChannel.featuredTopicId
              }
            />
          ) : null}
        </div>
        {!isEditingTopic && (
          <div
            className={css`
              height: 100%;
              font-size: 1.3rem;
              display: flex;
              justify-content: flex-end;
              align-items: center;
              max-width: ${isLegacyTopicShown ? '15rem' : 'auto'};
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1.2rem;
                width: ${isLegacyTopicShown ? '10rem' : 'auto'};
              }
            `}
          >
            {menuButtonShown && (
              <DropdownButton
                variant="solid"
                tone="raised"
                color="darkerGray"
                listStyle={{
                  width: '22rem'
                }}
                icon="bars"
                text={menuLabel}
                menuProps={menuProps}
              />
            )}
            {!!selectedChannelId && !!currentChannel.id && (
              <div style={{ marginLeft: '1.5rem' }}>
                <div
                  style={{
                    cursor: 'pointer',
                    fontSize: '2rem'
                  }}
                  onClick={onFavoriteClick}
                  onMouseEnter={() => {
                    if (!favorited) {
                      setAddToFavoritesShown(true);
                    }
                  }}
                  onMouseLeave={() => setAddToFavoritesShown(false)}
                >
                  <Icon
                    color={Color.brownOrange()}
                    icon={favorited ? 'star' : ['far', 'star']}
                  />
                </div>
                <FullTextReveal
                  direction="left"
                  className="desktop"
                  show={addToFavoritesShown && !favorited}
                  text={addToFavoritesLabel}
                  style={{
                    marginTop: '0.7rem',
                    width: 'auto',
                    minWidth: '',
                    maxWidth: '',
                    padding: '1rem'
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );

  async function handleNotificationMuteChange() {
    if (!notificationSettings || notificationMuteSaving) return;
    const muted = !notificationsMuted;
    setNotificationMuteSaving(true);
    try {
      const settings = await updateChatNotificationMute({
        channelId: selectedChannelId,
        muted
      });
      onSetChatNotificationSettings(settings);
      showToast({
        message: muted
          ? 'Push notifications muted for this chat.'
          : 'Push notifications unmuted for this chat.'
      });
    } catch (error) {
      console.error('Failed to update chat push notification mute:', error);
      showToast({
        message: 'Could not update push notifications for this chat.'
      });
    } finally {
      setNotificationMuteSaving(false);
    }
  }
}
