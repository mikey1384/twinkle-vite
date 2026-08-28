import React from 'react';
import { css } from '@emotion/css';
import { Link } from 'react-router-dom';
import Icon from '~/components/Icon';
import LegacySponsorGuide from './LegacySponsorGuide';
import cielBuilderFull from '~/assets/ciel-builder-full.png';
import zeroBuilderFull from '~/assets/zero-builder-full.png';
import { mobileMaxWidth } from '~/constants/css';
import { BUILD_WORKSHOP_PREVIEW_USER_IDS } from '~/constants/defaultValues';
import { useKeyContext } from '~/contexts';

export default function SponsorGuide() {
  const userId = useKeyContext((v) => v.myState.userId);
  // Workshop preview rollout: everyone else keeps the previous page until the
  // Build Workshop launches publicly.
  if (!BUILD_WORKSHOP_PREVIEW_USER_IDS.has(Number(userId))) {
    return <LegacySponsorGuide />;
  }
  return <WorkshopSponsorGuide />;
}

function WorkshopSponsorGuide() {
  return (
    <main className={pageClass}>
      <section className={heroClass}>
        <div className={heroTextClass}>
          <p className={eyebrowClass}>Lumine Build Workshop</p>
          <h1 className={titleClass}>
            Build real projects with Zero&nbsp;and&nbsp;Ciel
          </h1>
          <p className={leadClass}>
            The Build Workshop is where ideas become working games and apps.
            Tell Zero or Ciel what you want to make, approve their plan, and
            watch them build it with you — free, powered by community members
            who share their own AI.
          </p>
        </div>
        <div className={heroArtClass}>
          <figure className={heroFigureClass('#eaf2fd')}>
            <img src={zeroBuilderFull} alt="Zero in builder gear" />
            <figcaption>Zero</figcaption>
          </figure>
          <figure className={heroFigureClass('#fdeef7')}>
            <img src={cielBuilderFull} alt="Ciel in builder gear" />
            <figcaption>Ciel</figcaption>
          </figure>
        </div>
      </section>

      <section className={stepsClass}>
        <h2 className={sectionTitleClass}>How it works</h2>
        <div className={stepGridClass}>
          <div className={stepCardClass}>
            <span className={stepBadgeClass('#4c78c9')}>1</span>
            <h3>
              <Icon icon="comments" /> Share your idea
            </h3>
            <p>
              In your Zero or Ciel chat, describe what you want to build — a
              game, an app, anything you can imagine.
            </p>
          </div>
          <div className={stepCardClass}>
            <span className={stepBadgeClass('#d6539e')}>2</span>
            <h3>
              <Icon icon="check" /> Approve the plan
            </h3>
            <p>
              Your assistant drafts a plan just for you. Nothing starts until
              you read it and say go.
            </p>
          </div>
          <div className={stepCardClass}>
            <span className={stepBadgeClass('#3f9e63')}>3</span>
            <h3>
              <Icon icon="hammer" /> Watch it get built
            </h3>
            <p>
              Zero or Ciel builds on your project's own branch. You stay in
              charge — nothing is merged or published without you.
            </p>
          </div>
        </div>
      </section>

      <section className={sharedClass}>
        <h2 className={sectionTitleClass}>What gets shared</h2>
        <p className={sharedIntroClass}>
          Workshop runs are powered by a sponsor — a vetted community member
          sharing their own AI subscription. Here's exactly what they can and
          can't see:
        </p>
        <div className={sharedGridClass}>
          <div className={sharedCardClass('#f2f8f3', '#cfe6d6')}>
            <h3>
              <Icon icon="eye" /> Your sponsor can see
            </h3>
            <ul>
              <li>The plan you approve</li>
              <li>Build follow-up messages you send while the job is active</li>
              <li>The assigned Build branch and its Build Forum</li>
            </ul>
          </div>
          <div className={sharedCardClass('#f3f5fa', '#d3daea')}>
            <h3>
              <Icon icon="lock" /> Always private
            </h3>
            <ul>
              <li>Your raw Zero and Ciel chats</li>
              <li>Your unrelated account data</li>
            </ul>
          </div>
        </div>
        <ul className={finePrintClass}>
          <li>
            Twinkle's safety reviewers may inspect approved plans, recorded
            runtime evidence, and canonical artifacts for a job — but not the
            raw assistant chat.
          </li>
          <li>
            Lumine records the declared and agent-reported model, effort,
            service tier, runtime, session-binding evidence, helpers, saves,
            and the final branch notice.
          </li>
          <li>
            The workshop queue is shared across Zero and Ciel and is public
            within that visible queue: other viewers can see queued usernames,
            the selected assistant, and current queue states.
          </li>
          <li>
            Work stays on the contribution branch belonging to the Zero or Ciel
            identity you selected for that request. It is never merged or
            published automatically.
          </li>
        </ul>
      </section>

      <section className={sponsorSectionClass}>
        <h2 className={sectionTitleClass}>Want to power the workshop?</h2>
        <p className={sharedIntroClass}>
          If you have a coding-agent subscription of your own, you can share
          time from it and give Zero and Ciel extra hands for building with
          users. The assistant stays in the conversation; Lumine gives your
          live on-duty agent session only the approved plan, the assigned Build
          branch, and its forum.
        </p>

        <div className={sponsorCardClass}>
          <h3>Apply through Lumine CLI</h3>
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
        </div>

        <div className={sponsorCardClass}>
          <h3>Before starting a volunteering session</h3>
          <p>
            Choose firm limits for simultaneous jobs, helpers, and daily or
            weekly work. Lumine enforces the approved ceiling on the server.
          </p>
          <code className={commandClass}>
            npx @stage5/lumine@latest sponsor capacity --concurrency 1 --helpers
            0 --daily-limit 2 --weekly-limit 6
          </code>
          <p>
            If Lumine reports that the sponsor agreement changed, read it with{' '}
            <code>lumine sponsor agreement</code> and explicitly renew it with{' '}
            <code>
              lumine sponsor agreement accept --accept-agreement
            </code>
            .
          </p>
          <p>
            From the Codex or Claude Code session that will personally monitor
            and do the work, start your volunteering session:
          </p>
          <code className={commandClass}>
            npx @stage5/lumine@latest sponsor duty start --provider codex
            --model gpt-5.6-sol --effort max
          </code>
          <p>Then keep that same agent session actively checking for work:</p>
          <code className={commandClass}>
            npx @stage5/lumine@latest sponsor duty watch --json
          </code>
          <p>
            Users choose Zero or Ciel for each request; the volunteering
            session itself is not tied to either assistant. Each watch is
            intentionally short and must be run again by the same live agent
            session. If that agent stops checking in, the Workshop closes its
            availability automatically. Lumine gives an approved assignment
            and scoped workspace back to that session; it never launches a
            replacement coding provider in the background. Pause, resume, or
            stop the shared capacity with the corresponding{' '}
            <code>lumine sponsor duty</code> command.
          </p>
        </div>

        <div className={sponsorCardClass}>
          <h3>Karma and trust</h3>
          <p>
            A unique contribution to another user earns 50 KP only after
            Twinkle's daily review confirms it. Self-sponsored testing, retries,
            and helper agents do not earn or multiply the award. Probationary
            work, flagged evidence, and a random sample receive human-reviewed
            checks; dishonest reporting or data misuse can suspend or revoke
            sponsorship.
          </p>
        </div>
      </section>

      <Link to="/" className={backLinkClass}>
        Back to Twinkle
      </Link>
    </main>
  );
}

const pageClass = css`
  min-height: 100%;
  padding: 4rem 2rem 5rem;
  background: #f5f7fb;
  color: #283044;
  font-size: 1.5rem;
  line-height: 1.65;
  @media (max-width: ${mobileMaxWidth}) {
    padding: 2rem 1rem 3rem;
    font-size: 1.35rem;
  }
`;

const heroClass = css`
  display: flex;
  align-items: center;
  gap: 3rem;
  max-width: 96rem;
  margin: 0 auto;
  padding: 3.5rem;
  border: 1px solid #dce1eb;
  border-radius: 1.2rem;
  background: #fff;
  box-shadow: 0 1.2rem 3rem rgba(33, 43, 69, 0.08);
  @media (max-width: ${mobileMaxWidth}) {
    flex-direction: column;
    gap: 2rem;
    padding: 2rem 1.5rem;
  }
`;

const heroTextClass = css`
  flex: 1;
  min-width: 0;
`;

const heroArtClass = css`
  display: flex;
  align-items: flex-end;
  gap: 1.2rem;
  flex: none;
`;

const heroFigureClass = (bg: string) => css`
  margin: 0;
  padding: 1rem 1rem 0.6rem;
  border-radius: 1rem;
  background: ${bg};
  text-align: center;
  img {
    display: block;
    height: 24rem;
    width: auto;
    max-width: 100%;
    user-select: none;
    @media (max-width: ${mobileMaxWidth}) {
      height: 17rem;
    }
  }
  figcaption {
    margin-top: 0.4rem;
    font-size: 1.2rem;
    font-weight: 750;
    color: #4a5468;
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

const sectionTitleClass = css`
  margin: 0 0 1.6rem;
  color: #252c42;
  font-size: 2.4rem;
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 2rem;
  }
`;

const stepsClass = css`
  max-width: 96rem;
  margin: 3rem auto 0;
`;

const stepGridClass = css`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.6rem;
  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 1fr;
  }
`;

const stepCardClass = css`
  position: relative;
  padding: 2rem 1.8rem;
  border: 1px solid #dce1eb;
  border-radius: 1rem;
  background: #fff;
  box-shadow: 0 0.6rem 1.6rem rgba(33, 43, 69, 0.06);
  h3 {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    margin: 0 0 0.8rem;
    color: #252c42;
    font-size: 1.7rem;
  }
  p {
    margin: 0;
    color: #515b70;
  }
`;

const stepBadgeClass = (color: string) => css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.8rem;
  height: 2.8rem;
  margin-bottom: 1rem;
  border-radius: 50%;
  background: ${color};
  color: #fff;
  font-size: 1.5rem;
  font-weight: 800;
`;

const sharedClass = css`
  max-width: 96rem;
  margin: 3.5rem auto 0;
`;

const sharedIntroClass = css`
  margin: 0 0 1.6rem;
  color: #515b70;
`;

const sharedGridClass = css`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.6rem;
  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 1fr;
  }
`;

const sharedCardClass = (bg: string, border: string) => css`
  padding: 1.8rem;
  border: 1px solid ${border};
  border-radius: 1rem;
  background: ${bg};
  h3 {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    margin: 0 0 0.9rem;
    color: #252c42;
    font-size: 1.6rem;
  }
  ul {
    margin: 0;
    padding-left: 2rem;
  }
  li + li {
    margin-top: 0.5rem;
  }
`;

const finePrintClass = css`
  margin: 1.8rem 0 0;
  padding-left: 2rem;
  color: #515b70;
  font-size: 1.35rem;
  li + li {
    margin-top: 0.7rem;
  }
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.25rem;
  }
`;

const sponsorSectionClass = css`
  max-width: 96rem;
  margin: 3.5rem auto 0;
`;

const sponsorCardClass = css`
  margin-top: 1.6rem;
  padding: 2rem 1.8rem;
  border: 1px solid #dce1eb;
  border-radius: 1rem;
  background: #fff;
  box-shadow: 0 0.6rem 1.6rem rgba(33, 43, 69, 0.06);
  h3 {
    margin: 0 0 1rem;
    color: #252c42;
    font-size: 1.7rem;
  }
  p {
    margin: 1rem 0 0;
    color: #515b70;
  }
  ol {
    margin: 0;
    padding-left: 2.2rem;
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
  margin-top: 1rem;
  padding: 1rem !important;
  overflow-x: auto;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
`;

const backLinkClass = css`
  display: block;
  max-width: 96rem;
  margin: 3rem auto 0;
  color: #3d5f9c;
  font-weight: 700;
`;
