import React from 'react';
import { css } from '@emotion/css';
import moment from 'moment';
import Icon from '~/components/Icon';
import SwitchButton from '~/components/Buttons/SwitchButton';
import RichText from '~/components/Texts/RichText';
import { borderRadius, Color } from '~/constants/css';
import PromptStatsRow from './PromptStatsRow';
import type { MyTopic } from './types';

export default function SharedPromptRow({
  topic,
  copiedId,
  updatingTopicId,
  onCopyEmbed,
  onToggleShare,
  onOpen
}: {
  topic: MyTopic;
  copiedId: number | null;
  updatingTopicId: number | null;
  onCopyEmbed: (topicId: number) => void;
  onToggleShare: (topic: MyTopic) => void;
  onOpen: (topicId: number) => void;
}) {
  return (
    <div className={containerClass}>
      <div className={headerRowClass}>
        <div className={css`
          flex: 1;
        `}>
          <h4 className={titleClass} onClick={() => onOpen(topic.id)}>
            {topic.content}
          </h4>
          {topic.sharedAt && (
            <div className={sharedAtClass}>
              <Icon icon="users" style={{ fontSize: '1rem' }} />
              <span>Shared {moment.unix(topic.sharedAt).fromNow()}</span>
            </div>
          )}
          <PromptStatsRow
            topicId={topic.id}
            cloneCount={topic.cloneCount}
            messageCount={topic.messageCount}
            numComments={topic.numComments}
            copiedId={copiedId}
            onCopyEmbed={onCopyEmbed}
          />
        </div>
        <SwitchButton
          checked={topic.isSharedWithOtherUsers}
          onChange={() => onToggleShare(topic)}
          disabled={updatingTopicId === topic.id}
          label="Share"
          labelStyle={{
            fontSize: '1.2rem',
            color: Color.darkerGray(),
            fontWeight: '500'
          }}
        />
      </div>
      {topic.customInstructions && (
        <div className={instructionsClass}>
          <RichText
            contentType="customInstructions"
            contentId={topic.id}
            maxLines={4}
            style={{
              fontSize: '1.2rem',
              color: Color.darkerGray()
            }}
          >
            {topic.customInstructions}
          </RichText>
        </div>
      )}
    </div>
  );
}

const containerClass = css`
  padding: 1.2rem;
  border: 1px solid var(--ui-border);
  border-radius: ${borderRadius};
  background: ${Color.logoBlue(0.03)};
  transition: all 0.2s ease;
`;

const headerRowClass = css`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.8rem;
`;

const titleClass = css`
  margin: 0 0 0.3rem;
  font-size: 1.6rem;
  color: ${Color.black()};
  font-weight: 800;
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;

const sharedAtClass = css`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
  color: ${Color.gray()};
  margin-bottom: 0.5rem;
`;

const instructionsClass = css`
  padding: 0.8rem;
  border-radius: ${borderRadius};
  border: 1px solid var(--ui-border);
  background: #fff;
`;

