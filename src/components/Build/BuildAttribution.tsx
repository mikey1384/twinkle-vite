import React from 'react';
import UsernameText from '~/components/Texts/UsernameText';

export default function BuildAttribution({
  build
}: {
  build: {
    userId?: number | string;
    username?: string;
    profilePicUrl?: string | null;
    creatorId?: number | null;
    creatorUsername?: string | null;
    creatorProfilePicUrl?: string | null;
  };
}) {
  const creatorId = Number(build.creatorId || build.userId);
  const transferred = creatorId !== Number(build.userId);
  const style: React.CSSProperties = {
    color: 'inherit',
    fontSize: 'inherit',
    fontWeight: 'inherit'
  };
  return (
    <span style={{ display: 'block', minWidth: 0, whiteSpace: 'normal' }}>
      Created by{' '}
      <UsernameText
        color="inherit"
        textStyle={style}
        user={{
          id: creatorId,
          username:
            build.creatorUsername ||
            (transferred ? 'Original creator' : build.username) ||
            '',
          profilePicUrl:
            build.creatorProfilePicUrl ||
            (transferred ? '' : build.profilePicUrl) ||
            ''
        }}
      />
      {transferred && (
        <>
          {' · '}Owned by{' '}
          <UsernameText
            color="inherit"
            textStyle={style}
            user={{
              id: Number(build.userId),
              username: build.username || '',
              profilePicUrl: build.profilePicUrl || ''
            }}
          />
        </>
      )}
    </span>
  );
}
