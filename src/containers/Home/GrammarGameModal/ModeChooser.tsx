import React from 'react';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import { playQuestSound } from './Quest/sfx';
import { gqMedia } from './media';

// Grammarbles has two equal games (Mikey 10-07): pick one first, then each
// has its own tabs. Each is shown as its own game cover (Codex-painted art
// with the title painted in), like a Lumine app game. Both are marble games:
// Classic grades every answer as a marble by speed; Quest promotes one marble
// through levels (accuracy) and grades boss fights like Classic.
const GAMES = [
  {
    mode: 'classic' as const,
    cover: gqMedia('img/grammar-quest/cover-classic.jpg'),
    title: 'Classic',
    line: 'Five timed levels a day, 10 questions each. Every answer is a marble graded by speed. Fail a level and you’re done for the day.',
    play: 'Play Classic'
  },
  {
    mode: 'quest' as const,
    cover: gqMedia('img/grammar-quest/cover-quest.jpg'),
    title: 'Quest',
    line: 'Levels and bosses across ten worlds. Right answers carry your marble from D up to S; forts and castles are the test.',
    play: 'Play Quest'
  }
];

export default function ModeChooser({
  onPick
}: {
  onPick: (mode: 'classic' | 'quest') => void;
}) {
  return (
    <div className={wrapCls}>
      <div className={titleCls}>Pick your Grammarbles game</div>
      <div className={fitCls}>
        <div className={cardsCls}>
          {GAMES.map((game, index) => (
            <button
              key={game.mode}
              className={cardCls}
              aria-label={game.play}
              // a chime on the pick (Mikey 10-07: no hover sound); the Quest
              // map's sound switch mutes it
              onClick={() => {
                playQuestSound('start', { shift: index * 4 });
                onPick(game.mode);
              }}
            >
              <div className={coverCls}>
                <img src={game.cover} alt={game.title} loading="eager" />
              </div>
              <div className={lineCls}>{game.line}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// one screen: the covers take the size the page's height allows
const wrapCls = css`
  flex: 1;
  min-height: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  padding: 0.6rem 1.5rem 1.6rem;
  @media (max-width: ${mobileMaxWidth}) {
    padding: 0.4rem 1rem 1rem;
  }
`;
const fitCls = css`
  flex: 1;
  min-height: 0;
  container-type: size;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const titleCls = css`
  text-align: center;
  font-size: 2.6rem;
  font-weight: 800;
  /* on the menu's night-arcade backdrop */
  color: #fff;
  text-shadow: 0 2px 12px rgba(120, 90, 255, 0.6);
  margin-bottom: 1.4rem;
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 2rem;
    margin-bottom: 0.8rem;
  }
  @media (max-height: 520px) {
    font-size: 1.8rem;
    margin-bottom: 0.6rem;
  }
`;

const cardsCls = css`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 2rem;
  /* a page now (Mikey 10-07): the covers get the room, as wide as the
     height allows (a cover is ~16:10, plus its line of text) */
  width: 100%;
  max-width: min(1180px, calc((100cqh - 10rem) * 3.2 + 2rem));
  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 1fr;
    gap: 1rem;
    max-width: min(560px, calc((50cqh - 9rem) * 1.6));
  }
`;

const cardCls = css`
  display: flex;
  flex-direction: column;
  padding: 0;
  border: none;
  border-radius: 18px;
  overflow: hidden;
  background: #1b2236;
  text-align: center;
  cursor: pointer;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.18);
  transition:
    transform 0.15s,
    box-shadow 0.15s;
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 26px rgba(0, 0, 0, 0.28);
  }
`;

const coverCls = css`
  aspect-ratio: 16 / 10;
  width: 100%;
  background: #2c3550;
  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const lineCls = css`
  padding: 0.9rem 1.2rem 1.1rem;
  font-size: 1.3rem;
  line-height: 1.5;
  color: #cfd6e6;
`;
