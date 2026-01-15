import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import Button from '~/components/Button';
import CloneButtons from '~/components/Buttons/CloneButtons';
import Icon from '~/components/Icon';
import Input from '~/components/Texts/Input';
import RichText from '~/components/Texts/RichText';
import UsernameText from '~/components/Texts/UsernameText';
import { useNavigate } from 'react-router-dom';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { addEmoji, stringIsEmpty } from '~/helpers/stringHelpers';
import { useLazyLoad } from '~/helpers/hooks';
import { useInView } from 'react-intersection-observer';
import moment from 'moment';

// Store heights outside component to persist across re-renders
const cardHeights: Record<number, number> = {};

interface CloneEntry {
  target: 'zero' | 'ciel';
  channelId: number;
  topicId: number;
}

interface SharedTopic {
  id: number;
  subjectId?: number;
  content: string;
  userId: number;
  username: string;
  timeStamp?: number;
  sharedAt?: number;
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
  copiedId,
  commentText,
  commentSubmitting,
  onCommentTextChange,
  onCommentSubmit,
  onCopyEmbed,
  onCloneSuccess
}: {
  topic: SharedTopic;
  isOwnTopic: boolean;
  userId: number;
  copiedId: number | null;
  commentText: string;
  commentSubmitting: boolean;
  onCommentTextChange: (text: string) => void;
  onCommentSubmit: () => void;
  onCopyEmbed: () => void;
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
          <div>
            <h3
              className={titleClass}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/shared-prompts/${topic.id}`);
              }}
            >
              {topic.content}
            </h3>
            <div className={metaRowClass}>
              <UsernameText
                user={{ id: topic.userId, username: topic.username }}
              />
              {topic.timeStamp && (
                <small>{moment.unix(topic.timeStamp).fromNow()}</small>
              )}
              {isOwnTopic && (
                <span className={ownBadgeClass}>Your prompt</span>
              )}
              <div className={statsRowClass}>
                <div className={statPillClass}>
                  <span className={boldClass}>{topic.cloneCount || 0}</span>
                  {Number(topic.cloneCount) === 1 ? 'clone' : 'clones'}
                </div>
                <div className={statPillClass}>
                  <span className={boldClass}>{topic.messageCount || 0}</span>
                  {Number(topic.messageCount) === 1 ? 'message' : 'messages'}
                </div>
                <div
                  className={statPillClass}
                  style={{ cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/shared-prompts/${topic.id}`);
                  }}
                >
                  <Icon icon="comment" />
                  <span className={boldClass}>{topic.numComments || 0}</span>
                  {Number(topic.numComments) === 1 ? 'comment' : 'comments'}
                </div>
                <div
                  className={`${statPillClass} ${copyPillClass}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopyEmbed();
                  }}
                >
                  <Icon icon={copiedId === topic.id ? 'check' : 'copy'} />
                </div>
              </div>
            </div>
          </div>
          {instructions && (
            <div className={instructionsClass}>
              <RichText
                contentType="sharedTopic"
                contentId={topic.id}
                maxLines={8}
                isShowMoreButtonCentered
              >
                {instructions}
              </RichText>
            </div>
          )}
          <CloneButtons
            sharedTopicId={topic.subjectId || topic.id}
            sharedTopicTitle={topic.content}
            uploaderId={topic.userId}
            myClones={topic.myClones}
            onCloneSuccess={onCloneSuccess}
          />
          {userId && (
            <div
              className={css`
                display: flex;
                gap: 0.5rem;
                margin-top: 0.5rem;
              `}
            >
              <Input
                placeholder="Write a comment..."
                value={commentText}
                onChange={onCommentTextChange}
                onKeyUp={(event: React.KeyboardEvent) => {
                  if (event.key === ' ') {
                    const converted = addEmoji(commentText);
                    if (converted !== commentText) {
                      onCommentTextChange(converted);
                    }
                  }
                }}
                onKeyDown={(event: React.KeyboardEvent) => {
                  if (event.key === 'Enter') {
                    onCommentSubmit();
                  }
                }}
                style={{ flex: 1 }}
              />
              <Button
                color="logoBlue"
                variant="soft"
                tone="raised"
                disabled={stringIsEmpty(commentText) || commentSubmitting}
                onClick={onCommentSubmit}
              >
                {commentSubmitting ? (
                  <Icon icon="spinner" pulse />
                ) : (
                  <Icon icon="paper-plane" />
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export default memo(SharedPromptCard);

const cardClass = css`
  width: 100%;
  background: #fff;
  border-radius: ${borderRadius};
  padding: 1rem 1rem 1.3rem;
  border: 1px solid var(--ui-border);
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  transition: border-color 0.18s ease;
  &:hover {
    border-color: var(--ui-border-strong);
  }
  @media (max-width: ${mobileMaxWidth}) {
    border-radius: 0;
    border-left: 0;
    border-right: 0;
    border-top: 0;
    &:last-child {
      border-bottom: 0;
    }
  }
`;

const statsRowClass = css`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  font-size: 1.1rem;
  color: ${Color.darkerGray()};
`;

const statPillClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  background: ${Color.highlightGray(0.2)};
  border: 1px solid var(--ui-border);
  font-size: 1.1rem;
  font-weight: 500;
`;

const copyPillClass = css`
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
  &:hover {
    background: ${Color.highlightGray(0.4)};
    border-color: ${Color.darkerBorderGray()};
  }
`;

const titleClass = css`
  margin: 0;
  font-size: 1.8rem;
  color: ${Color.logoBlue()};
  font-weight: 700;
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;

const metaRowClass = css`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  color: ${Color.darkerGray()};
  font-size: 1.3rem;
  margin-top: 0.3rem;
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

const instructionsClass = css`
  margin: 0.8rem 0;
  padding: 1rem;
  border-radius: ${borderRadius};
  border: 1px solid var(--ui-border);
  background: #fff;
  font-size: 1.3rem;
  line-height: 1.6;
`;

const boldClass = css`
  font-weight: 700;
`;
