import React from 'react';
import Icon from '~/components/Icon';
import ProfilePic from '~/components/ProfilePic';
import { css } from '@emotion/css';
import { timeSince } from '~/helpers/timeStampHelpers';

interface Build {
  id: number;
  userId: number;
  username: string;
  profilePicUrl: string | null;
  title: string;
  description: string | null;
  slug: string;
  status: string;
  thumbnailUrl: string | null;
  publishedAt: number;
  sourceBuildId: number | null;
  createdAt: number;
  updatedAt: number;
  stats: {
    viewCount: number;
    starCount: number;
    commentCount: number;
    forkCount: number;
  };
}

interface BuildCardProps {
  build: Build;
  onClick: () => void;
}

export default function BuildCard({ build, onClick }: BuildCardProps) {
  const publishedAt = build.publishedAt || build.updatedAt || build.createdAt;
  const publishedLabel = publishedAt ? timeSince(publishedAt) : 'Unpublished';

  return (
    <div
      onClick={onClick}
      className={css`
        background: #fff;
        border: 1px solid var(--ui-border);
        border-radius: 16px;
        overflow: hidden;
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        &:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }
      `}
    >
      <div
        className={css`
          height: 160px;
          background: linear-gradient(
            135deg,
            var(--theme-bg) 0%,
            var(--theme-hover-bg) 100%
          );
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          position: relative;
        `}
      >
        {build.thumbnailUrl ? (
          <img
            src={build.thumbnailUrl}
            alt={build.title}
            className={css`
              width: 100%;
              height: 100%;
              object-fit: cover;
            `}
          />
        ) : (
          <Icon
            icon="laptop-code"
            size="4x"
            style={{ color: 'var(--theme-text)', opacity: 0.4 }}
          />
        )}
        {build.sourceBuildId && (
          <span
            className={css`
              position: absolute;
              top: 0.75rem;
              right: 0.75rem;
              padding: 0.3rem 0.6rem;
              border-radius: 6px;
              background: rgba(0, 0, 0, 0.6);
              color: #fff;
              font-size: 0.75rem;
              font-weight: 600;
              display: flex;
              align-items: center;
              gap: 0.3rem;
            `}
          >
            <Icon icon="code-branch" />
            Fork
          </span>
        )}
      </div>
      <div
        className={css`
          padding: 1.25rem;
        `}
      >
        <h3
          className={css`
            margin: 0 0 0.5rem 0;
            font-size: 1.15rem;
            font-weight: 700;
            color: var(--chat-text);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          `}
        >
          {build.title}
        </h3>
        {build.description && (
          <p
            className={css`
              margin: 0 0 1rem 0;
              font-size: 0.9rem;
              color: var(--chat-text);
              opacity: 0.75;
              overflow: hidden;
              text-overflow: ellipsis;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              line-height: 1.4;
            `}
          >
            {build.description}
          </p>
        )}
        <div
          className={css`
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-top: 0.75rem;
          `}
        >
          <div
            className={css`
              display: flex;
              align-items: center;
              gap: 0.6rem;
            `}
          >
            <ProfilePic
              userId={build.userId}
              profilePicUrl={build.profilePicUrl || ''}
              style={{ width: '28px', height: '28px' }}
            />
            <span
              className={css`
                font-size: 0.9rem;
                font-weight: 600;
                color: var(--chat-text);
              `}
            >
              {build.username}
            </span>
          </div>
          <div
            className={css`
              display: flex;
              align-items: center;
              gap: 0.75rem;
              font-size: 0.85rem;
              color: var(--chat-text);
              opacity: 0.6;
            `}
          >
            <span
              className={css`
                display: inline-flex;
                align-items: center;
                gap: 0.3rem;
              `}
            >
              <Icon icon="star" />
              {build.stats.starCount}
            </span>
            <span
              className={css`
                display: inline-flex;
                align-items: center;
                gap: 0.3rem;
              `}
            >
              <Icon icon="comment" />
              {build.stats.commentCount}
            </span>
          </div>
        </div>
        <div
          className={css`
            margin-top: 0.75rem;
            font-size: 0.8rem;
            color: var(--chat-text);
            opacity: 0.5;
          `}
        >
          {publishedLabel}
        </div>
      </div>
    </div>
  );
}
