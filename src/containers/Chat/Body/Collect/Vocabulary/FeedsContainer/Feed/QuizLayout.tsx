import React from 'react';
import { css } from '@emotion/css';
import ProfilePic from '~/components/ProfilePic';
import UsernameText from '~/components/Texts/UsernameText';
import moment from 'moment';
import { Color, mobileMaxWidth, wideBorderRadius } from '~/constants/css';

interface QuizLayoutProps {
  feedRef: React.RefObject<HTMLDivElement | null>;
  userId: number;
  username: string;
  profilePicUrl: string;
  timeStamp: number;
  totalPoints: number;
  quiz: {
    historyId: number | null;
    points: number;
    questionPoints: number;
    bonusPoints: number;
    attemptsPlayed: number;
    bestAttemptIndex: number;
    perfect: boolean;
  };
}

export default function WordMasterLayout({
  feedRef,
  userId,
  username,
  profilePicUrl,
  timeStamp,
  totalPoints,
  quiz
}: QuizLayoutProps) {
  const displayTime = moment.unix(timeStamp).format('lll');
  const tagColor = quiz.perfect ? Color.gold() : Color.logoBlue();

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

        display: grid;
        grid-template-columns: 140px 1fr 160px;
        grid-template-rows: 1fr;
        grid-template-areas: 'avatar content stats';
        gap: 1rem;
        padding: 1.2rem 1rem;
        background: linear-gradient(
          135deg,
          rgba(62, 138, 230, 0.12),
          rgba(60, 180, 130, 0.08)
        );
        border-left: 8px solid ${Color.logoBlue()};
        border-radius: ${wideBorderRadius};
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
        margin-bottom: 1.5rem;
        min-height: 160px;

        @media (max-width: ${mobileMaxWidth}) {
          grid-template-columns: 80px 1fr;
          grid-template-areas:
            'avatar content'
            'stats stats';
          gap: 0.8rem;
          padding: 1rem;
          min-height: auto;
        }
      `}
    >
      <div
        className={css`
          grid-area: avatar;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.6rem;

          @media (max-width: ${mobileMaxWidth}) {
            align-items: center;
          }
        `}
      >
        <ProfilePic
          userId={userId}
          profilePicUrl={profilePicUrl}
          style={{ width: '4.5rem', height: '4.5rem' }}
        />
        <UsernameText
          user={{ id: userId, username }}
          color={Color.logoBlue()}
          style={{ fontSize: '1rem' }}
        />
        <div
          className={css`
            font-size: 0.9rem;
            color: ${Color.darkerGray()};
          `}
        >
          {displayTime}
        </div>
      </div>
      <div
        className={css`
          grid-area: content;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 0.6rem;
        `}
      >
        <div
          className={css`
            font-size: 1.4rem;
            font-weight: 700;
            color: ${Color.logoBlue()};
          `}
        >
          Word Master Score
        </div>
        <div
          className={css`
            font-size: 2.8rem;
            font-weight: 800;
            color: ${Color.blue()};
          `}
        >
          {totalPoints}
        </div>
        <div
          className={css`
            font-size: 1.1rem;
            color: ${Color.darkerGray()};
          `}
        >
          <span>Question pts: {quiz.questionPoints}</span>
          <span style={{ marginLeft: '1rem' }}>Bonus: {quiz.bonusPoints}</span>
        </div>
        <div
          className={css`
            margin-top: 0.4rem;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.35rem 0.9rem;
            border-radius: 999px;
            background: ${tagColor};
            color: #fff;
            font-size: 0.9rem;
            font-weight: 600;
            width: fit-content;
          `}
        >
          {quiz.perfect ? 'Perfect Run!' : 'Cleared'}
        </div>
      </div>
      <div
        className={css`
          grid-area: stats;
          display: flex;
          flex-direction: column;
          justify-content: center;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 0.8rem;
          padding: 0.8rem;
          color: ${Color.darkerGray()};
          font-size: 0.95rem;
          gap: 0.4rem;
          border: 1px solid ${Color.borderGray()};

          @media (max-width: ${mobileMaxWidth}) {
            flex-direction: row;
            justify-content: space-between;
            font-size: 0.85rem;
          }
        `}
      >
        <div>Attempts played: {quiz.attemptsPlayed}</div>
        <div>Best attempt #{quiz.bestAttemptIndex || quiz.attemptsPlayed}</div>
      </div>
    </div>
  );
}
