import React from 'react';
import UsernameText from '~/components/Texts/UsernameText';

// Apps can be traded, so a card names who owns the app now (like AI cards),
// never who first made it.
export default function BuildAttribution({
  build
}: {
  build: {
    userId?: number | string;
    username?: string;
    profilePicUrl?: string | null;
  };
}) {
  const style: React.CSSProperties = {
    color: 'inherit',
    fontSize: 'inherit',
    fontWeight: 'inherit'
  };
  return (
    <span style={{ display: 'block', minWidth: 0, whiteSpace: 'normal' }}>
      Owned by{' '}
      {/* only the name opens the profile; taps elsewhere reach the card */}
      <span
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <UsernameText
          color="inherit"
          textStyle={style}
          user={{
            id: Number(build.userId),
            username: build.username || '',
            profilePicUrl: build.profilePicUrl || ''
          }}
        />
      </span>
    </span>
  );
}
