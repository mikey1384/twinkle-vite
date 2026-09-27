import React, { Suspense, useEffect, useState } from 'react';
import { useAppContext, useKeyContext } from '~/contexts';
import { lazyWithRetry } from '~/helpers/lazyImportHelpers';
import {
  clearSignupInvite,
  getSignupInvite,
  takeMinecraftPassFromUrl
} from '~/helpers/signupPasses';

const LinkModal = lazyWithRetry(() => import('./LinkModal'));

export interface PendingMinecraftLink {
  token: string;
  minecraftName: string;
  inviterName: string;
}

// A Minecraft vouch link (?mcpass=) opened by someone who is already signed
// in, or kept from before they logged in instead of signing up: offer "Link
// <player> to your account" rather than a second account (Mikey, 2026-09-27,
// ruling "A": linking redeems the vouch, no recruiting credit).
export default function MinecraftVouchLink() {
  const userId = useKeyContext((v) => v.myState.userId);
  const sessionLoaded = useAppContext((v) => v.user.state.loaded);
  const getInviteView = useAppContext((v) => v.requestHelpers.getSignupInvite);
  const [pending, setPending] = useState<PendingMinecraftLink | null>(null);
  // the link was opened just now but no longer works: say so once
  const [expiredShown, setExpiredShown] = useState(false);

  useEffect(() => {
    if (!userId || !sessionLoaded) return;
    const fromUrl = takeMinecraftPassFromUrl();
    const stored = getSignupInvite();
    if (stored?.source !== 'minecraft' || !stored.token.startsWith('m_')) {
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { invite, unavailable } = await getInviteView(stored.token);
        if (cancelled) return;
        if (invite?.source === 'minecraft') {
          setPending({
            token: stored.token,
            minecraftName: invite.minecraftName || '',
            inviterName: invite.inviterName || ''
          });
        } else if (!unavailable) {
          // used or expired (for example the player linked in game already)
          clearSignupInvite();
          if (fromUrl) setExpiredShown(true);
        }
      } catch {
        // the Minecraft server may be restarting: the link stays for later
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, sessionLoaded]);

  if (!userId || (!pending && !expiredShown)) return null;
  return (
    <Suspense fallback={null}>
      <LinkModal
        pending={pending}
        onHide={() => {
          // "not now" forgets it here; /twinkle join in game gives a new link
          clearSignupInvite();
          setPending(null);
          setExpiredShown(false);
        }}
      />
    </Suspense>
  );
}
