import React from 'react';
import Icon from '~/components/Icon';

// First time (like NoTopicPosted in the Zero/Ciel Topics window): what a
// collection is for, in words a kid gets, with example chips and the start
// form below. v2 (Mikey 11-16): any kind of thing, not only comic characters.
export default function NoCollectionYet({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        padding: '16px 0',
        color: '#334155',
        textAlign: 'center'
      }}
    >
      <Icon icon="images" style={{ fontSize: 32, color: '#526176' }} />
      <p
        style={{
          margin: 0,
          fontWeight: 700,
          fontSize: 'calc(18 * var(--px))'
        }}
      >
        Teach the AI what you mean once
      </p>
      <p style={{ margin: 0, color: '#526176', lineHeight: 1.5 }}>
        Pick a few of your pictures and say what each one is. Every picture you
        make with the collection keeps it the same.
      </p>
      <div
        style={{
          width: '100%',
          maxWidth: 'calc(520 * var(--px))',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          textAlign: 'left'
        }}
      >
        {children}
      </div>
    </div>
  );
}
