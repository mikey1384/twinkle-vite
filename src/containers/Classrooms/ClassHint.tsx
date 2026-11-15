import React, { useEffect, useState } from 'react';
import { css } from '@emotion/css';
import { Link } from 'react-router-dom';
import { useAppContext } from '~/contexts';
import { Color } from '~/constants/css';
import {
  CLASS_HELP_PATH,
  discoveryShownThisVisit,
  markDiscoveryShown
} from './shared';

// The server answers "show" once per mailbox. Stepping back and forward in
// the same form must not make the line vanish, so this page load remembers.
const shownThisPage = new Set<string>();

const HINT_TEXT = {
  a: 'Signing up students? A class code lets them join without your email.',
  b: 'Resetting for a student? With a class, you can do this from your roster.'
};

// One quiet grey line at a teacher's moment of need (PLAN.md 5a piece 2):
//   a: under "Email verified" while signing up, when that mailbox already
//      carries several accounts (the emailed code proved who owns it);
//   b: on the reset-password page (reached only from the emailed link).
// The server shows it once per mailbox and never names other accounts. It
// never shows in a visit that showed the offer card. It changes nothing
// about the form it sits in.
export default function ClassHint({
  kind,
  email,
  resetToken,
  onNavigate
}: {
  kind: 'a' | 'b';
  email?: string;
  resetToken?: string;
  // the sign-up window closes when the link is followed
  onNavigate?: () => void;
}) {
  const claimClassHint = useAppContext((v) => v.requestHelpers.claimClassHint);
  const recordClassroomEvent = useAppContext(
    (v) => v.requestHelpers.recordClassroomEvent
  );
  const proof = kind === 'a' ? email : resetToken;
  const [shown, setShown] = useState(() =>
    shownThisPage.has(`${kind}:${proof}`)
  );

  useEffect(() => {
    if (!proof || shown || discoveryShownThisVisit() === 'card') return;
    let cancelled = false;
    claimClassHint({ kind, email, resetToken }).then((show: boolean) => {
      if (cancelled || !show) return;
      markDiscoveryShown('hint');
      shownThisPage.add(`${kind}:${proof}`);
      setShown(true);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proof]);

  if (!shown) return null;

  return (
    <p className={hintClass}>
      {HINT_TEXT[kind]}{' '}
      <Link
        to={`${CLASS_HELP_PATH}?from=hint`}
        onClick={() => {
          recordClassroomEvent({ kind: 'hint_clicked', detail: kind });
          onNavigate?.();
        }}
      >
        How it works ›
      </Link>
    </p>
  );
}

const hintClass = css`
  margin: 0.8rem 0 0;
  font-size: 1.3rem;
  font-weight: normal;
  line-height: 1.4;
  color: ${Color.darkGray()};
  a {
    color: ${Color.darkerGray()};
    font-weight: 700;
  }
`;
