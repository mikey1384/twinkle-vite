import React from 'react';
import { css } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import Button from '~/components/Button';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';

// The last card on the shelf is for the member who has not built anything
// yet: what Twinkle approves, in three lines, and the door into Lumine.
export default function YourAppCard() {
  const navigate = useNavigate();
  return (
    <article className={cardClass}>
      <h3 className={titleClass}>Your app here</h3>
      <p className={leadClass}>
        Build an app that pays XP. Twinkle approves apps that
      </p>
      <ul className={listClass}>
        <li>take real effort to earn from</li>
        <li>can’t be farmed by a script</li>
        <li>pay amounts that fit the effort</li>
      </ul>
      <Button
        color="logoBlue"
        variant="outline"
        shape="pill"
        size="md"
        stretch
        style={{ marginTop: 'auto' }}
        onClick={() => navigate('/build/new')}
      >
        Start in Lumine →
      </Button>
    </article>
  );
}

const cardClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  padding: 1.5rem;
  border-radius: ${borderRadius};
  border: 2px dashed ${Color.logoBlue(0.45)};
  background: ${Color.logoBlue(0.05)};
  min-width: 0;
  @media (max-width: ${mobileMaxWidth}) {
    padding: 1.2rem;
  }
`;
const titleClass = css`
  margin: 0;
  font-size: 2rem;
  font-weight: 800;
  color: ${Color.logoBlue()};
`;
const leadClass = css`
  margin: 0;
  font-size: 1.35rem;
  color: rgba(15, 23, 42, 0.85);
`;
const listClass = css`
  margin: 0;
  padding-left: 1.8rem;
  display: grid;
  gap: 0.3rem;
  font-size: 1.3rem;
  color: rgba(15, 23, 42, 0.85);
`;
