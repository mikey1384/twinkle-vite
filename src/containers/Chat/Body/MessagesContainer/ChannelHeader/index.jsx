import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '~/components/Button';
import Loading from '~/components/Loading';
import FullTextReveal from '~/components/Texts/FullTextReveal';
import UsernameText from '~/components/Texts/UsernameText';
import EditSubjectForm from './EditSubjectForm';
import ErrorBoundary from '~/components/ErrorBoundary';
import DropdownButton from '~/components/Buttons/DropdownButton';
import Icon from '~/components/Icon';
import { isMobile, textIsOverflown } from '~/helpers';
import { timeSince } from '~/helpers/timeStampHelpers';
import { socket } from '~/constants/io';
import {
  charLimit,
  defaultChatSubject,
  GENERAL_CHAT_ID
} from '~/constants/defaultValues';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { useInterval, useTheme } from '~/helpers/hooks';
import { useKeyContext } from '~/contexts';
import LocalContext from '../../../Context';
import localize from '~/constants/localize';

const deviceIsMobile = isMobile(navigator);

const addToFavoritesLabel = localize('addToFavorites');
const broughtBackByLabel = localize('broughtBackBy');
const changeTopicLabel = localize('changeTopic');
const editGroupNameLabel = localize('editGroupName');
const invitePeopleLabel = localize('invitePeople');
const leaveLabel = localize('leave');
const loadingSubjectLabel = localize('loadingSubject');
const menuLabel = deviceIsMobile ? '' : localize('menu');
const settingsLabel = localize('settings');
const startedByLabel = localize('startedBy');

ChannelHeader.propTypes = {
  currentChannel: PropTypes.object.isRequired,
  displayedThemeColor: PropTypes.string,
  onFavoriteClick: PropTypes.func.isRequired,
  onInputFocus: PropTypes.func.isRequired,
  onSetInviteUsersModalShown: PropTypes.func,
  onSetLeaveConfirmModalShown: PropTypes.func,
  onSetSettingsModalShown: PropTypes.func,
  selectedChannelId: PropTypes.number
};

export default function ChannelHeader({
  currentChannel,
  displayedThemeColor,
  onFavoriteClick,
  onInputFocus,
  onSetInviteUsersModalShown,
  onSetLeaveConfirmModalShown,
  onSetSettingsModalShown,
  selectedChannelId
}) {
  const {
    actions: {
      onClearSubjectSearchResults,
      onLoadChatSubject,
      onReloadChatSubject,
      onSearchChatSubject,
      onSetIsRespondingToSubject,
      onUploadChatSubject
    },
    requests: {
      loadChatSubject,
      reloadChatSubject,
      searchChatSubject,
      uploadChatSubject
    },
    state: { allFavoriteChannelIds, subjectObj, subjectSearchResults }
  } = useContext(LocalContext);
  const { authLevel, banned, profilePicUrl, userId, username } = useKeyContext(
    (v) => v.myState
  );
  const {
    button: { color: buttonColor },
    buttonHovered: { color: buttonHoverColor },
    chatTopic: { color: chatTopicColor }
  } = useTheme(displayedThemeColor);
  const [onEdit, setOnEdit] = useState(false);
  const [onHover, setOnHover] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [addToFavoritesShown, setAddToFavoritesShown] = useState(false);
  const favorited = useMemo(() => {
    return allFavoriteChannelIds[selectedChannelId];
  }, [allFavoriteChannelIds, selectedChannelId]);
  const reloadingChatSubject = useRef(false);

  const {
    content = defaultChatSubject,
    id: subjectId,
    loaded,
    uploader = {},
    reloader = {},
    timeStamp,
    reloadTimeStamp
  } = subjectObj[selectedChannelId] || {};

  const [timeSincePost, setTimeSincePost] = useState(timeSince(timeStamp));
  const [timeSinceReload, setTimeSinceReload] = useState(
    timeSince(reloadTimeStamp)
  );
  const HeaderLabelRef = useRef(null);

  useEffect(() => {
    if (!loaded) {
      handleInitialLoad();
    }
    async function handleInitialLoad() {
      const data = await loadChatSubject(selectedChannelId);
      onLoadChatSubject(data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChannelId, loaded]);

  useEffect(() => {
    setTimeSincePost(timeSince(timeStamp));
    setTimeSinceReload(timeSince(reloadTimeStamp));
  }, [timeStamp, reloadTimeStamp]);

  useInterval(() => {
    setTimeSincePost(timeSince(timeStamp));
    setTimeSinceReload(timeSince(reloadTimeStamp));
  }, 1000);

  const subjectDetails = useMemo(() => {
    const isReloaded = reloader && reloader.id;
    let posterString = '';
    if (uploader.id && timeSincePost) {
      posterString = (
        <span>
          {startedByLabel} <UsernameText user={uploader} />{' '}
          <span className="desktop">{timeSincePost}</span>
        </span>
      );
    }
    if (isReloaded && timeSinceReload) {
      posterString = (
        <span>
          {broughtBackByLabel} <UsernameText user={reloader} />{' '}
          <span className="desktop">{timeSinceReload}</span>{' '}
          <span className="desktop">
            ({startedByLabel} {<UsernameText user={uploader} />})
          </span>
        </span>
      );
    }
    return <small>{posterString}</small>;
  }, [reloader, timeSincePost, timeSinceReload, uploader]);

  const menuProps = useMemo(() => {
    let result = [];
    if (
      (selectedChannelId === GENERAL_CHAT_ID && authLevel > 0) ||
      currentChannel.canChangeSubject === 'all' ||
      (currentChannel.canChangeSubject === 'owner' &&
        currentChannel.creatorId === userId)
    ) {
      result.push({
        label: (
          <>
            <Icon icon="exchange-alt" />
            <span style={{ marginLeft: '1rem' }}>{changeTopicLabel}</span>
          </>
        ),
        onClick: () => setOnEdit(true)
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
      (selectedChannelId !== GENERAL_CHAT_ID || authLevel > 0) &&
      menuProps.length > 0
    );
  }, [authLevel, selectedChannelId, menuProps.length]);

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
          width: CALC(100% - ${authLevel > 0 ? '22rem' : '12rem'});
          @media (max-width: ${mobileMaxWidth}) {
            width: CALC(100% - ${authLevel > 0 ? '13rem' : '3rem'});
          }
        }
      `}
    >
      {loaded ? (
        <>
          {!onEdit && (
            <>
              <section>
                <div style={{ width: '100%' }}>
                  <span
                    className={css`
                      width: 100%;
                      cursor: default;
                      color: ${Color[chatTopicColor]()};
                      white-space: nowrap;
                      text-overflow: ellipsis;
                      overflow: hidden;
                      line-height: normal;
                      font-size: 2.2rem;
                      font-weight: bold;
                      display: block;
                      @media (max-width: ${mobileMaxWidth}) {
                        font-size: 1.6rem;
                      }
                    `}
                    onClick={() =>
                      setOnHover(
                        textIsOverflown(HeaderLabelRef.current)
                          ? !onHover
                          : false
                      )
                    }
                    onMouseOver={handleMouseOver}
                    onMouseLeave={() => setOnHover(false)}
                    ref={HeaderLabelRef}
                  >
                    {content}
                  </span>
                  <FullTextReveal text={content} show={onHover} />
                </div>
                <div style={{ width: '100%' }}>{subjectDetails}</div>
              </section>
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
                <Button
                  color={buttonColor}
                  hoverColor={buttonHoverColor}
                  filled
                  onClick={() => {
                    onSetIsRespondingToSubject({
                      channelId: selectedChannelId,
                      isResponding: true
                    });
                    onInputFocus();
                  }}
                >
                  <Icon flip="both" icon="reply" />
                </Button>
                {menuButtonShown && !banned?.chat && (
                  <DropdownButton
                    skeuomorphic
                    color="darkerGray"
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
                      minWidth: null,
                      maxWidth: null,
                      padding: '1rem'
                    }}
                  />
                </div>
              </div>
            </>
          )}
          {onEdit && (
            <EditSubjectForm
              autoFocus
              userIsOwner={currentChannel.creatorId === userId}
              channelId={selectedChannelId}
              displayedThemeColor={displayedThemeColor}
              maxLength={charLimit.chat.subject}
              currentSubjectId={subjectId}
              title={content}
              onEditSubmit={handleSubjectSubmit}
              onChange={handleSearchChatSubject}
              onClickOutSide={() => {
                setOnEdit(false);
                onClearSubjectSearchResults();
              }}
              onReloadChatSubject={handleReloadChatSubject}
              searchResults={subjectSearchResults}
            />
          )}
        </>
      ) : (
        <Loading
          style={{
            color: Color[displayedThemeColor]()
          }}
          text={`${loadingSubjectLabel}...`}
        />
      )}
    </ErrorBoundary>
  );

  function handleMouseOver() {
    if (textIsOverflown(HeaderLabelRef.current) && !deviceIsMobile) {
      setOnHover(true);
    }
  }

  async function handleReloadChatSubject(subjectId) {
    if (!reloadingChatSubject.current) {
      reloadingChatSubject.current = true;
      const { message, subject } = await reloadChatSubject({
        channelId: selectedChannelId,
        subjectId
      });
      onReloadChatSubject({ channelId: selectedChannelId, message, subject });
      socket.emit('new_subject', {
        subject,
        message,
        channelName: currentChannel.channelName,
        channelId: selectedChannelId,
        pathId: currentChannel.pathId
      });
      setOnEdit(false);
      onClearSubjectSearchResults();
      if (!deviceIsMobile) {
        onInputFocus();
      }
      reloadingChatSubject.current = false;
    }
  }

  async function handleSearchChatSubject(text) {
    const data = await searchChatSubject({
      text,
      channelId: selectedChannelId
    });
    onSearchChatSubject(data);
  }

  async function handleSubjectSubmit(text) {
    if (!submitting) {
      setSubmitting(true);
      try {
        const content = `${text[0].toUpperCase()}${text.slice(1)}`;
        const data = await uploadChatSubject({
          content: text,
          channelId: selectedChannelId
        });
        onUploadChatSubject({ ...data, channelId: selectedChannelId });
        const timeStamp = Math.floor(Date.now() / 1000);
        const subject = {
          id: data.subjectId,
          userId,
          username,
          reloadedBy: null,
          reloaderName: null,
          uploader: { id: userId, username },
          content,
          timeStamp
        };
        const message = {
          profilePicUrl,
          userId,
          username,
          content,
          isSubject: true,
          channelId: selectedChannelId,
          timeStamp,
          isNewMessage: true
        };
        socket.emit('new_subject', {
          subject,
          message,
          channelName: currentChannel.channelName,
          channelId: selectedChannelId,
          pathId: currentChannel.pathId
        });
        setOnEdit(false);
        setSubmitting(false);
        if (!deviceIsMobile) {
          onInputFocus();
        }
      } catch (error) {
        console.error(error);
        setSubmitting(false);
      }
    }
  }
}
