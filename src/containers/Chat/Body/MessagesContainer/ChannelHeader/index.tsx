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
import { useKeyContext } from '~/contexts';
import LocalContext from '../../../Context';
import localize from '~/constants/localize';

const deviceIsMobile = isMobile(navigator);
const addToFavoritesLabel = localize('addToFavorites');
const changeTopicLabel = localize('changeTopic');
const editGroupNameLabel = localize('editGroupName');
const invitePeopleLabel = localize('invitePeople');
const leaveLabel = localize('leave');
const menuLabel = deviceIsMobile ? '' : localize('menu');
const settingsLabel = localize('settings');

export default function ChannelHeader({
  currentChannel,
  displayedThemeColor,
  isAIChannel,
  isSearchActive,
  onFavoriteClick,
  onInputFocus,
  onSetHideModalShown,
  onSetInviteUsersModalShown,
  onSetLeaveConfirmModalShown,
  onSetSettingsModalShown,
  onSetBuyTopicModalShown,
  onSetTopicSelectorModalShown,
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
  onSetHideModalShown: (arg0: boolean) => void;
  onSetInviteUsersModalShown: (arg0: boolean) => void;
  onSetLeaveConfirmModalShown: (arg0: boolean) => void;
  onSetSettingsModalShown: (arg0: boolean) => void;
  onSetBuyTopicModalShown: (arg0: boolean) => void;
  onSetTopicSelectorModalShown: (arg0: boolean) => void;
  selectedChannelId: number;
  subchannel: any;
  topicSelectorModalShown: boolean;
}) {
  const {
    actions: { onLoadChatSubject, onSetIsSearchActive },
    requests: { loadChatSubject },
    state: { allFavoriteChannelIds }
  } = useContext(LocalContext);
  const { banned, level, username, userId } = useKeyContext((v) => v.myState);
  const [isEditingTopic, setIsEditingTopic] = useState(false);
  const [addToFavoritesShown, setAddToFavoritesShown] = useState(false);
  const [subchannelLoading, setSubchannelLoading] = useState(false);
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

  const loaded = useMemo(() => {
    return currentChannel.legacyTopicObj?.loaded;
  }, [currentChannel.legacyTopicObj?.loaded]);

  const isLegacyTopicShown = useMemo(() => {
    return selectedChannelId === GENERAL_CHAT_ID;
  }, [selectedChannelId]);

  useEffect(() => {
    if (!loaded) {
      handleInitialLoad();
    }
    async function handleInitialLoad() {
      const data = await loadChatSubject({
        channelId: selectedChannelId,
        subchannelId: subchannel?.id
      });
      onLoadChatSubject(data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

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

  const menuProps = useMemo(() => {
    if (currentChannel.twoPeople) {
      return [
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
    }
    const result = [];
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
      if (!currentChannel.isClosed || currentChannel.creatorId === userId) {
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
        label:
          currentChannel.creatorId === userId ? (
            <>
              <Icon icon="sliders-h" />
              <span style={{ marginLeft: '1rem' }}>{settingsLabel}</span>
            </>
          ) : (
            <>
              <Icon icon="pencil-alt" />
              <span style={{ marginLeft: '1rem' }}>{editGroupNameLabel}</span>
            </>
          ),
        onClick: () => onSetSettingsModalShown(true)
      });
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
    currentChannel.twoPeople,
    currentChannel.isClosed,
    currentChannel.creatorId,
    userId
  ]);

  const menuButtonShown = useMemo(() => {
    return (
      !!selectedChannelId &&
      !!currentChannel.id &&
      (selectedChannelId !== GENERAL_CHAT_ID || level >= MOD_LEVEL) &&
      menuProps.length > 0 &&
      !banned?.chat
    );
  }, [
    selectedChannelId,
    currentChannel.id,
    level,
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
              isLoaded={loaded || (subchannel?.loaded && !subchannelLoading)}
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
              onSetBuyTopicModalShown={onSetBuyTopicModalShown}
              onSetIsSearchActive={onSetIsSearchActive}
              onSetTopicSelectorModalShown={onSetTopicSelectorModalShown}
              topicId={
                currentChannel.selectedTopicId ||
                (currentChannel.twoPeople
                  ? currentChannel.lastTopicId
                  : currentChannel.featuredTopicId)
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
                skeuomorphic
                opacity={0.7}
                listStyle={{
                  width: '15rem'
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
}
