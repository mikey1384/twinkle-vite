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
            <div className={bodyClass}>
              <span className={badgeClass} style={{ background: action.band }}>
                <Icon icon={action.icon} />
                <span>{action.pays}</span>
              </span>
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
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
    /* an odd last card takes the whole row instead of sitting alone */
    > :last-child:nth-child(odd) {
      grid-column: 1 / -1;
    }
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
const badgeClass = css`
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  border-radius: 999px;
  padding: 0.45rem 1.1rem;
  color: #fff;
  font-size: 1.2rem;
  font-weight: 800;
  white-space: nowrap;
`;
const bodyClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  padding: 1.3rem 1.5rem 1.5rem;
  flex: 1;
  @media (max-width: ${mobileMaxWidth}) {
    padding: 1.2rem 1.2rem 1.3rem;
    gap: 0.7rem;
  }
`;
const titleClass = css`
  margin: 0;
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--home-panel-heading, ${Color.darkerGray()});
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.6rem;
  }
`;
const blurbClass = css`
  margin: 0 0 0.6rem;
  font-size: 1.35rem;
  line-height: 1.5;
  color: rgba(15, 23, 42, 0.85);
`;
