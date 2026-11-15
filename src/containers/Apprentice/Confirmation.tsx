import React from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { confirmationClass } from './styles';

// Shown once an application (or an update) is sent: the only confirmation
// there is. Nobody else is notified.
export default function Confirmation({
  revision,
  onKeepEditing
}: {
  revision: number;
  onKeepEditing: () => void;
}) {
  const first = revision <= 1;
  return (
    <section className={confirmationClass}>
      <Icon icon="paper-plane" size="2x" />
      <h2>{first ? 'Your application is in' : 'Your update is in'}</h2>
      <p>
        {first
          ? 'Thank you for applying. It is with Mikey now. There is no deadline, and nothing more you need to do.'
          : 'Thank you. Mikey can see this version and how it has changed. Every version is kept.'}
      </p>
      <p>
        Keep building, keep helping people, and come back to update it
        whenever you have grown.
      </p>
      <Button
        variant="ghost"
        color="logoBlue"
        style={{ marginTop: '1rem' }}
        onClick={onKeepEditing}
      >
        View my application
      </Button>
    </section>
  );
}
