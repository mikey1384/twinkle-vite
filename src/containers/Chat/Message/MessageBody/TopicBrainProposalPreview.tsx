import React, { useState } from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import { useAppContext } from '~/contexts';
import { WEBSITE_AGENT_UI_ATTRIBUTE } from '~/helpers/websiteAgentPage';
import type {
  TopicBrainCardPreview,
  TopicBrainProposal
} from '~/helpers/topicBrain';
import BrainDiff from '~/containers/Chat/Modals/TopicSettingsModal/TopicBrain/BrainDiff';

// On a Zero/Ciel approval card for a topic brain change: the exact words
// that would be saved, read from the server when the member opens it. What
// they approve is this proposal, word for word.
export default function TopicBrainProposalPreview({
  preview,
  decided
}: {
  preview: TopicBrainCardPreview;
  // the card is already answered
  decided: boolean;
}) {
  const loadTopicBrainProposal = useAppContext(
    (v) => v.requestHelpers.loadTopicBrainProposal
  );
  const [open, setOpen] = useState(false);
  const [proposal, setProposal] = useState<TopicBrainProposal | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const where =
    preview.section === 'instructions'
      ? 'Custom Instructions'
      : 'Notes for next time';

  return (
    <div className={boxCls} {...{ [WEBSITE_AGENT_UI_ATTRIBUTE]: '' }}>
      <button
        type="button"
        className={toggleCls}
        aria-expanded={open}
        onClick={handleToggle}
      >
        <Icon icon={open ? 'chevron-down' : 'chevron-right'} />
        <span>
          {decided ? 'See what it was' : 'See what changes'} in {where}
        </span>
      </button>
      {open && (
        <div className={bodyCls}>
          {loading ? (
            <span className="quiet">
              <Icon icon="spinner" pulse /> Loading…
            </span>
          ) : failed || !proposal ? (
            <span className="quiet">
              Couldn’t load this. Tap again to retry.
            </span>
          ) : (
            <>
              {proposal.outdated && !decided && (
                <p className="warn">
                  This was changed after {proposal.assistantName} wrote the
                  suggestion. Ask again to get a fresh one.
                </p>
              )}
              <BrainDiff before={proposal.before} after={proposal.after} />
              {proposal.updatesSharedPrompt && !decided && (
                <p className="note">
                  This topic is shared as an AI Prompt, so the shared prompt
                  changes too.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );

  async function handleToggle() {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (loading) return;
    setLoading(true);
    setFailed(false);
    try {
      const data = await loadTopicBrainProposal({
        channelId: preview.channelId,
        topicId: preview.topicId,
        proposalId: preview.proposalId
      });
      setProposal(data?.proposal || null);
    } catch (error) {
      console.error(error);
      setFailed(true);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }
}

const boxCls = css`
  align-self: flex-start;
  width: min(100%, 60rem);
  max-width: 85%;
`;

const toggleCls = css`
  display: inline-flex;
  align-items: center;
  gap: 0.7rem;
  min-height: 4rem;
  padding: 0.4rem 1rem;
  border: 1px solid var(--ui-border);
  border-radius: 999px;
  background: var(--chat-bg);
  color: var(--chat-text);
  font: inherit;
  font-size: var(--build-workshop-choice-font-size);
  font-weight: 700;
  cursor: pointer;
  &:hover,
  &:focus-visible {
    border-color: rgba(100, 116, 139, 0.5);
  }
`;

const bodyCls = css`
  margin-top: 0.6rem;
  .quiet {
    color: #526176;
    font-size: var(--build-workshop-choice-font-size);
  }
  .note {
    margin: 0.6rem 0 0;
    color: #526176;
    font-size: var(--build-workshop-choice-font-size);
  }
  .warn {
    margin: 0 0 0.6rem;
    color: #92400e;
    font-size: var(--build-workshop-choice-font-size);
    font-weight: 600;
  }
`;
