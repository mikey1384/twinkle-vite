import React from 'react';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { timeSince } from '~/helpers/timeStampHelpers';

interface Build {
  id: number;
  userId: number;
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

export default function BuildCard({
  build,
  onClick
}: BuildCardProps) {
  const publishedAt = build.publishedAt || build.updatedAt || build.createdAt;
  const publishedLabel = publishedAt ? timeSince(publishedAt) : 'Unpublished';

  return (
    <div
      onClick={onClick}
      className={css`
        background: #fff;
        border: 1px solid var(--ui-border);
        border-radius: 12px;
        overflow: hidden;
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
      `}
    >
      <div
        className={css`
          height: 140px;
          background: linear-gradient(135deg, var(--theme-bg) 0%, var(--theme-hover-bg) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
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
            size="3x"
            style={{ color: 'var(--theme-text)', opacity: 0.5 }}
          />
        )}
      </div>
      <div
        className={css`
          padding: 1rem;
        `}
      >
        <h3
          className={css`
            margin: 0 0 0.5rem 0;
            font-size: 1.1rem;
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
              margin: 0 0 0.75rem 0;
              font-size: 0.9rem;
              color: var(--chat-text);
              opacity: 0.75;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            `}
          >
            {build.description}
          </p>
        )}
        <div
          className={css`
            display: flex;
            align-items: center;
            gap: 1rem;
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
          {build.sourceBuildId && (
            <span
              className={css`
                display: inline-flex;
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
            margin-top: 0.5rem;
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
