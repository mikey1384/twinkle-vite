import React, { useEffect, useId, useRef, useState } from 'react';
import Button from '~/components/Button';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import { socket } from '~/constants/sockets/api';
import { useNavigate } from 'react-router-dom';
import ChatPeoplePicker, { ChatInvitePerson } from '../../ChatPeoplePicker';
import useChatDialogRequest from '../../useChatDialogRequest';
import { chatFormActionStyle, chatFormClass } from '../../chatFormStyles';

export default function ClassroomChatForm({ channelId, onBackClick, onHide, onBusyChange }: {
  channelId?: number;
  onBackClick?: () => void;
  onHide: () => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const navigate = useNavigate();
  const createNewChat = useAppContext((v) => v.requestHelpers.createNewChat);
  const onCreateNewChannel = useChatContext((v) => v.actions.onCreateNewChannel);
  const userId = useKeyContext((v) => v.myState.userId);
  const doneColor = useKeyContext((v) => v.theme.done.color);
  const [channelName, setChannelName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<ChatInvitePerson[]>([]);
  const request = useChatDialogRequest(userId + ':' + channelId);
  const committed = useRef<any>(null);
  useEffect(() => {
    committed.current = null;
    setChannelName('');
    setSelectedUsers([]);
  }, [userId, channelId]);
  const nameId = useId();
  const valid = Boolean(channelName.trim()) && channelName.length <= 150 && selectedUsers.length > 0;
  const locked = request.busy || Boolean(committed.current);
  useEffect(() => {
    onBusyChange?.(request.busy);
    return () => onBusyChange?.(false);
  }, [onBusyChange, request.busy]);

  return <section className={chatFormClass}>
    <header><h2>New classroom</h2><p className="description">Give your class a name and choose its first members.</p></header>
    <main>
      <div><label htmlFor={nameId}>Classroom name</label>
        <input id={nameId} type="text" autoFocus maxLength={150} value={channelName} disabled={locked}
          placeholder="Enter your class name" onChange={(event) => setChannelName(event.target.value)} />
        <p className="field-hint">Up to 150 characters. Only you can invite new members.</p>
      </div>
      <ChatPeoplePicker channelId={channelId} selected={selectedUsers} onChange={setSelectedUsers} disabled={locked} />
      {request.error && <p ref={request.errorRef} id={request.errorId} className="error" role="alert">{request.error}</p>}
    </main>
    <footer>
      <Button style={chatFormActionStyle} variant="ghost" uppercase={false} disabled={request.busy} onClick={onBackClick || onHide}>{onBackClick ? 'Back' : 'Cancel'}</Button>
      <Button style={chatFormActionStyle} variant="soft" tone="raised" uppercase={false} color={doneColor}
        disabled={!valid} aria-busy={request.busy} aria-describedby={request.error ? request.errorId : undefined} aria-label={request.busy ? 'Creating classroom' : committed.current ? 'Open created classroom' : 'Create classroom'} onClick={handleDone}>
        {request.busy ? 'Creating…' : committed.current ? 'Open classroom' : 'Create classroom'}
      </Button>
    </footer>
  </section>;

  async function handleDone() {
    if (!valid) return;
    await request.run('Couldn’t finish opening the classroom. Your selections are kept; check your chats before trying again.', async (isCurrent) => {
      if (!committed.current) {
        const response = await createNewChat({
          userId, channelName: channelName.trim(), isClass: true, isClosed: true, selectedUsers
        });
        if (!isCurrent()) return;
        committed.current = { response, hydrated: false, joined: false, invited: false, navigated: false };
      }
      const progress = committed.current;
      const { message, members, pathId, favoriteState } = progress.response;
      if (!progress.hydrated) {
        onCreateNewChannel({ userId, message, isClass: true, isClosed: true, members, pathId, favoriteState });
        progress.hydrated = true;
      }
      if (!progress.joined) {
        socket.emit('join_chat_group', message.channelId);
        progress.joined = true;
      }
      if (!progress.invited) {
        socket.emit('send_group_chat_invitation', selectedUsers.map((user) => user.id), {
          message, isClass: true, isClosed: true, members, pathId
        });
        progress.invited = true;
      }
      if (!progress.navigated) {
        navigate('/chat/' + pathId);
        progress.navigated = true;
      }
      onHide();
    });
  }
}
