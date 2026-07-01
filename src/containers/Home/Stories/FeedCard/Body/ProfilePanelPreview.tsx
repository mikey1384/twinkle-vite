import React from 'react';
import Loading from '~/components/Loading';
import ProfileEmbedCard from '~/components/ProfileEmbedCard';

export default function ProfilePanelPreview({
  profile,
  theme
}: {
  profile: any;
  theme?: string;
}) {
  if (!profile?.id || profile?.notFound) {
    return (
      <div className="home-feed-card__mini-profile-loading">
        <Loading theme={theme} />
      </div>
    );
  }

  return (
    <ProfileEmbedCard
      profile={profile}
      theme={theme}
      online={profile?.online}
      selfBordered={false}
      fillHeight
    />
  );
}
