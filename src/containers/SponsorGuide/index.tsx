import React from 'react';
import { css } from '@emotion/css';
import { Link } from 'react-router-dom';
import { mobileMaxWidth } from '~/constants/css';

export default function SponsorGuide() {
  return (
    <main className={pageClass}>
      <article className={cardClass}>
        <p className={eyebrowClass}>Lumine Build Workshop</p>
        <h1 className={titleClass}>Sponsor Zero or Ciel’s Build help</h1>
        <p className={leadClass}>
          Approved sponsors can contribute coding-agent time from their own
          subscription. Zero or Ciel stays user-facing while Lumine gives the
          sponsor’s worker only the user-approved relay and assigned project
          scope.
        </p>

        <section className={sectionClass}>
          <h2>Apply through Lumine CLI</h2>
          <ol>
            <li>
              Run the current CLI without installing it:{' '}
              <code>npx @stage5/lumine@latest</code>.
            </li>
            <li>
              Sign in with <code>npx @stage5/lumine@latest login</code>.
            </li>
            <li>
              Read the full disclosure with{' '}
              <code>npx @stage5/lumine@latest sponsor agreement</code>.
            </li>
            <li>
              Submit the CLI application with{' '}
              <code>
                npx @stage5/lumine@latest sponsor apply --providers codex
              </code>
              . You can list multiple supported subscriptions with a comma.
            </li>
            <li>
              Check review state with{' '}
              <code>npx @stage5/lumine@latest sponsor status</code>.
            </li>
          </ol>
          <p>
            There is deliberately no website application form. Approval is
            manual, starts in probationary status, and grants no administrator
            or website-management access.
          </p>
        </section>

        <section className={sectionClass}>
          <h2>Before going on duty</h2>
          <p>
            Set hard limits for simultaneous jobs, helpers, and daily/weekly
            work. Lumine enforces the approved ceiling on the server.
          </p>
          <code className={commandClass}>
            npx @stage5/lumine@latest sponsor capacity --concurrency 1 --helpers
            0 --daily-limit 2 --weekly-limit 6
          </code>
          <p>Then start one named persona in the foreground:</p>
          <code className={commandClass}>
            npx @stage5/lumine@latest sponsor duty start zero --provider codex
            --model gpt-5.6-sol --effort max
          </code>
          <p>
            Use <code>ciel</code> instead of <code>zero</code> when assigned to
            Ciel. Pause, resume, or stop duty with the matching{' '}
            <code>lumine sponsor duty</code> command.
          </p>
        </section>

        <section className={sectionClass}>
          <h2>What a sponsored run exposes</h2>
          <ul>
            <li>
              The sponsor sees the initial relay and active-job Build follow-ups
              covered by the user’s explicit Workshop consent, plus the assigned
              Build branch and scoped Build Forum.
            </li>
            <li>
              The sponsor does not receive the user’s raw Zero or Ciel chat or
              unrelated account data.
            </li>
            <li>
              Twinkle’s integrity reviewer may inspect the approved relays,
              recorded runtime evidence, and canonical artifacts for that
              handoff, but not the raw assistant chat.
            </li>
            <li>
              Lumine records requested and provider-resolved model, effort,
              service tier, runtime, usage evidence, helpers, saves, and the
              final branch notice.
            </li>
            <li>
              Work stays on Zero or Ciel’s contribution branch. It is never
              merged or published automatically.
            </li>
            <li>
              Queue membership is public within that visible duty queue, so
              other viewers can see queued usernames and current queue states.
            </li>
          </ul>
        </section>

        <section className={sectionClass}>
          <h2>Karma and integrity</h2>
          <p>
            A unique completed handoff earns 50 KP only after the daily
            integrity flow clears it. Retries and helper agents do not multiply
            the award. Probationary work, flagged evidence, and a random sample
            receive human-reviewed checks; dishonest reporting or data misuse
            can suspend or revoke sponsorship.
          </p>
        </section>

        <Link to="/" className={backLinkClass}>
          Back to Twinkle
        </Link>
      </article>
    </main>
  );
}

const pageClass = css`
  min-height: 100%;
  padding: 4rem 2rem;
  background: #f5f7fb;
  color: #283044;
  @media (max-width: ${mobileMaxWidth}) {
    padding: 2rem 1rem;
  }
`;

const cardClass = css`
  max-width: 82rem;
  margin: 0 auto;
  padding: 3.5rem;
  border: 1px solid #dce1eb;
  border-radius: 1.2rem;
  background: #fff;
  box-shadow: 0 1.2rem 3rem rgba(33, 43, 69, 0.08);
  font-size: 1.5rem;
  line-height: 1.65;
  @media (max-width: ${mobileMaxWidth}) {
    padding: 2rem 1.5rem;
    font-size: 1.35rem;
  }
`;

const eyebrowClass = css`
  margin: 0 0 0.6rem;
  color: #65718a;
  font-size: 1.25rem;
  font-weight: 750;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const titleClass = css`
  margin: 0;
  color: #20263a;
  font-size: 3.4rem;
  line-height: 1.15;
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 2.5rem;
  }
`;

const leadClass = css`
  margin: 1.5rem 0 0;
  color: #515b70;
  font-size: 1.8rem;
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.55rem;
  }
`;

const sectionClass = css`
  margin-top: 3rem;
  padding-top: 2.2rem;
  border-top: 1px solid #e2e6ee;
  h2 {
    margin: 0 0 1rem;
    color: #252c42;
    font-size: 2.1rem;
  }
  p {
    margin: 1rem 0;
  }
  li + li {
    margin-top: 0.7rem;
  }
  code {
    padding: 0.1rem 0.35rem;
    border-radius: 0.3rem;
    background: #eef1f7;
    color: #313b55;
    font-size: 0.92em;
  }
`;

const commandClass = css`
  display: block;
  padding: 1rem !important;
  overflow-x: auto;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
`;

const backLinkClass = css`
  display: inline-block;
  margin-top: 3rem;
  color: #3d5f9c;
  font-weight: 700;
`;
