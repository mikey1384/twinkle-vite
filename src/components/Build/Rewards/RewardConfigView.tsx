import React from 'react';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import type { RewardConfig, RewardReview, RewardRule } from './types';

// Reviewer-facing presentation of a reward review. Lives inside the
// Management page's section panels, so it inherits their accent through
// `--section-panel-accent` and uses the same type scale as the other tables.
export const rewardPanelClass = css`
  color: ${Color.darkerGray()};
  font-size: 1.4rem;
  line-height: 1.6;
  display: grid;
  gap: 1.4rem;
  min-width: 0;
  p,
  h3,
  h4 {
    margin: 0;
  }
  h4 {
    font-size: 1.5rem;
    font-weight: 700;
  }
  fieldset,
  article {
    border: 1px solid ${Color.borderGray()};
    border-radius: 10px;
    padding: 1.2rem 1.4rem;
    min-width: 0;
    background: #fff;
  }
  article {
    border-left: 4px solid var(--section-panel-accent, ${Color.logoBlue()});
  }
  label {
    display: grid;
    gap: 0.5rem;
    font-size: 1.4rem;
    font-weight: 700;
  }
  input,
  textarea {
    width: 100%;
    box-sizing: border-box;
    background: #fff;
    color: ${Color.darkerGray()};
    border: 1px solid ${Color.borderGray()};
    border-radius: 8px;
    padding: 0.9rem 1rem;
    font: inherit;
    font-weight: 400;
    min-width: 0;
    &:focus {
      outline: none;
      border-color: var(--section-panel-accent, ${Color.logoBlue()});
      box-shadow: 0 0 0 3px
        color-mix(
          in srgb,
          var(--section-panel-accent, ${Color.logoBlue()}) 18%,
          transparent
        );
    }
  }
  textarea {
    min-height: 6rem;
    resize: vertical;
  }
  pre {
    max-height: 26rem;
    overflow: auto;
    padding: 1.2rem;
    border-radius: 8px;
    background: ${Color.wellGray()};
    color: ${Color.darkerGray()};
    font-size: 1.2rem;
    line-height: 1.5;
  }
  code {
    font-size: 1.25rem;
  }
  ol,
  ul {
    margin: 0.6rem 0 0;
    padding-left: 2rem;
  }
  li + li {
    margin-top: 0.3rem;
  }
  [role='alert'] {
    color: ${Color.red()};
    font-weight: 700;
  }
  details {
    border: 1px solid ${Color.borderGray()};
    border-radius: 10px;
    padding: 0 1.4rem;
    background: #fff;
    &[open] {
      padding-bottom: 1.2rem;
    }
    > summary {
      cursor: pointer;
      font-weight: 700;
      padding: 1rem 0;
      overflow-wrap: anywhere;
      list-style: none;
      display: flex;
      align-items: center;
      gap: 0.8rem;
      &::-webkit-details-marker {
        display: none;
      }
      &::before {
        content: '';
        width: 0.7rem;
        height: 0.7rem;
        border-right: 2px solid currentColor;
        border-bottom: 2px solid currentColor;
        transform: rotate(-45deg);
        transition: transform 0.15s ease;
        flex: none;
      }
    }
    &[open] > summary::before {
      transform: rotate(45deg);
    }
    details {
      margin-top: 0.8rem;
    }
  }
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.3rem;
  }
`;

export const rewardGridClass = css`
  display: grid;
  gap: 0.8rem;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr));
  > div {
    border: 1px solid ${Color.borderGray()};
    border-radius: 10px;
    padding: 1rem 1.2rem;
    background: ${Color.wellGray()};
    display: grid;
    gap: 0.2rem;
    > strong {
      font-size: 1.2rem;
      font-weight: 600;
      color: ${Color.gray()};
    }
    > div {
      font-size: 1.9rem;
      font-weight: 700;
      color: ${Color.darkerGray()};
      font-variant-numeric: tabular-nums;
    }
  }
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
      {/* A first request carries no economy at all; six zero tiles would
          only look like something is broken. */}
      {config.rules.length > 0 && (
        <div className={rewardGridClass}>
          {budgetFields.map(([key, label]) => (
            <div key={key}>
              <strong>{label}</strong>
              <div>{config[key].toLocaleString()}</div>
            </div>
          ))}
          {config.userDailyClaims ? (
            <div>
              <strong>Bounties per learner per day</strong>
              <div>{config.userDailyClaims.toLocaleString()}</div>
            </div>
          ) : null}
        </div>
      )}
      {config.rules.length === 0 && (
        <p>
          No earning rules yet. You write them while approving; a request cannot
          be approved without at least one rule.
        </p>
      )}
      {config.rules.length > COLLAPSE_RULES_ABOVE ? (
        <details>
          <summary>{config.rules.length} earning rules</summary>
          <div className={rulesListClass}>
            {config.rules.map((rule) => (
              <RewardRuleCard key={rule.id} rule={rule} />
            ))}
          </div>
        </details>
      ) : (
        config.rules.map((rule) => <RewardRuleCard key={rule.id} rule={rule} />)
      )}
    </div>
  );
}

// A long economy (Math Lab has 36 rules) folds away so the reviewer reaches
// the history, the source and the decision without scrolling past it all.
const COLLAPSE_RULES_ABOVE = 6;

const rulesListClass = css`
  display: grid;
  gap: 1rem;
`;

function retryAmount(amount: number, percent: number) {
  return Math.floor((amount * percent) / 100);
}

function QuestionList({ questions }: { questions: RewardRule['questions'] }) {
  return (
    <ol>
      {(questions || []).map((question, i) => (
        <li key={i}>
          {question.prompt} <strong>Answer: {question.answer}</strong>
          {question.hint ? <> · Hint: {question.hint}</> : null}
          {question.guide !== undefined ? (
            <details>
              <summary>After-answer guide</summary>
              <pre>{JSON.stringify(question.guide, null, 2)}</pre>
            </details>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

function RewardRuleCard({ rule }: { rule: RewardRule }) {
  if (rule.verifier === 'completion') {
    return (
      <article>
        <h4>
          {rule.title} · {rule.xp.toLocaleString()} XP +{' '}
          {rule.coins.toLocaleString()} Coins
        </h4>
        <p>
          Rule ID: {rule.id} · completion · once per learner per Korean
          calendar day · pays when the app reports the activity finished at
          least {(rule.minSeconds || 0).toLocaleString()} seconds after it
          started. Nothing else is verified: read the code to see when the
          app starts and claims it, and keep the amount small enough that a
          player scripting the call would not matter.
        </p>
      </article>
    );
  }
  const tries =
    rule.maxAttempts === null
      ? 'unlimited tries until Korean midnight'
      : `${rule.maxAttempts ?? 3} tries`;
  const retry = rule.retry
    ? `after a wrong answer pays ${retryAmount(
        rule.xp,
        rule.retry.xpPercent
      ).toLocaleString()} XP + ${retryAmount(
        rule.coins,
        rule.retry.coinsPercent
      ).toLocaleString()} Coins`
    : 'every correct answer pays the full amounts';
  return (
    <article>
      <h4>
        {rule.title} · {rule.xp.toLocaleString()} XP +{' '}
        {rule.coins.toLocaleString()} Coins
      </h4>
      <p>
        Rule ID: {rule.id} · once per learner per Korean calendar day · {tries}{' '}
        · {retry}
        {rule.progression === 'until-earned'
          ? ' · sets play in order and a set stays up until somebody earns it'
          : ''}
      </p>
      {rule.sets?.length ? (
        <>
          {rule.sets.map((set, index) => (
            <details key={set.key || set.from || index}>
              <summary>
                {rule.progression === 'until-earned'
                  ? `Set ${index + 1}${set.key ? ` · ${set.key}` : ''}`
                  : set.to && set.to !== set.from
                    ? `${set.from} to ${set.to}`
                    : set.from}{' '}
                · {set.questions.length}{' '}
                {set.questions.length === 1 ? 'question' : 'questions'}
              </summary>
              <QuestionList questions={set.questions} />
            </details>
          ))}
          {rule.questions?.length ? (
            <details>
              <summary>Standing questions for days without a set</summary>
              <QuestionList questions={rule.questions} />
            </details>
          ) : (
            <p>
              No standing questions: days outside these sets are unavailable.
            </p>
          )}
        </>
      ) : (
        <QuestionList questions={rule.questions} />
      )}
    </article>
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
          {review.files.length} {review.files.length === 1 ? 'file' : 'files'}
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
