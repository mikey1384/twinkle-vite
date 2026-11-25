import React, { useEffect, useState } from 'react';
import SignInCardView from './SignInCardView';
import { useLocation } from 'react-router-dom';
import { useAppContext, useKeyContext } from '~/contexts';
import { cancelRedirectTarget, codeRedirectTarget, parsedOrigin } from './handBack';

// /lumine-app/signin?app=<id>&origin=<app address>&challenge=…&state=…&return=…
// "Sign in with Twinkle" for a Lumine app on its own address. The member is
// signed in here as usual (or signs in first); this page names the app and
// what it can do, and on Continue asks the API for a one-time code bound to
// the app's own address and one return URL on it. The code goes only to
// what the API returned: postMessage to the API's normalized origin when an
// app window opened this page, otherwise a redirect to the API's bound
// return URL (checked again here by parsed-origin equality). Nothing in the
// query decides where a code goes. Twinkle cookies and sessions never leave
// twin-kle.com.
export default function LumineAppSignIn() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const buildId = Number(params.get('app') || 0);
  const origin = params.get('origin') || '';
  const challenge = params.get('challenge') || '';
  const state = params.get('state') || '';
  const returnUrl = params.get('return') || '';
  const userId = useKeyContext((v) => v.myState.userId);
  const username = useKeyContext((v) => v.myState.username);
  const onOpenSigninModal = useAppContext((v) => v.user.actions.onOpenSigninModal);
  const loadAppSigninInfo = useAppContext((v) => v.requestHelpers.loadAppSigninInfo);
  const authorizeAppSignin = useAppContext((v) => v.requestHelpers.authorizeAppSignin);
  const [app, setApp] = useState<{ title: string; ownerUsername: string; thumbnailUrl: string | null } | null>(null);
  const [originAllowed, setOriginAllowed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!buildId) return;
    loadAppSigninInfo({ buildId, origin })
      .then((data: any) => {
        setApp(data?.app || null);
        setOriginAllowed(Boolean(data?.originAllowed));
      })
      .catch(() => setError('This app isn’t available.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildId, origin]);

  function openerWindow() {
    try {
      return window.opener && !window.opener.closed ? (window.opener as Window) : null;
    } catch {
      return null;
    }
  }

  // Cancel: no code, back to the app (its own origin only).
  function cancel() {
    const opener = openerWindow();
    const normalized = parsedOrigin(origin);
    if (opener && normalized) {
      opener.postMessage({ source: 'lumine-signin', code: null, state }, normalized);
      window.close();
      return;
    }
    const target = cancelRedirectTarget({ origin, returnUrl });
    if (target) window.location.assign(target.toString());
  }

  function deliver(data: { code: string; origin: string; returnUrl: string }) {
    const opener = openerWindow();
    const apiOrigin = parsedOrigin(data?.origin || '');
    if (!apiOrigin || apiOrigin !== parsedOrigin(origin)) {
      throw new Error('This sign-in didn’t come from the app’s own address');
    }
    if (opener) {
      // The browser delivers this only if the opener is on the app's origin.
      opener.postMessage({ source: 'lumine-signin', code: data.code, state }, apiOrigin);
      window.close();
      return;
    }
    const target = codeRedirectTarget({
      requestedOrigin: origin,
      apiOrigin: data.origin,
      apiReturnUrl: data.returnUrl
    });
    if (!target) throw new Error('This sign-in didn’t come from the app’s own address');
    target.hash = `lumine_code=${encodeURIComponent(data.code)}&state=${encodeURIComponent(state)}`;
    window.location.assign(target.toString());
  }

  async function allow() {
    setBusy(true);
    setError('');
    try {
      const data = await authorizeAppSignin({ buildId, origin, codeChallenge: challenge, returnUrl });
      deliver(data);
    } catch (e: any) {
      setError(e?.message || 'Something went wrong');
      setBusy(false);
    }
  }

  const host = (() => {
    try {
      return new URL(origin).host;
    } catch {
      return '';
    }
  })();
  return (
    <SignInCardView
      app={app}
      host={host}
      originAllowed={originAllowed}
      error={error}
      userId={userId || null}
      username={username || null}
      busy={busy}
      allow={allow}
      handBack={() => cancel()}
      onOpenSigninModal={() => onOpenSigninModal()}
    />
  );
}
