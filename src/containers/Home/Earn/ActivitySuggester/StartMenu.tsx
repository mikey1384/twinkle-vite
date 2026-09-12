import React from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { useHomeContext } from '~/contexts';
import { css } from '@emotion/css';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';


// The three community ways to earn, as cards in the same language as the
// Bounties shelf: a coloured header with the icon, a title, one line, and
// one pill button. The actions and their flows are the ones the page has
// always had.
const ACTIONS: Array<{
  key: 'subject' | 'recommend' | 'reward';
  icon: string;
  title: string;
  pays: string;
  blurb: string;
  button: string;
  color: string;
  band: string;
}> = [
  {
    key: 'subject',
    icon: 'bolt',
    title: 'Answer Subjects',
    pays: 'Earns XP',
    blurb: 'Post thoughtful comments on subjects to earn XP.',
    button: 'Answer Subjects',
    color: 'logoBlue',
    band: Color.logoBlue()
  },
  {
    key: 'recommend',
    icon: 'heart',
    title: 'Recommend Posts',
    pays: 'Earns Karma Points',
    blurb: 'Recommend great posts by other members.',
    button: 'Recommend Posts',
    color: 'brownOrange',
    band: Color.brownOrange()
  },
  {
    key: 'reward',
    icon: 'certificate',
    title: 'Reward Posts',
    pays: 'Earns Karma Points',
    blurb: 'Reward posts that deserve a little extra.',
    button: 'Reward Posts',
    color: 'pink',
    band: Color.pink()
  }
];

export default function StartMenu() {
  const onSetTopMenuSectionSection = useHomeContext(
    (v) => v.actions.onSetTopMenuSectionSection
  );
  return (
    <ErrorBoundary componentPath="Home/Earn/ActivitySuggester/StartMenu">
      <div className={gridClass}>
        {ACTIONS.map((action) => (
          <article key={action.key} className={cardClass}>
            <div className={bandClass} style={{ background: action.band }}>
              <Icon icon={action.icon} />
              <span className={paysClass}>{action.pays}</span>
            </div>
            <div className={bodyClass}>
              <div className={labelClass}>{action.pays}</div>
              <h3 className={titleClass}>{action.title}</h3>
              <p className={blurbClass}>{action.blurb}</p>
              <Button
                color={action.color}
                variant="solid"
                tone="flat"
                shape="pill"
                size="md"
                stretch
                style={{ marginTop: 'auto' }}
                onClick={() => onSetTopMenuSectionSection(action.key)}
              >
                {action.button}
              </Button>
            </div>
          </article>
        ))}
      </div>
    </ErrorBoundary>
  );
}

const gridClass = css`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 1.2rem;
  width: 100%;
  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 1fr;
  }
`;
const cardClass = css`
  display: flex;
  flex-direction: column;
  border-radius: ${borderRadius};
  border: 1px solid var(--home-panel-card-border, rgba(148, 163, 184, 0.35));
  background: rgba(255, 255, 255, 0.94);
  overflow: hidden;
  min-width: 0;
`;
const labelClass = css`
  display: none;
  font-size: 1.15rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-weight: 700;
  color: rgba(15, 23, 42, 0.66);
  @media (max-width: ${mobileMaxWidth}) {
    display: block;
  }
`;
const bandClass = css`
  @media (max-width: ${mobileMaxWidth}) {
    display: none;
  }
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.4rem 1.5rem;
  color: #fff;
  font-size: 2.2rem;
`;
const paysClass = css`
  font-size: 1.2rem;
  font-weight: 800;
  background: rgba(255, 255, 255, 0.92);
  color: ${Color.darkerGray()};
  border-radius: 999px;
  padding: 0.35rem 0.9rem;
  white-space: nowrap;
`;
const bodyClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  padding: 1.3rem 1.5rem 1.5rem;
  flex: 1;
  @media (max-width: ${mobileMaxWidth}) {
    padding: 1.6rem 1.8rem 1.8rem;
    gap: 0.6rem;
  }
`;
const titleClass = css`
  margin: 0;
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--home-panel-heading, ${Color.darkerGray()});
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 2rem;
    margin-top: 0.2rem;
  }
`;
const blurbClass = css`
  margin: 0 0 0.6rem;
  font-size: 1.35rem;
  line-height: 1.5;
  color: rgba(15, 23, 42, 0.85);
`;
