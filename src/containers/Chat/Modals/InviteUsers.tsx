import React, { useEffect, useRef, useState } from 'react';
import ModalFooter from '~/components/Modal/Footer';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import { normalizeClassInviteResponse } from '~/helpers/chatGroupMembership';
import ChatPeoplePicker, { ChatInvitePerson } from './ChatPeoplePicker';
import useChatDialogRequest from './useChatDialogRequest';
import { chatFormClass, chatFormModalClass } from './chatFormStyles';

export default function InviteUsersModal({ isOwner, selectedChannelId, onDone, onHide, currentChannel }: {
  isOwner: boolean;
  currentChannel: any;
  onDone: (data: any) => void | Promise<void>;
  onHide: () => void;
  selectedChannelId: number;
}) {
  const userId = useKeyContext((v) => v.myState.userId);
  const doneColor = useKeyContext((v) => v.theme.done.color);
  const inviteUsersToChannel = useAppContext((v) => v.requestHelpers.inviteUsersToChannel);
  const onInviteUsersToChannel = useChatContext((v) => v.actions.onInviteUsersToChannel);
  const [selectedUsers, setSelectedUsers] = useState<ChatInvitePerson[]>([]);
  const request = useChatDialogRequest(userId + ':' + selectedChannelId);
  const committed = useRef<any>(null);
  const membersApplied = useRef(false);
  const locked = request.busy || Boolean(committed.current);
  useEffect(() => {
    setSelectedUsers([]);
    committed.current = null;
    membersApplied.current = false;
  }, [userId, selectedChannelId]);

  return <Modal modalKey="InviteUsers" isOpen aria-label="Invite people to this channel"
    className={chatFormModalClass} showCloseButton={!request.busy}
    onClose={() => { if (!request.pending.current) onHide(); }}
    closeOnEscape={!request.busy} closeOnBackdropClick={!request.busy} hasHeader={false} bodyPadding={0}>
    <section className={chatFormClass}>
      <header><h2>Invite people</h2><p className="description">{currentChannel?.isClass && isOwner
        ? 'Choose the people to add to your classroom.'
        : 'Choose who you’d like to join the conversation.'}</p></header>
      <main>
        <ChatPeoplePicker autoFocus key={userId + ':' + selectedChannelId} channelId={selectedChannelId} selected={selectedUsers}
          onChange={setSelectedUsers} disabled={locked} excludedIds={currentChannel?.allMemberIds || []} />
        {request.error && <p ref={request.errorRef} id={request.errorId} className="error" role="alert">{request.error}</p>}
      </main>
      <ModalFooter>
        <Button variant="ghost" disabled={request.busy} onClick={onHide}>Cancel</Button>
        <Button color={doneColor}
          disabled={!selectedUsers.length} aria-busy={request.busy} aria-describedby={request.error ? request.errorId : undefined} aria-label={request.busy ? 'Inviting people' : 'Invite selected people'}
          onClick={handleDone}>{request.busy ? 'Inviting…' : committed.current ? 'Finish' : 'Invite people'}</Button>
      </ModalFooter>
    </section>
  </Modal>;

  async function handleDone() {
    if (!selectedUsers.length) return;
    await request.run('Couldn’t finish inviting these people. Your selection is kept. Please try again.', async (isCurrent) => {
      if (currentChannel?.isClass && isOwner) {
        if (!committed.current) {
          const response = await inviteUsersToChannel({ selectedUsers, channelId: selectedChannelId });
          if (!isCurrent()) return;
          committed.current = normalizeClassInviteResponse({ response, requestedMembers: selectedUsers });
        }
        const transition = committed.current;
        if (!membersApplied.current && transition.changed && transition.message) {
          onInviteUsersToChannel({ selectedUsers: transition.newMembers, message: transition.message });
          membersApplied.current = true;
        }
        await onDone({
          users: transition.newMembers, message: transition.message, isClass: true,
          relayLegacyMembership: transition.relayLegacyMembership, canApply: isCurrent
        });
      } else {
        await onDone({ users: selectedUsers, canApply: isCurrent });
      }
    });
  }
}
