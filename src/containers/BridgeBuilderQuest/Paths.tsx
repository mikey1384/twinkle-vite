import React from 'react';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { Color, mobileMaxWidth } from '~/constants/css';
import { QuestNote } from './StepCard';
import type { CrewView } from './types';

// Bridge Builder's two paths (Mikey 2026-11-25: crew + tour are the key ways;
// the 7-person check-in repeated the crew, and the original Face to Face rule
// stays valid as an unpromoted footnote). Either one earns it.
export function PathsIntro({ title }: { title: string }) {
  return (
    <section className={introClass}>
      <h1 className={introTitleClass}>{title}</h1>
      <p className={introTextClass}>
        Two ways to earn it. Finish <b>either one</b> and it&apos;s yours:
      </p>
      <ol className={introListClass}>
        <li>
          <b>Crew:</b> make a crew with Twinkle friends and meet up together.
        </li>
        <li>
          <b>Show friends around:</b> take 7 Twinkle friends on the tour of
          Twinkle Minecraft World.
        </li>
      </ol>
      <p className={footnoteClass}>
        Or the original way: meet up in person with a parent or Twinkle teacher
        there, 3 or more students from different Twinkle branches, doing
        something educational on video. Mikey awards it.
      </p>
    </section>
  );
}

// Path 2: the crew's own steps earn it once Mikey approves the crew's meetup.
export function CrewPathCard({
  crew,
  onOpen,
  onStart
}: {
  crew?: CrewView | null;
  onOpen: () => void;
  onStart: () => void;
}) {
  const met = !!crew && crew.completedAt > 0;
  const step = !crew
    ? 'Start a crew or join one from the directory below.'
    : met
      ? 'Your crew met up and Mikey approved it.'
      : crew.meetupReview === 'pending'
        ? 'Your crew checked in together. Waiting for Mikey’s review.'
        : crew.meetupReview === 'rejected'
          ? 'That meetup wasn’t approved. Check in together again next time you meet.'
          : crew.stage === 'forming'
            ? 'Invite Twinkle friends until your crew has at least 2 Twinkle students.'
            : 'Meet up with your crew and tap Check in with my crew.';
  return (
    <section className={cardClass}>
      <div className={labelClass}>
        <Icon icon="users" /> Path 1 · Crew
      </div>
      <h2 className={titleClass}>
        {met ? 'Crew path done!' : 'Meet up with your crew'}
      </h2>
      <div style={{ marginTop: '0.6rem' }}>
        <QuestNote tone="info">
          <b>Next step:</b> {step}
        </QuestNote>
      </div>
      <div style={{ marginTop: '1.2rem' }}>
        <Button
          color="logoBlue"
          variant="soft"
          onClick={crew ? onOpen : onStart}
        >
          <Icon icon="users" style={{ marginRight: '0.6rem' }} />
          {crew ? `Open ${crew.name || 'your crew'}` : 'Find or start a crew'}
        </Button>
      </div>
    </section>
  );
}

const introClass = css`
  margin-top: 1rem;
  @media (max-width: ${mobileMaxWidth}) {
    padding: 0 1rem;
  }
`;

const introTitleClass = css`
  margin: 0;
  font-size: 2.6rem;
  color: ${Color.black()};
`;

const introTextClass = css`
  margin: 0.6rem 0 0;
  font-size: 1.5rem;
  line-height: 1.5;
  color: ${Color.darkerGray()};
`;

const introListClass = css`
  margin: 0.6rem 0 0;
  padding-left: 2.2rem;
  font-size: 1.45rem;
  line-height: 1.6;
  color: ${Color.darkerGray()};
`;

const cardClass = css`
  border-radius: 1.6rem;
  border: 1px solid ${Color.orange(0.35)};
  background: ${Color.orange(0.05)};
  padding: 2rem;
  margin-top: 1.6rem;
  @media (max-width: ${mobileMaxWidth}) {
    border-radius: 0;
    border-left: 0;
    border-right: 0;
    padding: 1.6rem 1rem;
  }
`;

const labelClass = css`
  font-size: 1.3rem;
  font-weight: bold;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${Color.orange()};
`;

const titleClass = css`
  margin: 0.4rem 0 0;
  font-size: 2.1rem;
  color: ${Color.black()};
`;

const footnoteClass = css`
  margin: 1rem 0 0;
  font-size: 1.2rem;
  color: ${Color.gray()};
`;
