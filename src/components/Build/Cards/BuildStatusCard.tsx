import React from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import UsernameText from '~/components/Texts/UsernameText';
import { lineClamp } from '~/constants/css';
import { getBuildDisplayTitle } from '~/helpers/buildRelationshipHelpers';
import { useBuildCardData } from './useBuildCardData';

// A Lumine app inside a profile's status message. The status box is a coloured
// strip of text, so the app is one short row on a white card: its picture first,
// then its name. Nothing here nests another embed, so it cannot recurse.
export const BUILD_STATUS_CARD_HEIGHT = '5.6rem';

const cardClass = css`
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  width: 100%;
  max-width: 30rem;
  min-width: 0;
  height: ${BUILD_STATUS_CARD_HEIGHT};
  padding: 0.5rem 0.7rem 0.5rem 0.5rem;
  border: 1px solid rgba(15, 23, 42, 0.14);
  border-radius: 0.8rem;
  background: #fff;
  color: #1f2937;
  text-align: left;
  cursor: pointer;

  &:hover {
    border-color: rgba(65, 140, 235, 0.6);
  }

  &:focus-visible {
    outline: 2px solid #418ceb;
    outline-offset: 2px;
  }
`;

const thumbClass = css`
  flex: 0 0 auto;
  width: 6.8rem;
  height: 100%;
  overflow: hidden;
  border-radius: 0.55rem;
  background: #e8eef7;
  display: grid;
  place-items: center;
  color: #418ceb;
  font-size: 2.2rem;

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top center;
  }
`;

const copyClass = css`
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  flex-direction: column;
  gap: 0.25rem;
`;

const titleClass = css`
  font-size: 1.35rem;
  font-weight: 800;
  line-height: 1.15;
  overflow-wrap: anywhere;
  ${lineClamp(2)}
`;

const metaClass = css`
  min-width: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: #64748b;
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.2;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

export default function BuildStatusCard({
  build: buildInput,
  profileUserId = 0,
  onOpen
}: {
  build: Record<string, any>;
  // the profile this status belongs to: its own apps need no "Owned by" line
  profileUserId?: number;
  onOpen: (build: any) => void;
}) {
  const build = useBuildCardData(buildInput);
  if (!build) return null;
  const title = getBuildDisplayTitle(build) || 'Lumine App';
  const thumbnailUrl = String(build.thumbnailUrl || '').trim();
  // apps can be traded, so name who owns it now, and only when that is not the profile owner
  const ownerId = Number(build.userId || 0);
  const uploader: { id?: number; username?: string; profilePicUrl?: string } =
    (build as any).uploader || {};
  const ownerName = String(
    build.username ||
      (Number(uploader.id) === ownerId ? uploader.username : '') ||
      ''
  );
  const showOwner = ownerId > 0 && !!ownerName && ownerId !== profileUserId;

  return (
    <div
      className={cardClass}
      role="link"
      tabIndex={0}
      aria-label={`Open ${title}`}
      onClick={handleOpen}
      onKeyDown={handleKeyDown}
    >
      <span className={thumbClass} aria-hidden>
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt="" loading="lazy" decoding="async" />
        ) : (
          <Icon icon="rocket" />
        )}
      </span>
      <span className={copyClass}>
        <strong className={titleClass}>{title}</strong>
        <span className={metaClass}>
          <Icon icon="rocket" />
          Lumine App
        </span>
        {showOwner ? (
          <span className={metaClass}>
            Owned by{' '}
            {/* only the name opens the profile; the rest of the card opens the app */}
            <span onClick={stopEvent} onKeyDown={stopEvent}>
              <UsernameText
                color="inherit"
                textStyle={{
                  color: 'inherit',
                  fontSize: 'inherit',
                  fontWeight: 'inherit'
                }}
                user={{
                  id: ownerId,
                  username: ownerName,
                  profilePicUrl:
                    build.profilePicUrl ||
                    (Number(uploader.id) === ownerId
                      ? uploader.profilePicUrl
                      : '') ||
                    ''
                }}
              />
            </span>
          </span>
        ) : null}
      </span>
    </div>
  );

  function stopEvent(event: React.SyntheticEvent) {
    event.stopPropagation();
  }

  function handleOpen(event: React.SyntheticEvent<HTMLElement>) {
    event.preventDefault();
    event.stopPropagation();
    onOpen(build);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    handleOpen(event);
  }
}
