import React, { useState } from 'react';
import { css } from '@emotion/css';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import { useAppContext, useKeyContext } from '~/contexts';
import { Color, mobileMaxWidth } from '~/constants/css';
import { SITE_NAME } from '~/constants/siteBrand';
import { clearSignupInvite } from '~/helpers/signupPasses';
import type { PendingMinecraftLink } from '.';

type Outcome =
  | { kind: 'linked'; minecraftName: string }
  | { kind: 'linked_elsewhere' | 'invalid' | 'unavailable' };

const headingClass = css`
  margin: 0;
  font-size: 2.4rem;
  font-weight: 700;
  line-height: 1.3;
  color: ${Color.darkerGray()};
  overflow-wrap: anywhere;
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 2rem;
  }
`;
const textClass = css`
  margin: 0;
  font-size: 1.6rem;
  line-height: 1.55;
  color: ${Color.darkGray()};
  overflow-wrap: anywhere;
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.5rem;
  }
`;
const noteClass = css`
  margin: 0;
  font-size: 1.35rem;
  line-height: 1.5;
  color: ${Color.gray()};
`;

// "Link <player> to your account": a signed-in member opened a Minecraft
// vouch link. Linking redeems the vouch (Builder for good at once); nobody
// new joined, so the voucher gets no recruiting credit (Mikey, 2026-09-27).
export default function LinkModal({
  pending,
  onHide
}: {
  pending: PendingMinecraftLink | null;
  onHide: () => void;
}) {
  const username = useKeyContext((v) => v.myState.username);
  const linkMinecraftInvite = useAppContext(
    (v) => v.requestHelpers.linkMinecraftInvite
  );
  const [linking, setLinking] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(
    pending ? null : { kind: 'invalid' }
  );
  const mc = pending?.minecraftName || 'your Minecraft account';
  const offering = !!pending && !outcome;
  const retry = outcome?.kind === 'unavailable';

  return (
    <Modal
      modalKey="MinecraftVouchLink"
      isOpen
      onClose={onHide}
      hasHeader
      title="Minecraft account"
      size="md"
      closeOnBackdropClick={!linking}
      footer={
        offering || retry ? (
          <>
            <Button
              variant="ghost"
              style={{ marginRight: '0.7rem' }}
              disabled={linking}
              onClick={onHide}
            >
              Not now
            </Button>
            <Button color="green" loading={linking} onClick={handleLink}>
              {retry ? 'Try again' : `Link ${mc}`}
            </Button>
          </>
        ) : (
          <Button color="blue" onClick={onHide}>
            {outcome?.kind === 'linked' ? 'Done' : 'OK'}
          </Button>
        )
      }
    >
      <div
        className={css`
          display: flex;
          flex-direction: column;
          gap: 1.4rem;
          width: 100%;
          max-width: 52rem;
          margin: 0 auto;
          padding: 0.5rem 0 1rem;
        `}
      >
        {offering || retry ? (
          <>
            <h2 className={headingClass}>Link {mc} to your account</h2>
            <p className={textClass}>
              {pending?.inviterName || 'A moderator'} vouched for <b>{mc}</b> on
              our Minecraft server.{' '}
              {`You're already on ${SITE_NAME}, so you don't need a second account: link ${mc} to `}
              <b>{username}</b>, and {mc} becomes a Builder for good (creative,
              /fly and WorldEdit).
            </p>
            <p className={noteClass}>
              Only link it if {mc} is your own Minecraft account. You can unlink
              it later in the Twinkle Minecraft Live app.
            </p>
            {retry && (
              <p
                className={css`
                  ${noteClass};
                  color: ${Color.rose()};
                `}
              >
                Couldn't reach the Minecraft server. Try again in a minute.
              </p>
            )}
          </>
        ) : outcome?.kind === 'linked' ? (
          <>
            <h2 className={headingClass}>Linked!</h2>
            <p className={textClass}>
              <b>{outcome.minecraftName || mc}</b> is now linked to{' '}
              <b>{username}</b> and is a Builder for good. If you're in the
              game, you'll see it there too.
            </p>
          </>
        ) : outcome?.kind === 'linked_elsewhere' ? (
          <>
            <h2 className={headingClass}>Linked to another account</h2>
            <p className={textClass}>
              {mc} is already linked to a different {SITE_NAME} account. Sign in
              to that account instead, or unlink {mc} there first.
            </p>
          </>
        ) : (
          <>
            <h2 className={headingClass}>This link no longer works</h2>
            <p className={textClass}>
              It was already used, or it expired. In Minecraft, type{' '}
              <b>/twinkle join</b> for a fresh link, or <b>/link</b> for the
              steps to link your account.
            </p>
          </>
        )}
      </div>
    </Modal>
  );

  async function handleLink() {
    if (!pending || linking) return;
    setLinking(true);
    try {
      const result = await linkMinecraftInvite(pending.token);
      if (result?.linked) {
        clearSignupInvite();
        setOutcome({ kind: 'linked', minecraftName: result.minecraftName });
      } else {
        const reason = result?.reason || 'unavailable';
        if (reason !== 'unavailable') clearSignupInvite();
        setOutcome({ kind: reason });
      }
    } catch {
      setOutcome({ kind: 'unavailable' });
    } finally {
      setLinking(false);
    }
  }
}
