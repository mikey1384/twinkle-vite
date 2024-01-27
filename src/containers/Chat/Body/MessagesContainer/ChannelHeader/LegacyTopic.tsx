import React, { useContext, useMemo, useEffect, useRef, useState } from 'react';
import UsernameText from '~/components/Texts/UsernameText';
import EditSubjectForm from './EditSubjectForm';
import FullTextReveal from '~/components/Texts/FullTextReveal';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import Loading from '~/components/Loading';
import LocalContext from '../../../Context';
import { css } from '@emotion/css';
import { socket } from '~/constants/io';
import { isMobile, textIsOverflown } from '~/helpers';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useKeyContext } from '~/contexts';
import { useInterval, useTheme } from '~/helpers/hooks';
import { timeSince } from '~/helpers/timeStampHelpers';
import { charLimit, defaultChatSubject } from '~/constants/defaultValues';

const deviceIsMobile = isMobile(navigator);

export default function LegacyTopic({
  displayedThemeColor,
  currentChannel,
  isEditingTopic,
  isLoaded,
  onInputFocus,
  selectedChannelId,
  subchannelId,
  topicObj,
  onSetIsEditingTopic
}: {
  currentChannel: any;
  displayedThemeColor: string;
  isEditingTopic: boolean;
  isLoaded: boolean;
  onInputFocus: () => void;
  selectedChannelId: number;
  subchannelId: number;
  topicObj: any;
  onSetIsEditingTopic: (isEditing: boolean) => void;
}) {
  const {
    actions: {
      onClearSubjectSearchResults,
      onReloadChatSubject,
      onSearchChatSubject,
      onSetIsRespondingToSubject,
      onUploadChatSubject
    },
    requests: { reloadChatSubject, searchChatSubject, uploadChatSubject },
    state: { subjectSearchResults }
  } = useContext(LocalContext);
  const {
    content,
    timeStamp,
    reloadTimeStamp,
    reloader = {},
    uploader = {}
  } = topicObj;
  const { profilePicUrl, userId, username } = useKeyContext((v) => v.myState);
  const {
    button: { color: buttonColor },
    buttonHovered: { color: buttonHoverColor },
    chatTopic: { color: chatTopicColor }
  } = useTheme(displayedThemeColor);
  const reloadingChatSubject = useRef(false);
  const HeaderLabelRef: React.RefObject<any> = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [onHover, setOnHover] = useState(false);
  const [timeSincePost, setTimeSincePost] = useState(timeSince(timeStamp));
  const [timeSinceReload, setTimeSinceReload] = useState(
    timeSince(reloadTimeStamp)
  );
  const displayedContent = useMemo(() => {
    return content || defaultChatSubject;
  }, [content]);
  const subjectDetails = useMemo(() => {
    const isReloaded = reloader && reloader.id;
    let posterString: any = '';
    if (uploader.id && timeSincePost) {
      posterString = (
        <span>
          posted by <UsernameText user={uploader} />{' '}
          <span className="desktop">{timeSincePost}</span>
        </span>
      );
    }
    if (isReloaded && timeSinceReload) {
      posterString = (
        <span>
          Featured by <UsernameText user={reloader} />{' '}
          <span className="desktop">{timeSinceReload}</span>{' '}
          <span className="desktop">
            (posted by {<UsernameText user={uploader} />})
          </span>
        </span>
      );
    }
    return <small>{posterString}</small>;
  }, [reloader, timeSincePost, timeSinceReload, uploader]);
  useEffect(() => {
    setTimeSincePost(timeSince(timeStamp));
    setTimeSinceReload(timeSince(reloadTimeStamp));
  }, [timeStamp, reloadTimeStamp]);

  useInterval(() => {
    setTimeSincePost(timeSince(timeStamp));
    setTimeSinceReload(timeSince(reloadTimeStamp));
  }, 1000);

  return (
    <section
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}
    >
      <div
        style={{
          display: 'flex',
          flexGrow: 1,
          marginRight: '1rem',
          flexDirection: 'column'
        }}
      >
        {!isLoaded ? (
          <Loading text="Loading Topic" />
        ) : isEditingTopic ? (
          <EditSubjectForm
            autoFocus
            userIsOwner={currentChannel.creatorId === userId}
            channelId={selectedChannelId}
            displayedThemeColor={displayedThemeColor}
            maxLength={charLimit.chat.subject}
            currentSubjectId={topicObj.id}
            title={content}
            onEditSubmit={handleSubjectSubmit}
            onChange={handleSearchChatSubject}
            onClickOutSide={() => {
              onSetIsEditingTopic(false);
              onClearSubjectSearchResults();
            }}
            onReloadChatSubject={handleReloadChatSubject}
            searchResults={subjectSearchResults}
          />
        ) : (
          <div>
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
                  textIsOverflown(HeaderLabelRef.current) ? !onHover : false
                )
              }
              onMouseOver={handleMouseOver}
              onMouseLeave={() => setOnHover(false)}
              ref={HeaderLabelRef}
            >
              {displayedContent}
            </span>
            <FullTextReveal text={displayedContent} show={onHover} />
          </div>
        )}
        <div style={{ width: '100%' }}>{subjectDetails}</div>
      </div>
      <div>
        <Button
          color={buttonColor}
          hoverColor={buttonHoverColor}
          filled
          onClick={() => {
            onSetIsRespondingToSubject({
              channelId: selectedChannelId,
              subchannelId,
              subjectId: topicObj.id,
              isResponding: true
            });
            onInputFocus();
          }}
        >
          <Icon flip="both" icon="reply" />
        </Button>
      </div>
    </section>
  );

  function handleMouseOver() {
    if (textIsOverflown(HeaderLabelRef.current) && !deviceIsMobile) {
      setOnHover(true);
    }
  }

  async function handleReloadChatSubject(subjectId: number) {
    if (!reloadingChatSubject.current) {
      reloadingChatSubject.current = true;
      const { message, subject } = await reloadChatSubject({
        channelId: selectedChannelId,
        subchannelId,
        subjectId
      });
      onReloadChatSubject({
        channelId: selectedChannelId,
        subchannelId,
        message,
        subject
      });
      socket.emit('new_subject', {
        subject,
        message,
        channelName: currentChannel.channelName,
        channelId: selectedChannelId,
        subchannelId,
        pathId: currentChannel.pathId
      });
      onSetIsEditingTopic(false);
      onClearSubjectSearchResults();
      if (!deviceIsMobile) {
        onInputFocus();
      }
      reloadingChatSubject.current = false;
    }
  }

  async function handleSearchChatSubject(text: string) {
    const data = await searchChatSubject({
      text,
      channelId: selectedChannelId
    });
    onSearchChatSubject(data);
  }

  async function handleSubjectSubmit(text: string) {
    if (!submitting) {
      setSubmitting(true);
      try {
        const content = `${text[0].toUpperCase()}${text.slice(1)}`;
        const data = await uploadChatSubject({
          content: text,
          channelId: selectedChannelId,
          subchannelId
        });
        onUploadChatSubject({
          ...data,
          channelId: selectedChannelId,
          subchannelId
        });
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
          isNewMessage: true,
          subchannelId
        };
        socket.emit('new_subject', {
          subject,
          message,
          channelName: currentChannel.channelName,
          channelId: selectedChannelId,
          subchannelId,
          pathId: currentChannel.pathId
        });
        onSetIsEditingTopic(false);
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