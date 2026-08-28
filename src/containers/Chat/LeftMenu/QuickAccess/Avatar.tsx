import React from 'react';
import ciel from '~/assets/ciel.png';
import cielBuilder from '~/assets/ciel-builder.png';
import zero from '~/assets/zero.png';
import zeroBuilder from '~/assets/zero-builder.png';
import ProfilePic from '~/components/ProfilePic';
import { CIEL_TWINKLE_ID, ZERO_TWINKLE_ID } from '~/constants/defaultValues';
import { css } from '@emotion/css';
import useWorkshopEngineerMode from '~/helpers/hooks/useWorkshopEngineerMode';
import type { ChatQuickAccessPartner } from './types';

export default function QuickAccessAvatar({
  partner,
  size = '3.5rem'
}: {
  partner: ChatQuickAccessPartner;
  size?: number | string;
}) {
  const engineerMode = useWorkshopEngineerMode();
  const aiImage =
    partner.id === CIEL_TWINKLE_ID
      ? engineerMode
        ? cielBuilder
        : ciel
      : partner.id === ZERO_TWINKLE_ID
        ? engineerMode
          ? zeroBuilder
          : zero
        : null;

  return (
    <div
      className={css`
        width: ${typeof size === 'number' ? `${size}px` : size};
        height: ${typeof size === 'number' ? `${size}px` : size};
        flex: 0 0 auto;
      `}
    >
      {partner.isAi && aiImage ? (
        <img
          src={aiImage}
          alt=""
          className={css`
            display: block;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            object-fit: cover;
          `}
        />
      ) : (
        <ProfilePic
          userId={partner.id}
          profilePicUrl={partner.profilePicUrl || undefined}
          size="100%"
          style={{ cursor: 'inherit' }}
        />
      )}
    </div>
  );
}
