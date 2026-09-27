import { useEffect } from 'react';
import { socket } from '~/constants/sockets/api';
import { useAppContext, useKeyContext } from '~/contexts';
import { useToast } from '~/contexts/Toast';
import { SITE_NAME } from '~/constants/siteBrand';
import { storeSignupInvite } from '~/helpers/signupPasses';

// Invite passes reach a signed-out visitor two ways (signupPasses.ts): the
// world relay sends one to a guest after 10 minutes in a private room with a
// Twinkle user, and a vouched Minecraft player follows a link with ?mcpass=.
// Either way it's kept here and the sign-up window opens without the question.
export default function useSignupInviteSocket() {
  const userId = useKeyContext((v) => v.myState.userId);
  const onOpenSigninModal = useAppContext(
    (v) => v.user.actions.onOpenSigninModal
  );
  const showToast = useToast();

  useEffect(() => {
    if (userId) return;
    const url = new URL(window.location.href);
    const token = url.searchParams.get('mcpass');
    if (!token || !/^[A-Za-z0-9_-]{20,128}$/.test(token)) return;
    storeSignupInvite({ token: `m_${token}`, source: 'minecraft' });
    // the link is personal: keep it out of the address bar and history
    url.searchParams.delete('mcpass');
    window.history.replaceState(window.history.state, '', url.toString());
    onOpenSigninModal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    function handleInvitePass(pass: {
      token?: string;
      inviterName?: string;
      expiresAt?: number;
    }) {
      if (userId || !pass?.token) return;
      storeSignupInvite({
        token: pass.token,
        inviterName: pass.inviterName,
        expiresAt: pass.expiresAt,
        source: 'guest'
      });
      showToast({
        message: `${pass.inviterName || 'A friend'} invited you to ${SITE_NAME}! Tap here to join. No sign-up question needed.`,
        duration: 15000,
        onClick: () => onOpenSigninModal()
      });
    }
    socket.on('build_app_world_invite_pass', handleInvitePass);
    return () => {
      socket.off('build_app_world_invite_pass', handleInvitePass);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);
}
