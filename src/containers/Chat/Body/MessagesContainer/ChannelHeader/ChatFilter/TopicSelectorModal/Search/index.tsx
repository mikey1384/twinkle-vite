import React, { useMemo, useState } from 'react';
import Results from './Results';
import Loading from '~/components/Loading';
import Icon from '~/components/Icon';
import { useAppContext, useKeyContext, useChatContext } from '~/contexts';
import { css } from '@emotion/css';
import { socket } from '~/constants/io';
import {
  borderRadius,
  Color,
  getThemeStyles,
  mobileMaxWidth
} from '~/constants/css';

export default function Search({
  canAddTopic,
  channelId,
  channelName,
  currentTopicId,
  displayedThemeColor,
  maxTopicLength,
  onSelectTopic,
  onHide,
  pathId,
  searchedTopics,
  searched,
  searchText
}: {
  canAddTopic: boolean;
  channelId: number;
  channelName: string;
  currentTopicId: number;
  displayedThemeColor: string;
  maxTopicLength: number;
  onSelectTopic: (id: number) => void;
  onHide: () => void;
  pathId: string;
  searchedTopics: any[];
  searched: boolean;
  searchText: string;
}) {
  const { userId, username, profilePicUrl } = useKeyContext((v) => v.myState);
  const uploadChatTopic = useAppContext(
    (v) => v.requestHelpers.uploadChatTopic
  );
  const onUploadChatTopic = useChatContext((v) => v.actions.onUploadChatTopic);
  const onSetChannelState = useChatContext((v) => v.actions.onSetChannelState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const themeStyles = getThemeStyles(displayedThemeColor);
  const searchTextExceedsMax = useMemo(
    () => searchText.length > maxTopicLength,
    [searchText, maxTopicLength]
  );

  return (
    <div style={{ width: '100%', position: 'relative', minHeight: '10rem' }}>
      {!searched && !searchedTopics.length ? (
        <Loading style={{ height: '10rem' }} />
      ) : (
        <div style={{ width: '100%' }}>
          {!!searchedTopics.length && (
            <h3
              className={css`
                margin-top: 3rem;
                margin-bottom: 2rem;
                color: ${Color[displayedThemeColor]()};
              `}
            >
              Search Results
            </h3>
          )}
          {searchedTopics.length ? (
            <Results
              currentTopicId={currentTopicId}
              displayedThemeColor={displayedThemeColor}
              onSelectTopic={onSelectTopic}
              results={searchedTopics}
            />
          ) : (
            <div
              className={css`
                padding: 5rem 0;
                width: 100%;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                color: #333;
                font-family: 'Helvetica Neue', Arial, sans-serif;
                font-size: 2rem;
                text-align: center;
                font-weight: bold;
                @media (max-width: ${mobileMaxWidth}) {
                  font-size: 1.7rem;
                }
              `}
            >
              <p>
                {searchTextExceedsMax
                  ? `The topic is too long. Please keep it within ${maxTopicLength} characters.`
                  : canAddTopic
                  ? `"${searchText}"`
                  : ''}
              </p>
              {!searchTextExceedsMax &&
                (canAddTopic ? (
                  <button
                    disabled={isSubmitting}
                    className={css`
                      margin-top: 3rem;
                      padding: 1rem 2rem;
                      font-size: 1.5rem;
                      font-weight: bold;
                      color: ${themeStyles.text};
                      background-color: ${themeStyles.bg};
                      border: 1px solid ${themeStyles.border};
                      border-radius: ${borderRadius};
                      cursor: pointer;
                      transition: background-color 0.3s ease;

                      &:hover {
                        background-color: ${isSubmitting
                          ? themeStyles.disabledBg
                          : themeStyles.hoverBg};
                        border-color: ${isSubmitting
                          ? themeStyles.disabledBorder
                          : themeStyles.hoverBorder};
                      }

                      &:disabled {
                        cursor: not-allowed;
                        opacity: 0.5;
                      }
                    `}
                    onClick={() => handleStartTopic(searchText)}
                  >
                    <span>Start Topic</span>
                    {isSubmitting && (
                      <Icon
                        style={{ marginLeft: '0.7rem' }}
                        icon="spinner"
                        pulse
                      />
                    )}
                  </button>
                ) : (
                  <p>{`No topics found for "${searchText}"`}</p>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  async function handleStartTopic(text: string) {
    if (!isSubmitting) {
      setIsSubmitting(true);
      try {
        const data = await uploadChatTopic({
          content: text,
          channelId
        });
        onUploadChatTopic({
          ...data,
          channelId
        });
        const timeStamp = Math.floor(Date.now() / 1000);
        const topic = {
          id: data.subjectId,
          userId,
          username,
          reloadedBy: null,
          reloaderName: null,
          uploader: { id: userId, username },
          content: text,
          timeStamp
        };
        const message = {
          profilePicUrl,
          userId,
          username,
          content: text,
          isSubject: true,
          channelId,
          subjectId: data.subjectId,
          timeStamp,
          isNewMessage: true
        };
        socket.emit('new_subject', {
          topicObj: topic,
          subject: topic,
          message,
          channelName,
          channelId,
          pathId
        });
        onSetChannelState({
          channelId,
          newState: { selectedTab: 'all' }
        });
        onHide();
      } catch (error) {
        console.error(error);
      } finally {
        setIsSubmitting(false);
      }
    }
  }
}
