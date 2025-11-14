import React from 'react';
import Loading from '~/components/Loading';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import CloneSharedTopicButton from './CloneSharedTopicButton';
import UsernameText from '~/components/Texts/UsernameText';
import RichText from '~/components/Texts/RichText';
import { Color, borderRadius, liftedBoxShadow } from '~/constants/css';
import { css } from '@emotion/css';
import moment from 'moment';

export default function SharedTopicsList({
  channelId,
  channelName,
  displayedThemeColor,
  sharedTopicObj,
  pathId,
  onHide,
  onLoadMore
}: {
  channelId: number;
  channelName: string;
  displayedThemeColor: string;
  sharedTopicObj: {
    subjects: any[];
    loading: boolean;
    loadMoreButton: boolean;
  };
  pathId: string;
  onHide: () => void;
  onLoadMore: () => void;
}) {
  if (sharedTopicObj.loading && !sharedTopicObj.subjects.length) {
    return <Loading style={{ height: '12rem' }} />;
  }

  if (!sharedTopicObj.subjects.length) {
    return (
      <div
        className={css`
          width: 100%;
          text-align: center;
          padding: 3rem 0;
          font-size: 1.5rem;
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
          <article key={`shared-${subject.id}`} className={cardClass}>
            <header
              className={css`
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1rem;
              `}
            >
              <div>
                <h4
                  className={css`
                    margin: 0;
                    font-size: 1.5rem;
                    color: ${Color[displayedThemeColor]()};
                  `}
                >
                  {subject.content}
                </h4>
                <div
                  className={css`
                    font-size: 1.2rem;
                    color: ${Color.darkerGray()};
                    margin-top: 0.3rem;
                  `}
                >
                  <UsernameText
                    user={{ id: subject.userId, username: subject.username }}
                  />
                  {subject.timeStamp && (
                    <small style={{ marginLeft: '0.5rem' }}>
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
      {sharedTopicObj.loadMoreButton && (
        <LoadMoreButton
          filled
          style={{ marginTop: '1rem' }}
          loading={sharedTopicObj.loading}
          onClick={onLoadMore}
        />
      )}
    </div>
  );
}

const cardClass = css`
  width: 100%;
  background: ${Color.white()};
  border-radius: ${borderRadius};
  padding: 0.3rem 1rem 1.5rem 1rem;
  margin-bottom: 1.5rem;
  box-shadow: ${liftedBoxShadow};
  border: 1px solid ${Color.borderGray(0.6)};
`;
