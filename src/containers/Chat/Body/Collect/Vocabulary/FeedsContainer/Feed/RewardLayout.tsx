import React, { useState, useMemo } from 'react';
import { css } from '@emotion/css';
import ProfilePic from '~/components/ProfilePic';
import UsernameText from '~/components/Texts/UsernameText';
import AICard from '~/components/AICard';
import Icon from '~/components/Icon';
import { wordLevelHash } from '~/constants/defaultValues';
import { mobileMaxWidth, wideBorderRadius } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { useNavigate } from 'react-router-dom';
import WordModal from '../../WordModal';

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
  badgeStyle,
  rewardType
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
  rewardType?: 'monthly' | 'yearly';
}) {
  const [wordModalShown, setWordModalShown] = useState(false);
  const navigate = useNavigate();

  // For the background styling
  const colorName = wordLevelHash[wordLevel]?.color || 'logoBlue';
  const backgroundColor = getRGBA(colorName, 0.1);
  const borderColor = getRGBA(colorName, 0.7);

  // For the "badge" color (the label that says "Monthly Champion Reward," etc.)
  const actionColor = getActionColor(action);

  // 1) Determine the color to use for the reward badge
  const rewardBadgeColor = useMemo(() => {
    switch (rewardType) {
      case 'monthly':
        return 'skyBlue';
      case 'yearly':
        return 'gold';
      default:
        // Fallback or a random/unique drop => use the default actionColor
        return actionColor;
    }
  }, [rewardType, actionColor]);

  // 2) Determine what text to show for the reward
  const rewardDescription = useMemo(() => {
    switch (rewardType) {
      case 'monthly':
        return 'Monthly Champion Reward';
      case 'yearly':
        return 'Annual Champion Reward';
      default:
        // If rewardType is falsy => treat it like a random or “lucky” drop
        return 'Got Lucky!';
    }
  }, [rewardType]);

  return (
    <div
      ref={feedRef}
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
      {/* User Info */}
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

      {/* Reward Label */}
      <div
        className={css`
          ${badgeStyle(rewardBadgeColor, 0.85)}
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
        {rewardDescription}
      </div>

      {/* Display time */}
      <div
        className={css`
          margin-bottom: 1rem;
          font-size: 0.9rem;
          color: #666;
        `}
      >
        <span>{displayedTime}</span>
      </div>

      {/* AI Card (if applicable) */}
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
            <AICard
              card={aiCard}
              onClick={() => navigate(`./?cardId=${aiCard.id}`)}
            />
          </div>
        </div>
      )}

      {/* XP and Coins */}
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
        <WordModal
          key={content}
          word={content}
          onHide={() => setWordModalShown(false)}
        />
      )}
    </div>
  );
}
