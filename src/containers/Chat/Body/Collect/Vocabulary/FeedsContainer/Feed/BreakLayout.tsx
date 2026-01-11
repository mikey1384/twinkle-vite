import React, { useLayoutEffect, useMemo, useRef } from 'react';
import { css } from '@emotion/css';
import ProfilePic from '~/components/ProfilePic';
import UsernameText from '~/components/Texts/UsernameText';
import { mobileMaxWidth, borderRadius } from '~/constants/css';

const breakTypeLabels: Record<string, string> = {
  daily_tasks: 'daily tasks',
  daily_reflection: 'daily reflection',
  chess_puzzle: 'chess puzzle',
  pending_moves: 'pending moves',
  grammarbles: 'grammarbles',
  vocab_quiz: 'vocab quiz'
};

export default function BreakLayout({
  onHeightMeasured,
  userId,
  username,
  profilePicUrl,
  action,
  breakIndex,
  breakType,
  displayedTime,
  getRGBA,
  getActionColor,
  badgeStyle
}: {
  onHeightMeasured: (height: number) => void;
  userId: number;
  username: string;
  profilePicUrl: string;
  action: string;
  breakIndex?: number;
  breakType?: string;
  displayedTime: string;
  getRGBA: (colorName: string, opacity?: number) => string;
  getActionColor: (action: string) => string;
  badgeStyle: (colorName: string, bgOpacity?: number) => string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (panelRef.current) {
      onHeightMeasured(panelRef.current.offsetHeight);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const actionColor = getActionColor(action);
  const backgroundColor = getRGBA(actionColor, 0.08);
  const borderColor = getRGBA(actionColor, 0.7);

  const actionLabel = useMemo(() => {
    if (action === 'break_clear') return 'Break Cleared';
    return 'Break Started';
  }, [action]);

  const breakLabel = useMemo(() => {
    const normalizedBreakType =
      typeof breakType === 'string' ? breakType.trim() : '';
    const readableType =
      breakTypeLabels[normalizedBreakType] ||
      (normalizedBreakType ? normalizedBreakType.replace(/_/g, ' ') : 'break');
    if (breakIndex) {
      return `Break ${breakIndex}: ${readableType}`;
    }
    return `Word Master ${readableType}`;
  }, [breakIndex, breakType]);

  return (
    <div
      ref={panelRef}
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
        border-radius: ${borderRadius};
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
          font-size: 2.3rem;
          color: ${getRGBA('logoBlue', 1)};
          margin-bottom: 1rem;
          max-width: 90%;
          word-break: break-word;
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 1.7rem;
          }
        `}
      >
        {breakLabel}
      </div>

      <div
        className={css`
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
          color: #666;
        `}
      >
        <span>{displayedTime}</span>
      </div>
    </div>
  );
}
