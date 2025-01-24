import React, { useState } from 'react';
import { css } from '@emotion/css';
import ProfilePic from '~/components/ProfilePic';
import UsernameText from '~/components/Texts/UsernameText';
import AICard from '~/components/AICard';
import Icon from '~/components/Icon';
import { wordLevelHash } from '~/constants/defaultValues';
import { mobileMaxWidth, wideBorderRadius } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import WordModal from '../../VocabularyWidget/WordModal';

export default function RewardLayout({
  feedRef,
  userId,
  username,
  profilePicUrl,
  action,
  content,
  wordLevel,
  xpReward,
  coinReward,
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
  content: string;
  wordLevel: number;
  xpReward: number;
  coinReward: number;
  displayedTime: string;
  aiCard?: any;
  getRGBA: (colorName: string, opacity: number) => string;
  getActionColor: (action: string) => string;
  badgeStyle: (colorName: string, bgOpacity: number) => string;
}) {
  const [wordModalShown, setWordModalShown] = useState(false);

  // Customize colors, background, etc. if you want a unique style
  // or keep similar to "spell" but with different action color.
  const colorName = wordLevelHash[wordLevel]?.color || 'logoBlue';
  const backgroundColor = getRGBA(colorName, 0.1);
  const borderColor = getRGBA(colorName, 0.7);
  const actionColor = getActionColor(action);
  const actionLabel = 'Was Rewarded'; // or use your label logic

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
      {/* Profile & username */}
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

      {/* Action label */}
      <div
        className={css`
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

      {/* Timestamp */}
      <div
        className={css`
          margin-bottom: 1rem;
          font-size: 0.9rem;
          color: #666;
        `}
      >
        <span>{displayedTime}</span>
      </div>

      {/* Because 'reward' always has aiCard (per your note),
          we place it front and center */}
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

      {/* Stats */}
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
