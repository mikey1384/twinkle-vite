import React, { useState } from 'react';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import Icon from '~/components/Icon';
import Modal from '~/components/Modal';
import ProfilePic from '~/components/ProfilePic';
import { useChatContext } from '~/contexts';
import {
  formatBranchSubmitWaitingLine,
  getBranchSubmitOwnerPresence
} from '~/helpers/branchSubmitToOwnerHelpers';
import { timeSince } from '~/helpers/timeStampHelpers';
import BranchSubmitToOwnerPanel from '../BranchSubmitToOwnerPanel';
import useBranchSendToOwner from '../useBranchSendToOwner';

// The contributor's next step, right between Lumine's latest reply and the
// message box: that is where a kid working with Lumine is looking. One strip
// that updates in place (never one button per reply), and it shrinks to a
// single quiet line once the current saved work has been sent.
export default function BranchSendToOwnerStrip({ build }: { build: any }) {
  const { target, sentAt } = useBranchSendToOwner(build);
  const [modalShown, setModalShown] = useState(false);
  const ownerUserId = Number(target?.ownerUserId || 0);
  const ownerChatStatus = useChatContext(
    (v) => v.state.chatStatus[ownerUserId]
  );

  if (!target) return null;
  const ownerName = String(target.ownerUsername || '').trim() || 'the owner';
  const ownerPresence = getBranchSubmitOwnerPresence(ownerChatStatus);

  return (
    <>
      {sentAt ? (
        <div className={sentLineClass} role="status">
          <Icon icon="check" />
          <span>
            {formatBranchSubmitWaitingLine({
              ownerName,
              sentAgo: timeSince(sentAt)
            })}
          </span>
          <button
            type="button"
            className={sentLinkClass}
            onClick={() => setModalShown(true)}
          >
            Send again
          </button>
        </div>
      ) : (
        <div className={stripClass}>
          <span className={stripCopyClass}>
            <Icon icon="sparkles" />
            Your changes are saved
          </span>
          <div className={buttonWrapClass}>
            {ownerUserId ? (
              <div className={buttonAvatarClass} aria-hidden="true">
                <ProfilePic
                  userId={ownerUserId}
                  profilePicUrl={target.ownerProfilePicUrl || undefined}
                  preferProvidedProfilePicUrl
                  online={ownerPresence.isOnline}
                  isAway={ownerPresence.isAway}
                  isBusy={ownerPresence.isBusy}
                  statusShown
                  statusSize="dot"
                  size="2.1rem"
                  style={{ cursor: 'inherit' }}
                />
              </div>
            ) : null}
            <GameCTAButton
              variant="logoBlue"
              size="md"
              shiny
              icon="paper-plane"
              onClick={() => setModalShown(true)}
            >
              Send to {ownerName}
            </GameCTAButton>
          </div>
        </div>
      )}
      {modalShown ? (
        <Modal
          modalKey="BranchSendToOwnerModal"
          isOpen
          onClose={() => setModalShown(false)}
          title={`Send your update to ${ownerName}`}
          size="md"
          footer={
            <Button
              color={sentAt ? 'logoBlue' : undefined}
              variant={sentAt ? undefined : 'ghost'}
              onClick={() => setModalShown(false)}
            >
              {sentAt ? 'Done' : 'Cancel'}
            </Button>
          }
        >
          <BranchSubmitToOwnerPanel
            className={modalPanelClass}
            rootBuildId={target.rootBuildId}
            branchBuildId={target.branchBuildId}
            hasWorkToSend={target.hasWorkToSend}
            revisionHash={target.revisionHash}
            ownerUserId={target.ownerUserId}
            ownerProfilePicUrl={target.ownerProfilePicUrl}
            ownerUsername={target.ownerUsername}
            submittedAt={target.submittedAt}
          />
        </Modal>
      ) : null}
    </>
  );
}

const stripClass = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin: 0 1rem 0.6rem;
  padding: 0.6rem 0.6rem 0.6rem 0.9rem;
  border: 2px solid rgba(65, 140, 235, 0.45);
  border-radius: 12px;
  background: #eff6ff;
`;

const stripCopyClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-width: 0;
  color: #172554;
  font-size: 1.15rem;
  font-weight: 800;
  svg {
    color: #418ceb;
  }
`;

const buttonWrapClass = css`
  position: relative;
  display: inline-flex;
  min-width: 0;
  margin-left: auto;
  > button {
    padding-left: 3.4rem;
  }
`;

const buttonAvatarClass = css`
  position: absolute;
  z-index: 1;
  top: 50%;
  left: 0.6rem;
  width: 2.1rem;
  height: 2.1rem;
  transform: translateY(-50%);
  pointer-events: none;
`;

const sentLineClass = css`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin: 0 1rem 0.5rem;
  color: #0f766e;
  font-size: 1.05rem;
  font-weight: 800;
`;

const sentLinkClass = css`
  margin-left: auto;
  border: none;
  background: none;
  padding: 0;
  color: #418ceb;
  font-size: 1.05rem;
  font-weight: 800;
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;

const modalPanelClass = css`
  width: 100%;
`;
