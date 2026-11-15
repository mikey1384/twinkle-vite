import React, { useEffect, useState } from 'react';
import { css } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { useAppContext, useKeyContext } from '~/contexts';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import {
  CLASS_HELP_PATH,
  MY_CLASSES_PATH,
  discoveryShownThisVisit,
  markDiscoveryShown
} from './shared';

// The one-time offer card for approved teachers with no class yet, in the
// top-of-feed card slot of Home or Videos (whichever they open first owns
// it). The server decides whether it shows and remembers a dismissal or a
// use for good, on every device. It never shows in a visit that already
// showed a class-code hint.
export default function ClassOfferCard({
  surface
}: {
  surface: 'home' | 'videos';
}) {
  const navigate = useNavigate();
  const userId = useKeyContext((v) => v.myState.userId);
  const canMakeClasses = useKeyContext((v) => v.myState.canMakeClasses);
  const loadClassOffer = useAppContext((v) => v.requestHelpers.loadClassOffer);
  const answerClassOffer = useAppContext(
    (v) => v.requestHelpers.answerClassOffer
  );
  const [shown, setShown] = useState(false);
  const [busy, setBusy] = useState('');
  // only teachers ever ask (the session says who is one; the server checks
  // again)
  const isTeacher = !!userId && !!canMakeClasses;

  useEffect(() => {
    if (!isTeacher || discoveryShownThisVisit() === 'hint') return;
    let cancelled = false;
    loadClassOffer(surface).then(({ show }: { show: boolean }) => {
      if (cancelled || !show) return;
      markDiscoveryShown('card');
      setShown(true);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTeacher, surface]);

  if (!shown) return null;

  return (
    <aside className={cardClass} aria-label="Class codes">
      <div className={iconClass}>
        <Icon icon="qrcode" />
      </div>
      <div className={textClass}>
        <b>Getting students in without email?</b> Make a class code. Students
        scan it and join in seconds, and you can reset their passwords.
        <div className={actionsClass}>
          <Button
            color="logoBlue"
            loading={busy === 'try'}
            disabled={!!busy}
            onClick={() => handleAnswer('try', MY_CLASSES_PATH)}
          >
            Try it
          </Button>
          <Button
            variant="ghost"
            color="logoBlue"
            loading={busy === 'how'}
            disabled={!!busy}
            onClick={() => handleAnswer('how', `${CLASS_HELP_PATH}?from=card`)}
          >
            How it works
          </Button>
        </div>
      </div>
      <button
        type="button"
        className={closeClass}
        aria-label="Dismiss"
        disabled={!!busy}
        onClick={() => handleAnswer('dismiss')}
      >
        <Icon
          icon={busy === 'dismiss' ? 'spinner' : 'times'}
          pulse={busy === 'dismiss'}
        />
      </button>
    </aside>
  );

  // the card goes only once the server has saved the answer
  async function handleAnswer(how: 'dismiss' | 'try' | 'how', to?: string) {
    setBusy(how);
    try {
      await answerClassOffer(how);
      setShown(false);
      if (to) navigate(to);
    } catch {
      // not saved: the card stays, and opening the page still works
      if (to) navigate(to);
    } finally {
      setBusy('');
    }
  }
}

const cardClass = css`
  box-sizing: border-box;
  display: flex;
  align-items: flex-start;
  gap: 1.2rem;
  width: 100%;
  margin-bottom: 1rem;
  padding: 1.2rem 1.4rem;
  border: 1px solid var(--ui-border);
  border-radius: ${borderRadius};
  background: #fff;
  color: ${Color.darkerGray()};
  font-size: 1.5rem;
  line-height: 1.5;
  @media (max-width: ${mobileMaxWidth}) {
    border-radius: 0;
    border-left: 0;
    border-right: 0;
  }
`;
const iconClass = css`
  flex-shrink: 0;
  width: 3.6rem;
  height: 3.6rem;
  border-radius: 0.8rem;
  background: ${Color.logoBlue(0.12)};
  color: ${Color.logoBlue()};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
`;
const textClass = css`
  flex: 1;
  min-width: 0;
  b {
    color: ${Color.black()};
  }
`;
const actionsClass = css`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-top: 0.9rem;
`;
const closeClass = css`
  flex-shrink: 0;
  padding: 0.4rem 0.6rem;
  background: none;
  border: none;
  color: ${Color.gray()};
  font-size: 1.6rem;
  cursor: pointer;
  &:hover {
    color: ${Color.darkerGray()};
  }
`;
