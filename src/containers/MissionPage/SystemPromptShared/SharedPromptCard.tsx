import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import Button from '~/components/Button';
import CloneButtons from '~/components/Buttons/CloneButtons';
import Icon from '~/components/Icon';
import ShareButton from '~/components/Buttons/ShareButton';
import Input from '~/components/Texts/Input';
import SharedPromptBlock from '~/components/SharedPromptBlock';
import RichText from '~/components/Texts/RichText';
import RankBadge from '~/components/RankBadge';
import UsernameText from '~/components/Texts/UsernameText';
import { useNavigate } from 'react-router-dom';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { addEmoji, stringIsEmpty } from '~/helpers/stringHelpers';
import { useLazyLoad } from '~/helpers/hooks';
import { useInView } from 'react-intersection-observer';
import moment from 'moment';

const cardHeights: Record<number, number> = {};

export interface CloneEntry {
  target: 'zero' | 'ciel';
  channelId: number;
  topicId: number;
}

export interface SharedTopic {
  id: number;
  subjectId?: number;
  content: string;
  userId: number;
  username: string;
  timeStamp?: number;
  sharedAt?: number;
  profileTheme?: string;
  customInstructions?: string;
  settings?: any;
  cloneCount?: number;
  messageCount?: number;
  numComments?: number;
  myClones?: CloneEntry[];
}

function SharedPromptCard({
  topic,
  isOwnTopic,
  userId,
  rank,
  showCommentComposer = true,
  commentText,
  commentSubmitting,
  onCommentTextChange,
  onCommentSubmit,
  onCloneSuccess
}: {
  topic: SharedTopic;
  isOwnTopic: boolean;
  userId: number;
  rank?: number;
  showCommentComposer?: boolean;
  commentText?: string;
  commentSubmitting?: boolean;
  onCommentTextChange?: (text: string) => void;
  onCommentSubmit?: () => void;
  onCloneSuccess: (data: {
    sharedTopicId: number;
    target: 'zero' | 'ciel';
    topicId: number;
    channelId: number;
    title: string;
  }) => void;
}) {
  const navigate = useNavigate();
  const PanelRef = useRef<HTMLDivElement>(null);
  const placeholderHeightRef = useRef(cardHeights[topic.id]);
  const [placeholderHeight, setPlaceholderHeight] = useState(
    cardHeights[topic.id]
  );

  const [inViewRef, inView] = useInView({
    rootMargin: '200px 0px'
  });

  const isVisible = useLazyLoad({
    id: `shared-prompt-${topic.id}`,
    inView,
    PanelRef,
    onSetPlaceholderHeight: (height: number) => {
      setPlaceholderHeight(height);
      placeholderHeightRef.current = height;
    },
    delay: 1000
  });

  useEffect(() => {
    return function cleanUp() {
      cardHeights[topic.id] = placeholderHeightRef.current;
    };
  }, [topic.id]);

  const contentShown = useMemo(() => inView || isVisible, [inView, isVisible]);
  const componentHeight = useMemo(
    () => placeholderHeight || 200,
    [placeholderHeight]
  );

  const instructions =
    topic.customInstructions || topic.settings?.customInstructions || '';

  return (
    <article ref={inViewRef} className={cardClass}>
      {!contentShown ? (
        <div style={{ width: '100%', height: componentHeight }} />
      ) : (
        <div ref={PanelRef}>
          <SharedPromptBlock
            footer={
              showCommentComposer || !isOwnTopic
                ? renderActions()
                : undefined
            }
            headerRight={
              <div className={headerActionsClass}>
                {rank ? (
                  <span className={rankBadgeWrapClass}>
                    <RankBadge rank={rank} />
                  </span>
                ) : null}
                <ShareButton
                  variant="compact"
                  linkPath={`/shared-prompts/${topic.id}`}
                />
              </div>
            }
            meta={
              <>
                <UsernameText
                  user={{ id: topic.userId, username: topic.username }}
                />
                {topic.timeStamp ? (
                  <small>{moment.unix(topic.timeStamp).fromNow()}</small>
                ) : null}
                {isOwnTopic ? (
                  <span className={ownBadgeClass}>Your prompt</span>
                ) : null}
              </>
            }
            stats={[
              {
                label: Number(topic.cloneCount) === 1 ? 'clone' : 'clones',
                value: topic.cloneCount || 0
              },
              {
                label: Number(topic.messageCount) === 1 ? 'message' : 'messages',
                value: topic.messageCount || 0
              },
              {
                icon: 'comment',
                label: Number(topic.numComments) === 1 ? 'comment' : 'comments',
                onClick: () => navigate(`/shared-prompts/${topic.id}`),
                value: topic.numComments || 0
              }
            ]}
            themeName={topic.profileTheme}
            title={topic.content}
            onTitleClick={() => navigate(`/shared-prompts/${topic.id}`)}
          >
            {instructions ? (
              <RichText
                contentType="sharedTopic"
                contentId={topic.id}
                maxLines={8}
                isShowMoreButtonCentered
                theme={topic.profileTheme}
              >
                {instructions}
              </RichText>
            ) : null}
          </SharedPromptBlock>
        </div>
      )}
    </article>
  );

  function renderActions() {
    return (
      <>
        <CloneButtons
          sharedTopicId={topic.subjectId || topic.id}
          sharedTopicTitle={topic.content}
          uploaderId={topic.userId}
          myClones={topic.myClones}
          onCloneSuccess={onCloneSuccess}
        />
        {showCommentComposer && userId ? (
          <div className={commentRowClass}>
            <Input
              placeholder="Write a comment..."
              value={commentText || ''}
              onChange={onCommentTextChange || (() => {})}
              onKeyUp={(event: React.KeyboardEvent) => {
                if (event.key === ' ') {
                  const converted = addEmoji(commentText || '');
                  if (converted !== commentText) {
                    onCommentTextChange?.(converted);
                  }
                }
              }}
              onKeyDown={(event: React.KeyboardEvent) => {
                if (event.key === 'Enter') {
                  onCommentSubmit?.();
                }
              }}
              style={{ flex: 1 }}
            />
            <Button
              color="logoBlue"
              variant="soft"
              tone="raised"
              disabled={stringIsEmpty(commentText || '') || commentSubmitting}
              onClick={() => onCommentSubmit?.()}
            >
              {commentSubmitting ? (
                <Icon icon="spinner" pulse />
              ) : (
                <Icon icon="paper-plane" />
              )}
            </Button>
          </div>
        ) : null}
      </>
    );
  }
}

export default memo(SharedPromptCard);

// Placement only — the frame and typography belong to SharedPromptBlock.
const cardClass = css`
  width: 100%;
  display: flex;
  flex-direction: column;

  @media (max-width: ${mobileMaxWidth}) {
    .shared-prompt-block {
      border-radius: 0;
      border-left: 0;
      border-right: 0;
    }
  }
`;

const commentRowClass = css`
  display: flex;
  width: 100%;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const headerActionsClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
`;



const rankBadgeWrapClass = css`
  display: inline-flex;
  font-size: 1.1rem;
`;

const ownBadgeClass = css`
  padding: 0.2rem 0.5rem;
  background: ${Color.logoBlue(0.1)};
  border: 1px solid ${Color.logoBlue(0.3)};
  border-radius: 4px;
  color: ${Color.logoBlue()};
  font-size: 1.1rem;
  font-weight: 700;
`;
