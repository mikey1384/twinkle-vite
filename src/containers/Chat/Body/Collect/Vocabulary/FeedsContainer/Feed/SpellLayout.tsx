import React, { useState } from 'react';
import { css } from '@emotion/css';
import ProfilePic from '~/components/ProfilePic';
import UsernameText from '~/components/Texts/UsernameText';
import AICard from '~/components/AICard';
import { wordLevelHash } from '~/constants/defaultValues';
import { mobileMaxWidth, wideBorderRadius } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import Icon from '~/components/Icon';
import WordModal from '../../VocabularyWidget/WordModal';

export default function SpellLayout({
  feedRef,
  userId,
  username,
  profilePicUrl,
  action,
  getWordFontSize,
  content,
  wordLevel,
  xpReward,
  coinReward,
  totalPoints,
  displayedTime,
  aiCard,
  getRGBA,
  getActionColor,
  badgeStyle
}: {
  feedRef: React.RefObject<HTMLDivElement>;
  userId: number;
  username: string;
  profilePicUrl: string;
  action: string;
  getWordFontSize: (wordLevel: number) => string;
  content: string;
  wordLevel: number;
  xpReward: number;
  coinReward: number;
  totalPoints: number;
  displayedTime: string;
  aiCard?: any;
  getRGBA: (colorName: string, opacity: number) => string;
  getActionColor: (action: string) => string;
  badgeStyle: (colorName: string, bgOpacity: number) => string;
}) {
  const [wordModalShown, setWordModalShown] = useState(false);

  const colorName = wordLevelHash[wordLevel]?.color || 'logoBlue';
  const backgroundColor = getRGBA(colorName, 0.08);
  const borderColor = getRGBA(colorName, 0.7);
  const spelledWordFontSize = getWordFontSize(wordLevel);
  const actionColor = getActionColor(action);
  const actionLabel = 'Spelled'; // or you could use your switch from above

  return (
    <div
      ref={feedRef}
      className={css`
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        background-color: ${backgroundColor};
        border-left: 8px solid ${borderColor};
        border-radius: ${wideBorderRadius};
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
        padding: 1.2rem 1rem;
        margin-bottom: 1.5rem;
        @media (max-width: ${mobileMaxWidth}) {
          padding: 1rem;
        }
      `}
    >
      <div
        className={css`
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 1rem;
        `}
      >
        <div
          className={css`
            width: 60px;
            height: 60px;
            margin-bottom: 0.4rem;

            @media (max-width: ${mobileMaxWidth}) {
              width: 50px;
              height: 50px;
            }
          `}
        >
          <ProfilePic userId={userId} profilePicUrl={profilePicUrl} />
        </div>
        <UsernameText
          className={css`
            font-weight: 600;
            color: #444;
            font-size: 1.2rem;
          `}
          user={{ id: userId, username }}
        />
      </div>

      <div
        className={css`
          opacity: 0;
          transform: translateY(20px);
          animation: fadeInUp 0.5s forwards;

          @keyframes fadeInUp {
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          ${badgeStyle(actionColor, 0.85)}
          color: #fff;
          font-size: 1.3rem;
          font-weight: 700;
          margin-bottom: 1rem;
          width: fit-content;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 1.2rem;
          }
        `}
      >
        {actionLabel}
      </div>

      <div
        className={css`
          font-weight: 800;
          font-size: ${spelledWordFontSize};
          color: ${getRGBA('logoBlue', 1)};
          margin-bottom: 1rem;
          cursor: pointer;
          &:hover {
            text-decoration: underline;
          }
        `}
        onClick={() => setWordModalShown(true)}
        title={content}
      >
        {content}
      </div>

      {aiCard && (
        <div
          className={css`
            width: 100%;
            display: flex;
            justify-content: center;
            margin: 1rem 0;
          `}
        >
          <div
            className={css`
              width: 100%;
              max-width: 300px;
            `}
          >
            <AICard card={aiCard} />
          </div>
        </div>
      )}

      <div
        className={css`
          margin-bottom: 1rem;
          display: flex;
          justify-content: center;
          width: 100%;
        `}
      >
        <span
          className={css`
            display: inline-block;
            padding: 0.4rem 0.8rem;
            border-radius: 1rem;
            font-size: 1rem;
            font-weight: 600;
            color: #fff;
            background: ${getRGBA(colorName, 1)};
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12);
          `}
        >
          {wordLevelHash[wordLevel]?.label}
        </span>
      </div>

      <div
        className={css`
          margin-bottom: 1rem;
          font-size: 0.9rem;
          color: #666;
        `}
      >
        <span>{displayedTime}</span>
      </div>

      <div
        className={css`
          display: flex;
          flex-direction: row;
          flex-wrap: wrap;
          gap: 0.5rem;
          justify-content: center;
          margin-top: auto;
        `}
      >
        <div className={badgeStyle('passionFruit', 0.85)}>
          <span className="label">
            {addCommasToNumber(totalPoints)}{' '}
            {Number(totalPoints) === 1 ? 'pt' : 'pts'}
          </span>
        </div>

        {xpReward > 0 && (
          <div className={badgeStyle('limeGreen', 0.85)}>
            <Icon icon={['far', 'star']} />
            <span className="label">{addCommasToNumber(xpReward)} XP</span>
          </div>
        )}

        {coinReward > 0 && (
          <div className={badgeStyle('gold', 0.85)}>
            <Icon icon={['far', 'badge-dollar']} />
            <span className="label">{addCommasToNumber(coinReward)}</span>
          </div>
        )}
      </div>

      {wordModalShown && (
        <WordModal word={content} onHide={() => setWordModalShown(false)} />
      )}
    </div>
  );
}
