import React from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import { WEBSITE_AGENT_UI_ATTRIBUTE } from '~/helpers/websiteAgentPage';

export interface MessageCleanupPreviewData {
  kind: 'message_cleanup';
  action: 'remove' | 'restore';
  channelId: number;
  topicId: number;
  messageIds: number[];
  count: number;
  samples: { id: number; text: string; mine: boolean }[];
  chatName?: string;
  topicTitle?: string;
  othersCount?: number;
}

export function isMessageCleanupPreview(
  value: unknown
): value is MessageCleanupPreviewData {
  const preview = value as MessageCleanupPreviewData;
  return (
    !!preview &&
    preview.kind === 'message_cleanup' &&
    (preview.action === 'remove' || preview.action === 'restore') &&
    Number.isFinite(preview.count) &&
    Array.isArray(preview.samples)
  );
}

// What a bulk Remove (or Undo) card covers: how many messages and the first
// few, so the member approves the exact list the assistant picked.
export default function MessageCleanupPreview({
  preview
}: {
  preview: MessageCleanupPreviewData;
}) {
  const restoring = preview.action === 'restore';
  const others = Number(preview.othersCount || 0);
  return (
    <div className={previewClass} {...{ [WEBSITE_AGENT_UI_ATTRIBUTE]: '' }}>
      <div className={headingClass}>
        <Icon icon={restoring ? 'undo' : 'trash-alt'} />
        <span>
          {restoring ? 'Bring back' : 'Remove'} {preview.count}{' '}
          {preview.count === 1 ? 'message' : 'messages'}
        </span>
      </div>
      {preview.chatName && (
        <p className={placeClass}>
          In {preview.chatName}
          {preview.topicTitle ? `, topic “${preview.topicTitle}”` : ''}
          {others > 0
            ? ` · ${others} ${others === 1 ? 'is' : 'are'} other people’s`
            : ''}
        </p>
      )}
      <ul>
        {preview.samples.map((sample) => (
          <li key={sample.id}>{sample.text || '(attachment)'}</li>
        ))}
        {preview.count > preview.samples.length && (
          <li className={moreClass}>
            and {preview.count - preview.samples.length} more
          </li>
        )}
      </ul>
      {!restoring && (
        <p className={noteClass}>
          {others > 0
            ? 'Messages you aren’t allowed to remove are skipped. '
            : ''}
          You can bring them back afterwards.
        </p>
      )}
    </div>
  );
}

const previewClass = css`
  width: 100%;
  min-width: 0;
  padding: 0.9rem 1.1rem;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 1rem;
  background: #fff;
  color: #2f3747;
  font-size: 1.2rem;
  ul {
    margin: 0.5rem 0 0;
    padding-left: 1.6rem;
  }
  li {
    overflow-wrap: anywhere;
    margin: 0.2rem 0;
  }
`;
const headingClass = css`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-weight: 700;
`;
const placeClass = css`
  margin: 0.3rem 0 0;
  color: #4c5767;
  overflow-wrap: anywhere;
`;
const moreClass = css`
  list-style: none;
  color: #64748b;
`;
const noteClass = css`
  margin: 0.5rem 0 0;
  color: #4c5767;
  font-size: 1.1rem;
`;
