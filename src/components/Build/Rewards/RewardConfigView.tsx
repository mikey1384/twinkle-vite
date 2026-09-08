import React from 'react';
import { css } from '@emotion/css';
import type { RewardConfig, RewardReview } from './types';

export const rewardPanelClass = css`
  color: var(--chat-text);
  font-size: 1.1rem;
  line-height: 1.6;
  display: grid;
  gap: 1rem;
  min-width: 0;
  p,
  h3,
  h4 {
    margin: 0;
  }
  fieldset,
  article {
    border: 1px solid var(--ui-border, #ccd3df);
    border-radius: 12px;
    padding: 1rem;
    min-width: 0;
  }
  label {
    display: grid;
    gap: 0.3rem;
    font-size: 1.1rem;
  }
  input,
  textarea {
    width: 100%;
    box-sizing: border-box;
    background: var(--ui-background, #fff);
    color: inherit;
    border: 1px solid #9aa6b8;
    border-radius: 6px;
    padding: 0.65rem;
    font: inherit;
    min-width: 0;
  }
  textarea {
    min-height: 5rem;
    resize: vertical;
  }
  button {
    font: inherit;
    cursor: pointer;
    border: 1px solid #66768c;
    border-radius: 7px;
    padding: 0.55rem 0.85rem;
    background: #fff;
    color: #243653;
  }
  button:disabled {
    opacity: 0.55;
    cursor: default;
  }
  button[data-primary] {
    background: #264d9a;
    color: #fff;
    border-color: #264d9a;
  }
  button[data-danger] {
    color: #a1233c;
    border-color: #a1233c;
  }
  pre {
    max-height: 22rem;
    overflow: auto;
    padding: 1rem;
    background: #f2f4f8;
    color: #243653;
    font-size: 1rem;
  }
  [role='alert'] {
    color: #a1233c;
  }
  summary {
    cursor: pointer;
    overflow-wrap: anywhere;
  }
`;
export const rewardGridClass = css`
  display: grid;
  gap: 0.8rem;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr));
`;
export const budgetFields = [
  ['dailyXP', 'App XP per day'],
  ['dailyCoins', 'App Coins per day'],
  ['userDailyXP', 'XP per learner per day'],
  ['userDailyCoins', 'Coins per learner per day'],
  ['lifetimeXP', 'Total XP budget'],
  ['lifetimeCoins', 'Total Coin budget']
] as const;
export function RewardConfigSummary({ config }: { config: RewardConfig }) {
  return (
    <div className={rewardPanelClass}>
      <div className={rewardGridClass}>
        {budgetFields.map(([key, label]) => (
          <div key={key}>
            <strong>{label}</strong>
            <div>{config[key].toLocaleString()}</div>
          </div>
        ))}
      </div>
      {config.rules.length === 0 && <p>This release turns rewards off.</p>}
      {config.rules.map((rule) => (
        <article key={rule.id}>
          <h4>
            {rule.title} · {rule.xp} XP + {rule.coins} Coins
          </h4>
          <p>Rule: {rule.id} · once per learner per Korean calendar day</p>
          <ol>
            {rule.questions.map((question, i) => (
              <li key={i}>
                {question.prompt} <strong>Answer: {question.answer}</strong>
              </li>
            ))}
          </ol>
        </article>
      ))}
    </div>
  );
}
export function RewardReviewDetails({ review }: { review: RewardReview }) {
  return (
    <div className={rewardPanelClass}>
      <RewardConfigSummary config={review.config} />
      {review.events?.length ? (
        <details>
          <summary>Approval history</summary>
          <ul>
            {review.events.map((event, i) => (
              <li key={i}>
                {new Date(event.createdAt * 1000).toLocaleString()} ·{' '}
                {event.action}
                {event.artifactVersionId
                  ? ` · published version ${event.artifactVersionId}`
                  : ''}
                {event.reason ? ` · ${event.reason}` : ''}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
      <details>
        <summary>
          Saved source · version {review.sourceVersionId} ·{' '}
          {review.files.length} files
        </summary>
        <p>
          Source fingerprint:{' '}
          <code style={{ overflowWrap: 'anywhere' }}>{review.sourceHash}</code>
        </p>
        {review.files.map((file) => (
          <details key={file.path}>
            <summary>{file.path}</summary>
            <pre>{file.content}</pre>
          </details>
        ))}
      </details>
    </div>
  );
}
