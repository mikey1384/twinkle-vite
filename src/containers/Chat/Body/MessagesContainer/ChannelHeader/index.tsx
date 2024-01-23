import React, { useContext, useEffect, useMemo, useState } from 'react';
import Button from '~/components/Button';
import Loading from '~/components/Loading';
import FullTextReveal from '~/components/Texts/FullTextReveal';
import ErrorBoundary from '~/components/ErrorBoundary';
import DropdownButton from '~/components/Buttons/DropdownButton';
import LegacyTopic from './LegacyTopic';
import Icon from '~/components/Icon';
import { isMobile } from '~/helpers';
import { GENERAL_CHAT_ID, MOD_LEVEL } from '~/constants/defaultValues';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { useTheme } from '~/helpers/hooks';
import { useKeyContext } from '~/contexts';
import LocalContext from '../../../Context';
import localize from '~/constants/localize';

const deviceIsMobile = isMobile(navigator);

const addToFavoritesLabel = localize('addToFavorites');
const changeTopicLabel = localize('changeTopic');
const editGroupNameLabel = localize('editGroupName');
const invitePeopleLabel = localize('invitePeople');
const leaveLabel = localize('leave');
const loadingTopicLabel = localize('loadingTopic');
const menuLabel = deviceIsMobile ? '' : localize('menu');
const settingsLabel = localize('settings');

export default function ChannelHeader({
  currentChannel,
  displayedThemeColor,
  onFavoriteClick,
  onInputFocus,
  onSetInviteUsersModalShown,
  onSetLeaveConfirmModalShown,
  onSetSettingsModalShown,
  selectedChannelId,
  subchannel
}: {
  currentChannel: any;
  displayedThemeColor: string;
  onFavoriteClick: (arg0: any) => void;
  onInputFocus: () => void;
  onSetInviteUsersModalShown: (arg0: boolean) => void;
  onSetLeaveConfirmModalShown: (arg0: boolean) => void;
  onSetSettingsModalShown: (arg0: boolean) => void;
  selectedChannelId: number;
  subchannel: any;
}) {
  const {
    actions: { onLoadChatSubject, onSetIsRespondingToSubject },
    requests: { loadChatSubject },
    state: { allFavoriteChannelIds }
  } = useContext(LocalContext);
  const { banned, level, userId } = useKeyContext((v) => v.myState);
  const {
    button: { color: buttonColor },
    buttonHovered: { color: buttonHoverColor },
    chatTopic: { color: chatTopicColor }
  } = useTheme(displayedThemeColor);
  const [isEditingTopic, setIsEditingTopic] = useState(false);
  const [addToFavoritesShown, setAddToFavoritesShown] = useState(false);
  const [subchannelLoading, setSubchannelLoading] = useState(false);
  const favorited = useMemo(() => {
    return allFavoriteChannelIds[selectedChannelId];
  }, [allFavoriteChannelIds, selectedChannelId]);
  const canChangeSubject = useMemo(() => {
    if (subchannel) {
      if (subchannel?.subjectObj) {
        return subchannel?.subjectObj?.canChangeSubject;
      }
      return false;
    }
    return currentChannel.canChangeSubject;
  }, [currentChannel.canChangeSubject, subchannel]);

  const loaded = useMemo(() => {
    return currentChannel.subjectObj?.loaded;
  }, [currentChannel.subjectObj?.loaded]);

  const channelHeaderShown = useMemo(() => {
    return (
      (!subchannel || subchannel?.canChangeSubject) &&
      (selectedChannelId === GENERAL_CHAT_ID ||
        !!currentChannel.canChangeSubject)
    );
  }, [currentChannel.canChangeSubject, selectedChannelId, subchannel]);

  const isTopicShown = useMemo(() => {
    return channelHeaderShown || selectedChannelId === GENERAL_CHAT_ID;
  }, [channelHeaderShown, selectedChannelId]);

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
    if (subchannel?.loaded && !subchannel?.subjectObj?.loaded) {
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
  }, [subchannel?.loaded, subchannel?.subjectObj?.loaded]);

  const subjectObj = useMemo(() => {
    if (subchannel) {
      if (subchannel?.subjectObj) {
        return subchannel?.subjectObj;
      }
      return {};
    }
    if (currentChannel.subjectObj) {
      return currentChannel.subjectObj;
    }
    return {};
  }, [currentChannel, subchannel]);

  const menuProps = useMemo(() => {
    const result = [];
    if (
      ((selectedChannelId === GENERAL_CHAT_ID || canChangeSubject === 'mod') &&
        level >= MOD_LEVEL) ||
      canChangeSubject === 'all' ||
      (canChangeSubject === 'owner' && currentChannel.creatorId === userId)
    ) {
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
      (selectedChannelId !== GENERAL_CHAT_ID || level >= MOD_LEVEL) &&
      menuProps.length > 0 &&
      !banned?.chat
    );
  }, [selectedChannelId, level, menuProps.length, banned?.chat]);

  return (
    <ErrorBoundary
      componentPath="MessagesContainer/ChannelHeader/index"
      className={css`
        z-index: 50000;
        position: relative;
        width: 100%;
        height: 100%;
        padding: 1rem;
        height: 7rem;
        align-items: center;
        display: flex;
        align-items: center;
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
      {loaded || (subchannel?.loaded && !subchannelLoading) ? (
        <div>
          {isTopicShown && (
            <LegacyTopic
              color={chatTopicColor}
              displayedThemeColor={displayedThemeColor}
              isEditingTopic={isEditingTopic}
              currentChannel={currentChannel}
              onInputFocus={onInputFocus}
              selectedChannelId={selectedChannelId}
              subchannelId={subchannel?.id}
              subjectObj={subjectObj}
              onSetIsEditingTopic={setIsEditingTopic}
            />
          )}
          <div
            className={css`
              position: absolute;
              height: 100%;
              font-size: 1.3rem;
              right: 1rem;
              display: flex;
              align-items: center;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1.2rem;
              }
            `}
          >
            {isTopicShown && (
              <Button
                color={buttonColor}
                hoverColor={buttonHoverColor}
                filled
                onClick={() => {
                  onSetIsRespondingToSubject({
                    channelId: selectedChannelId,
                    subchannelId: subchannel?.id,
                    subjectId: subjectObj.id,
                    isResponding: true
                  });
                  onInputFocus();
                }}
              >
                <Icon flip="both" icon="reply" />
              </Button>
            )}
            {menuButtonShown && (
              <DropdownButton
                skeuomorphic
                opacity={0.7}
                style={{
                  marginLeft: '1rem'
                }}
                listStyle={{
                  width: '15rem'
                }}
                icon="bars"
                text={menuLabel}
                menuProps={menuProps}
              />
            )}
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
          </div>
        </div>
      ) : (
        <Loading
          style={{
            color: Color[displayedThemeColor]()
          }}
          theme={displayedThemeColor}
          text={`${loadingTopicLabel}...`}
        />
      )}
    </ErrorBoundary>
  );
}
