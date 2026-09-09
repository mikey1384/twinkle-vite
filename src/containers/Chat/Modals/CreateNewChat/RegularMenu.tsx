import React, { useId, useState } from 'react';
import ModalFooter from '~/components/Modal/Footer';
import Button from '~/components/Button';
import { useKeyContext } from '~/contexts';
import useChatDialogRequest from '../useChatDialogRequest';
import { chatFormClass } from '../chatFormStyles';

export default function RegularMenu({ creatingChat, onBackClick, onHide, onDone }: {
  creatingChat: boolean;
  onBackClick?: () => void;
  onHide: () => void;
  onDone: (value: any) => void | Promise<void>;
}) {
  const userId = useKeyContext((v) => v.myState.userId);
  const doneColor = useKeyContext((v) => v.theme.done.color);
  const [channelName, setChannelName] = useState('');
  const [isClosed, setIsClosed] = useState(false);
  const request = useChatDialogRequest(userId);
  const nameId = useId();
  const busy = creatingChat || request.busy;
  const valid = Boolean(channelName.trim()) && channelName.length <= 150;

  return <section className={chatFormClass}>
    <header><h2>New group</h2><p className="description">Make room for a conversation. Invite people after creating your group.</p></header>
    <main>
      <div><label htmlFor={nameId}>Group name</label>
        <input id={nameId} type="text" autoFocus maxLength={150} value={channelName} disabled={busy}
          placeholder="Give your group a name" onChange={(event) => setChannelName(event.target.value)}
          aria-describedby={nameId + '-hint'} />
        <p id={nameId + '-hint'} className="field-hint">Up to 150 characters.</p>
      </div>
      <div className="setting"><label><input type="checkbox" role="switch" checked={!isClosed} disabled={busy}
        onChange={(event) => setIsClosed(!event.target.checked)} /><span>Anyone can invite new members</span></label>
        <p className="field-hint">You can change this later in group settings.</p>
      </div>
      {request.error && <p ref={request.errorRef} id={request.errorId} className="error" role="alert">{request.error}</p>}
    </main>
    <ModalFooter>
      <Button variant="ghost" disabled={busy} onClick={onBackClick || onHide}>{onBackClick ? 'Back' : 'Cancel'}</Button>
      <Button color={doneColor}
        disabled={!valid} aria-busy={busy} aria-describedby={request.error ? request.errorId : undefined} aria-label={busy ? 'Creating group' : 'Create group'} onClick={handleDone}>{busy ? 'Creating…' : 'Create group'}</Button>
    </ModalFooter>
  </section>;

  async function handleDone() {
    if (!valid || creatingChat) return;
    await request.run('Couldn’t create the group. Check your chats before trying again.', async (isCurrent) => {
      await onDone({ userId, channelName: channelName.trim(), isClosed, canApply: isCurrent });
    });
  }
}
