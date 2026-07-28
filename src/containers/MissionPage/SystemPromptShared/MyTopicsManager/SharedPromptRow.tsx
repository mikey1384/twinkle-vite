import React from 'react';
import { css } from '@emotion/css';
import moment from 'moment';
import Icon from '~/components/Icon';
import ShareButton from '~/components/Buttons/ShareButton';
import SharedPromptBlock from '~/components/SharedPromptBlock';
import SwitchButton from '~/components/Buttons/SwitchButton';
import RichText from '~/components/Texts/RichText';
import { Color } from '~/constants/css';
import { getPromptStats } from './promptStats';
import type { MyTopic } from './types';

export default function SharedPromptRow({
  topic,
  updatingTopicId,
  onToggleShare,
  onOpen
}: {
  topic: MyTopic;
  updatingTopicId: number | null;
  onToggleShare: (topic: MyTopic) => void;
  onOpen: (topicId: number) => void;
}) {
  return (
    <SharedPromptBlock
      headerRight={
        <div className={headerActionsClass}>
          <ShareButton
            variant="compact"
            linkPath={`/shared-prompts/${topic.id}`}
          />
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
      }
      meta={
        topic.sharedAt ? (
          <span className={sharedAtClass}>
            <Icon icon="users" style={{ fontSize: '1.1rem' }} />
            Shared {moment.unix(topic.sharedAt).fromNow()}
          </span>
        ) : null
      }
      stats={getPromptStats({ topic, onOpen })}
      title={topic.content}
      onTitleClick={() => onOpen(topic.id)}
    >
      {topic.customInstructions ? (
        <RichText
          contentType="customInstructions"
          contentId={topic.id}
          maxLines={4}
        >
          {topic.customInstructions}
        </RichText>
      ) : null}
    </SharedPromptBlock>
  );
}

const headerActionsClass = css`
  display: flex;
  align-items: center;
  gap: 0.6rem;
`;

const sharedAtClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: ${Color.gray()};
`;
