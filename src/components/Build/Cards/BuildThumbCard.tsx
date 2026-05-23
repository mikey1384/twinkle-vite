import React from 'react';
import { css, cx } from '@emotion/css';
import FavoriteButton, { type BuildFavoriteChange } from '~/components/Build/FavoriteButton';
import PreviewFrame from '~/components/Build/PreviewFrame';
import Icon from '~/components/Icon';
import UsernameText from '~/components/Texts/UsernameText';
import { getBuildUsernameUser } from '~/helpers/buildProjectHelpers';
import { useBuildCardData } from './useBuildCardData';

const inheritedUsernameTextStyle: React.CSSProperties = {
  color: 'inherit',
  fontSize: 'inherit',
  fontWeight: 'inherit'
};

const cardClass = css`
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--ui-border, rgba(65, 140, 235, 0.24));
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
`;

const previewButtonClass = css`
  display: block;
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  text-align: left;
`;

const previewClass = css`
  width: 100%;
  aspect-ratio: 16 / 10;
  min-height: 0;
  border: 0;
  border-radius: 0;
`;

const bodyClass = css`
  min-width: 0;
  padding: 0.7rem 0.75rem 0.78rem;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.45rem;
`;

const titleButtonClass = css`
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--chat-text);
  cursor: pointer;
  display: -webkit-box;
  width: 100%;
  overflow: hidden;
  text-align: left;
  font-size: 1.3rem;
  font-weight: 900;
  line-height: 1.15;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

const metaClass = css`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.28rem;
  color: var(--chat-text);
  font-size: 1.1rem;
  font-weight: 800;
  opacity: 0.74;

  span {
    min-width: 0;
    display: inline-flex;
    align-items: center;
    gap: 0.34rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const footerClass = css`
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
`;

const openButtonClass = css`
  height: 2.1rem;
  min-width: 0;
  padding: 0 0.62rem;
  border: 1px solid
    var(--build-open-app-border, var(--ui-border, rgba(65, 140, 235, 0.32)));
  border-radius: 7px;
  background: var(--build-open-app-bg, var(--theme-bg, #418ceb));
  color: var(--theme-text, #fff);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  font-size: 1rem;
  font-weight: 900;
  cursor: pointer;
`;

export default function BuildThumbCard({
  build: buildInput,
  className,
  metaIcon = 'clock',
  metaLabel,
  openButtonStyle,
  onFavoriteChange,
  onFavoriteError,
  onFavoriteStart,
  onOpen
}: {
  build: Record<string, any>;
  className?: string;
  metaIcon?: string;
  metaLabel?: string;
  openButtonStyle?: React.CSSProperties;
  onFavoriteChange?: (build: any, change: BuildFavoriteChange) => void;
  onFavoriteError?: (
    build: any,
    error: unknown,
    params: { buildId: number; requestedFavorited: boolean }
  ) => void;
  onFavoriteStart?: (
    build: any,
    params: { buildId: number; requestedFavorited: boolean }
  ) => void;
  onOpen: (build: any) => void;
}) {
  const build = useBuildCardData(buildInput);
  if (!build) return null;
  const title = build.title || 'Untitled Build';
  return (
    <article className={cx(cardClass, className)}>
      <button
        type="button"
        className={previewButtonClass}
        onClick={() => onOpen(build)}
        aria-label={`Open ${title}`}
      >
        <PreviewFrame
          className={previewClass}
          thumbnailUrl={build.thumbnailUrl}
          alt={`${title} screenshot`}
          ariaLabel={`${title} preview`}
        />
      </button>
      <div className={bodyClass}>
        <button
          type="button"
          className={titleButtonClass}
          onClick={() => onOpen(build)}
        >
          {title}
        </button>
        <div className={metaClass}>
          {build.username ? (
            <span>
              <Icon icon="user" />
              by{' '}
              <UsernameText
                color="inherit"
                textStyle={inheritedUsernameTextStyle}
                user={getBuildUsernameUser(build)}
              />
            </span>
          ) : null}
          {metaLabel ? (
            <span>
              <Icon icon={metaIcon} />
              {metaLabel}
            </span>
          ) : null}
        </div>
        <div className={footerClass}>
          <button
            type="button"
            className={openButtonClass}
            style={openButtonStyle}
            onClick={() => onOpen(build)}
          >
            <Icon icon="external-link-alt" />
            <span>Open</span>
          </button>
          <FavoriteButton
            buildId={build.id}
            favorited={Boolean(build.isFavorited)}
            size="sm"
            onChange={(change) => onFavoriteChange?.(build, change)}
            onError={(error, params) => onFavoriteError?.(build, error, params)}
            onStart={(params) => onFavoriteStart?.(build, params)}
          />
        </div>
      </div>
    </article>
  );
}
