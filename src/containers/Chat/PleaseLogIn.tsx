import React from 'react';
import LoggedOutPrompt from '~/components/LoggedOutPrompt';
import { Color } from '~/constants/css';
import { useRoleColor } from '~/theme/useRoleColor';

export default function PleaseLogIn() {
  const twinRole = useRoleColor('logoTwin', {
    fallback: 'logoBlue'
  });
  const kleRole = useRoleColor('logoKle', {
    fallback: 'logoGreen'
  });
  const twinColor = twinRole.getColor() || Color.logoBlue();
  const kleColor = kleRole.getColor() || Color.logoGreen();

  return (
    <LoggedOutPrompt
      title="Twinkle Chat"
      body={
        <>
          Chat one-on-one or in groups, share files and videos, join calls, and
          keep conversations organized with topics. Talk with{' '}
          <span style={{ color: twinColor, fontWeight: 'bold' }}>Twin</span>
          <span style={{ color: kleColor, fontWeight: 'bold' }}>kle</span>{' '}
          students, teachers, <strong>Zero</strong>, and <strong>Ciel</strong>,
          then collect words and AI Cards or play chess, omok, and Wordle.
        </>
      }
    />
  );
}
