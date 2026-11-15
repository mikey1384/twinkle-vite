import React from 'react';
import Icon from '~/components/Icon';

// First time (like NoTopicPosted in the Zero/Ciel Topics window): what a
// collection is for, in one line a kid gets, with the start form below.
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
        Make a collection for your comic&apos;s characters
      </p>
      <p style={{ margin: 0, color: '#526176', lineHeight: 1.5 }}>
        Pick pictures of your characters and write who they are. Every picture
        you make with the collection keeps them the same.
      </p>
      <div
        style={{
          width: '100%',
          maxWidth: 'calc(480 * var(--px))',
          textAlign: 'left'
        }}
      >
        {children}
      </div>
    </div>
  );
}
