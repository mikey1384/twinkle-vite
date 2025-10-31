import React from 'react';
import Icon from '~/components/Icon';
import GoBack from '~/components/GoBack';
import EmptyStateMessage from '~/components/EmptyStateMessage';

export default function NotUnlocked({
  missionTitle
}: {
  missionTitle: string;
}) {
  return (
    <div style={{ padding: '0 1rem' }}>
      <EmptyStateMessage
        icon={<Icon icon="lock" />}
        style={{ marginBottom: '3rem' }}
      >
        This task has not been unlocked, yet
      </EmptyStateMessage>
      <GoBack
        isAtTop={false}
        style={{ marginTop: '5rem' }}
        bordered
        to=".."
        text={missionTitle}
      />
    </div>
  );
}
