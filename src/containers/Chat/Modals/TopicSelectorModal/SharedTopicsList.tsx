import React from 'react';
import Loading from '~/components/Loading';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import CloneSharedTopicButton from './CloneSharedTopicButton';
import UsernameText from '~/components/Texts/UsernameText';
import RichText from '~/components/Texts/RichText';
import { Color, borderRadius } from '~/constants/css';
import { css } from '@emotion/css';
import moment from 'moment';
import TopicRequestStatus from '../TopicRequestStatus';
import { chatTopicActionStyle, chatTopicRowClass, chatTopicTitleClass, chatTopicMetadataClass } from '../topicStyles';

export default function SharedTopicsList({
  channelId,
  channelName,
  displayedThemeColor,
  sharedTopicObj,
  pathId,
  onHide,
  onLoadMore,
  onRetry
}: {
  channelId: number;
  channelName: string;
  displayedThemeColor: string;
  sharedTopicObj: {
    subjects: any[];
    loading: boolean;
    loadMoreButton: boolean;
    error?: string;
  };
  pathId: string;
  onHide: () => void;
  onLoadMore: () => void;
  onRetry: () => void;
}) {
  if (sharedTopicObj.loading && !sharedTopicObj.subjects.length) {
    return <Loading text="Loading shared topics" innerStyle={{ fontSize: '14px' }} style={{ minHeight: 120 }} />;
  }

  if (sharedTopicObj.error && !sharedTopicObj.subjects.length) {
    return <TopicRequestStatus message={sharedTopicObj.error} onRetry={onRetry} />;
  }

  if (!sharedTopicObj.subjects.length) {
    return (
      <div
        className={css`
          width: 100%;
          text-align: center;
          padding: 3rem 0;
          font-size: 16px;
          color: ${Color.darkerGray()};
        `}
      >
        No shared topics yet. Be the first to share!
      </div>
    );
  }

  return (
    <div>
      {sharedTopicObj.subjects.map((subject) => {
        const sharedInstructions =
          subject.customInstructions ||
          subject.settings?.customInstructions ||
          '';
        return (
          <article key={`shared-${subject.id}`} className={chatTopicRowClass} style={{ display: 'block' }}>
            <header
              className={css`
                display: grid;
                grid-template-columns: minmax(0, 1fr) auto;
                align-items: center;
                gap: 12px;
                margin-bottom: 12px;
                @media (max-width: 600px) {
                  grid-template-columns: minmax(0, 1fr);
                  > :last-child { justify-self: end; }
                }
              `}
            >
              <div style={{ minWidth: 0 }}>
                <h4
                  className={chatTopicTitleClass}
                  style={{ margin: 0 }}
                >
                  {subject.content}
                </h4>
                <div
                  className={chatTopicMetadataClass}
                >
                  <UsernameText
                    color="#526176"
                    textStyle={{ fontSize: '14px', fontWeight: 600 }}
                    user={{ id: subject.userId, username: subject?.username }}
                  />
                  {subject.timeStamp && (
                    <small>
                      {moment.unix(subject.timeStamp).fromNow()}
                    </small>
                  )}
                </div>
              </div>
              <CloneSharedTopicButton
                channelId={channelId}
                channelName={channelName}
                pathId={pathId}
                themeColor={displayedThemeColor}
                sharedTopicId={subject.subjectId || subject.id}
                onStartTopic={onHide}
              />
            </header>
            {sharedInstructions && (
              <div
                className={css`
                  padding: 1rem;
                  border-radius: ${borderRadius};
                  border: 1px solid ${Color.borderGray()};
                  background: ${Color.highlightGray()};
                  font-size: 16px;
                  line-height: 1.6;
                  overflow-wrap: anywhere;
                `}
              >
                <RichText
                  contentType="sharedTopic"
                  contentId={subject.id}
                  maxLines={5}
                  isShowMoreButtonCentered
                >
                  {sharedInstructions}
                </RichText>
              </div>
            )}
          </article>
        );
      })}
      {sharedTopicObj.error && <TopicRequestStatus message={sharedTopicObj.error} onRetry={onRetry} />}
      {sharedTopicObj.loadMoreButton && !sharedTopicObj.error && (
        <LoadMoreButton
          filled
          style={{ ...chatTopicActionStyle, marginTop: '1rem' }}
          loading={sharedTopicObj.loading}
          onClick={onLoadMore}
        />
      )}
    </div>
  );
}
