import React from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import { Color, mobileMaxWidth } from '~/constants/css';
import { getBuildRewardOfferedIdentity } from '~/helpers/buildRewardReviewCard';

// A reviewer proposal can rename the app and give it a new thumbnail along
// with its files. Shown before → after wherever the offer is read: the
// creator's comparison and the reviewer's panel. Renders nothing when the
// offer keeps both, or the app already has them.
export default function ProposalIdentityChange({
  currentTitle,
  proposedTitle: offeredTitle,
  currentThumbnailUrl,
  proposedThumbnailUrl: offeredThumbnailUrl
}: {
  currentTitle?: string | null;
  proposedTitle?: string | null;
  currentThumbnailUrl?: string | null;
  proposedThumbnailUrl?: string | null;
}) {
  const { title: proposedTitle, thumbnailUrl: proposedThumbnailUrl } =
    getBuildRewardOfferedIdentity({
      proposedTitle: offeredTitle,
      proposedThumbnailUrl: offeredThumbnailUrl,
      currentTitle,
      currentThumbnailUrl
    });
  if (!proposedTitle && !proposedThumbnailUrl) return null;
  return (
    <section className={identityClass} aria-label="Name and thumbnail">
      {proposedTitle ? (
        <div className={rowClass}>
          <span className={labelClass}>New name</span>
          <span className={changeClass}>
            <span className={beforeClass}>{currentTitle || 'Untitled'}</span>
            <Icon icon="arrow-right" className={arrowClass} />
            <strong>{proposedTitle}</strong>
          </span>
        </div>
      ) : null}
      {proposedThumbnailUrl ? (
        <div className={rowClass}>
          <span className={labelClass}>New thumbnail</span>
          <span className={changeClass}>
            {currentThumbnailUrl ? (
              <img
                className={`${thumbClass} ${beforeThumbClass}`}
                src={currentThumbnailUrl}
                alt="Current thumbnail"
              />
            ) : (
              <span className={`${thumbClass} ${emptyThumbClass}`}>
                No thumbnail
              </span>
            )}
            <Icon icon="arrow-right" className={arrowClass} />
            <img
              className={thumbClass}
              src={proposedThumbnailUrl}
              alt="Proposed thumbnail"
            />
          </span>
        </div>
      ) : null}
    </section>
  );
}

const identityClass = css`
  display: grid;
  gap: 1rem;
  padding: 1.2rem 1.4rem;
  border: 1px solid ${Color.borderGray()};
  border-radius: 10px;
  background: #fff;
  min-width: 0;
`;

const rowClass = css`
  display: grid;
  gap: 0.5rem;
  min-width: 0;
`;

const labelClass = css`
  font-size: 1.2rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: ${Color.gray()};
`;

const changeClass = css`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.8rem;
  font-size: 1.5rem;
  min-width: 0;
  overflow-wrap: anywhere;
`;

const beforeClass = css`
  color: ${Color.gray()};
  text-decoration: line-through;
`;

const arrowClass = css`
  color: ${Color.gray()};
  flex-shrink: 0;
`;

const thumbClass = css`
  width: 16rem;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid ${Color.borderGray()};
  background: ${Color.wellGray()};
  @media (max-width: ${mobileMaxWidth}) {
    width: calc(50% - 2rem);
  }
`;

const beforeThumbClass = css`
  opacity: 0.6;
`;

const emptyThumbClass = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: ${Color.gray()};
`;
