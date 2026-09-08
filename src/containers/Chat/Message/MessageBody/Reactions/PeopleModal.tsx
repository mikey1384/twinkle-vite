import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { css } from '@emotion/css';
import Modal from '~/components/Modal';
import ProfilePic from '~/components/ProfilePic';
import ChatReactionEmoji from '~/components/ChatReactionEmoji';
import Icon from '~/components/Icon';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import { getChatReaction } from '~/constants/chatReactions';
import type { ReactionPerson } from './useReactionPeople';

export default function PeopleModal({ reaction, people, loading, failed, onRetry, onHide }: {
  reaction: string;
  people: ReactionPerson[];
  loading: boolean;
  failed: boolean;
  onRetry: () => void;
  onHide: () => void;
}) {
  const viewer = useKeyContext((v) => v.myState);
  const chatStatus = useChatContext((v) => v.state.chatStatus);
  const loadDMChannel = useAppContext((v) => v.requestHelpers.loadDMChannel);
  const onOpenNewChatTab = useChatContext((v) => v.actions.onOpenNewChatTab);
  const onUpdateSelectedChannelId = useChatContext((v) => v.actions.onUpdateSelectedChannelId);
  const navigate = useNavigate();
  const [talkingId, setTalkingId] = useState<number | null>(null);
  const [chatError, setChatError] = useState('');
  const request = useRef(0);
  const busy = useRef(false);
  const closeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    busy.current = false;
    setTalkingId(null);
    setChatError('');
    return () => { request.current += 1; };
  }, [viewer.userId]);
  const label = getChatReaction(reaction)?.label || reaction;

  return (
    <Modal
      modalKey="Chat/Reactions/PeopleModal"
      isOpen
      size="sm"
      aria-label={`People who reacted with ${label.toLowerCase()}`}
      onClose={onHide}
      hasHeader={false}
      showCloseButton={false}
      bodyPadding={0}
    >
      <section className={peopleClass}>
        <header>
          <ChatReactionEmoji reaction={reaction} size={32} />
          <div className="heading"><h2>{label} reactions</h2><p>{people.length} {people.length === 1 ? 'person' : 'people'}</p></div>
          <button ref={closeButton} className="icon-button" aria-label="Close reaction details" onClick={onHide} type="button"><Icon icon="times" /></button>
        </header>
        <p className="hint">Select a profile to learn more, or start a chat.</p>
        {loading && <p className="notice" role="status">Loading people…</p>}
        {failed && <div className="notice error" role="alert"><span>Some profiles couldn’t be loaded.</span><button type="button" onClick={() => { closeButton.current?.focus({ preventScroll: true }); onRetry(); }}>Try again</button></div>}
        {chatError && <p className="notice error" role="alert">{chatError}</p>}
        {!people.length && <p className="notice">No reactions yet.</p>}
        <ul aria-label="People who reacted">
          {people.map((person) => {
            const isYou = person.id === viewer.userId;
            const status = chatStatus[person.id] || {};
            const identity = <><ProfilePic userId={person.id} profilePicUrl={person.profilePicUrl} size={36} statusShown online={status.isOnline || status.isAway || status.isBusy} isAway={status.isAway} isBusy={status.isBusy} /><span className="identity"><strong>{person.username || (loading ? 'Loading profile…' : 'Profile unavailable')}</strong>{isYou && <small>You</small>}{!person.username && !loading && <small>Try loading this profile again</small>}</span></>;
            return <li key={person.id}>
              {person.username ? <Link className="profile" aria-label={`View ${person.username}'s profile`} to={`/users/${person.username}`}>{identity}</Link> : <div className="profile unavailable">{identity}</div>}
              {!!viewer.userId && !isYou && person.username && <button type="button" className="icon-button chat-button" disabled={talkingId !== null} aria-label={talkingId === person.id ? `Opening chat with ${person.username}` : `Chat with ${person.username}`} aria-busy={talkingId === person.id} onClick={() => void handleTalk(person)}><Icon icon={talkingId === person.id ? 'spinner' : 'comments'} pulse={talkingId === person.id} /></button>}
            </li>;
          })}
        </ul>
      </section>
    </Modal>
  );

  async function handleTalk(person: ReactionPerson) {
    if (busy.current || !person.id || !person.username || person.id === viewer.userId) return;
    busy.current = true;
    const version = ++request.current;
    setTalkingId(person.id);
    setChatError('');
    try {
      const { channelId, pathId } = await loadDMChannel({ recipient: person });
      if (request.current !== version) return;
      if (!pathId) {
        onOpenNewChatTab({
          user: { username: viewer.username, id: viewer.userId, profilePicUrl: viewer.profilePicUrl },
          recipient: { username: person.username, id: person.id, profilePicUrl: person.profilePicUrl }
        });
        onUpdateSelectedChannelId(channelId);
      }
      navigate(pathId ? `/chat/${pathId}` : '/chat/new');
      onHide();
    } catch {
      if (request.current === version) setChatError('Couldn’t open that chat. Please try again.');
    } finally {
      if (request.current === version) { busy.current = false; setTalkingId(null); }
    }
  }
}

const peopleClass = css`
  width: 100%;
  height: max-content;
  color: #253247;
  font-size: 14px;
  line-height: 1.5;
  header { display: flex; align-items: center; gap: 12px; padding: 16px 16px 8px; margin: 0; position: sticky; top: 0; background: #fff; z-index: 1; }
  .heading { flex: 1; min-width: 0; }
  h2 { margin: 0; font-size: 18px; font-weight: 700; overflow-wrap: anywhere; }
  .heading p { margin: 0; color: #64748b; font-size: 13px; }
  .hint { margin: 0; padding: 0 16px 12px; color: #64748b; }
  ul { list-style: none; padding: 0 8px 12px; margin: 0; }
  li { display: flex; align-items: center; gap: 8px; padding: 4px 8px; border-radius: 12px; }
  .profile { display: flex; flex: 1; min-width: 0; align-items: center; gap: 12px; min-height: 52px; color: inherit; text-decoration: none; border-radius: 8px; }
  .profile > div { flex-shrink: 0; }
  .identity { min-width: 0; overflow-wrap: anywhere; }
  strong { display: block; font-size: 14px; font-weight: 600; }
  small { display: block; color: #64748b; font-size: 12px; }
  button { font-family: inherit; cursor: pointer; }
  .icon-button { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; width: 44px; height: 44px; border: 1px solid #dce3ed; border-radius: 12px; color: #334155; background: #f4f6fa; font-size: 16px; }
  .chat-button { color: #216642; background: #edf7f0; border-color: #cee7d6; }
  .icon-button:disabled { opacity: 0.55; cursor: wait; }
  a:hover, button:hover:not(:disabled) { background: #eef2f7; }
  a:focus-visible, button:focus-visible { outline: 2px solid #334155; outline-offset: 2px; }
  .notice { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin: 0 16px 12px; padding: 12px; border-radius: 10px; background: #f1f5f9; }
  .error { color: #8b2735; background: #fff1f2; }
  .notice button { min-height: 44px; padding: 8px 12px; border: 1px solid #d5a0a7; border-radius: 8px; background: #fff; color: inherit; font-size: 14px; font-weight: 600; }
`;
