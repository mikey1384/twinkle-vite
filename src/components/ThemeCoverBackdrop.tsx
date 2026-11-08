import React from 'react';
import PlatinumSurface from '~/components/PlatinumSurface';
import { platinumCoverOf } from '~/constants/profileThemes';

// The layer under a member's theme cover (the profile cover, the Missions
// cover): platinum gets the metal plate, the owner's photo and their Shine
// setting. Every other theme keeps its plain colour: the light-and-depth
// shading added with platinum was only ever meant for platinum (Mikey 11-08).
// The parent is position: relative and keeps its content above z 1.
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
  return null;
}
