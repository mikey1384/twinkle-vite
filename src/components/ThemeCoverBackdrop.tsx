import React from 'react';
import { css } from '@emotion/css';
import PlatinumSurface from '~/components/PlatinumSurface';
import { platinumCoverOf } from '~/constants/profileThemes';

// The layer under a member's theme cover (the profile cover, the Missions
// cover): platinum gets the metal plate, the owner's photo and their Shine
// setting; every other theme gets a soft light from above and a little depth
// below. The parent is position: relative and keeps its content above z 1.
export default function ThemeCoverBackdrop({
  cover,
  photoFade,
  photoPosition,
  shine,
  size = 'cover'
}: {
  cover: ReturnType<typeof platinumCoverOf>;
  photoFade?: 'bottom' | 'even';
  // overrides while the owner drags the photo into place
  photoPosition?: string;
  shine?: boolean;
  size?: 'cover' | 'card';
}) {
  if (cover.isPlatinum) {
    return (
      <PlatinumSurface
        size={size}
        photoUrl={cover.photoUrl}
        photoFade={photoFade}
        photoPosition={photoPosition ?? cover.position}
        shine={shine ?? cover.shine}
        style={{ position: 'absolute', inset: 0, zIndex: 1 }}
      />
    );
  }
  return <div aria-hidden="true" className={softLightClass} />;
}

const softLightClass = css`
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background:
    radial-gradient(120% 90% at 20% 0%, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0) 60%),
    linear-gradient(180deg, rgba(0, 0, 0, 0) 55%, rgba(0, 0, 0, 0.14) 100%);
`;
