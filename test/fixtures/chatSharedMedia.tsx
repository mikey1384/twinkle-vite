import React, { useState } from 'react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faTimes,
  faSpinner,
  faImages,
  faImage,
  faFileAlt,
  faFolderOpen,
  faChevronRight,
  faDownload,
  faComment,
  faPlay,
  faFilm,
  faMusic,
  faPencilAlt
} from '@fortawesome/pro-solid-svg-icons';
import SharedMedia from '../../src/containers/Chat/SharedMedia';
import ChatPinsProvider from '../../src/containers/Chat/Pins';
import { useChatPins } from '../../src/containers/Chat/Pins/context';
import Layout from '../../src/containers/Chat/LeftMenu/Layout';
import {
  chatWorkspaceClass,
  chatPanelClass
} from '../../src/containers/Chat/containers';
library.add(
  faTimes,
  faSpinner,
  faImages,
  faImage,
  faFileAlt,
  faFolderOpen,
  faChevronRight,
  faDownload,
  faComment,
  faPlay,
  faFilm,
  faMusic,
  faPencilAlt
);
const w = window as any;
w.events = new Map();
w.emit = (name: string, data: any) => {
  for (const fn of w.events.get(name) || []) fn(data);
};
w.requestsLog = [];
w.historyRequests = [];
w.deleted = new Set();
w.pendingReads = [];
w.pendingItems = [];
function artwork(n: number) {
  const colors = [
    ['#c8e5e2', '#38797b', '#285f61'],
    ['#f6e6cb', '#de9b64', '#a96c50'],
    ['#dde1f3', '#7888ae', '#465e86']
  ][n % 3];
  return (
    'data:image/svg+xml;charset=utf-8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="460" viewBox="0 0 600 460"><rect width="600" height="460" fill="${colors[0]}"/><circle cx="440" cy="110" r="51" fill="#fff8e9"/><path d="M0 360 175 130 390 460H0" fill="${colors[1]}"/><path d="M200 460 416 215 600 370V460" fill="${colors[2]}"/><path d="M0 395Q130 360 300 410T600 395V460H0" fill="#fff8e9" opacity=".5"/></svg>`
    )
  );
}
w.rows = Array.from({ length: 33 }, (_, i) => ({
  id: 100 - i,
  channelId: 11,
  topicId: i % 2 ? 22 : 23,
  subchannelId: 0,
  subchannelPath: '',
  userId: 101,
  username: ['Gadget', 'mikey', 'Cloudstar'][i % 3],
  timeStamp: 1793090000 - i * 86400,
  name: [
    'Mountain study.png',
    'Weekend walk.png',
    'Forest palette.png',
    'Club project notes.pdf',
    'First animation.mp4',
    'A very long file name with notes for our next community project and feedback from everyone.pdf'
  ][i % 6],
  fileType:
    i % 6 === 4 ? 'video' : i % 6 === 3 || i % 6 === 5 ? 'file' : 'image',
  size: 128000 + i * 9023,
  topicTitle: i % 2 ? 'Our projects' : 'Weekend photos',
  url: artwork(i),
  thumbUrl: i % 6 < 3 || i % 6 === 4 ? artwork(i) : ''
}));
const snapshot = (input: any) => {
  let rows = w.rows.filter(
    (r: any) =>
      r.channelId === input.channelId &&
      !w.deleted.has(r.id) &&
      (!input.beforeId || r.id < input.beforeId) &&
      (!input.topicId || r.topicId === input.topicId)
  );
  if (input.kind && input.kind !== 'all')
    rows = rows.filter((r: any) =>
      input.kind === 'media'
        ? ['image', 'video'].includes(r.fileType)
        : !['image', 'video'].includes(r.fileType)
    );
  return structuredClone({
    items: rows.slice(0, 24),
    nextCursor: rows.length > 24 ? rows[23].id : null
  });
};
w.requests = {
  loadChatSharedMedia: async (input: any) => {
    w.requestsLog.push(input);
    if (w.failLoad) throw new Error('Network unavailable');
    if (w.sparse && !input.beforeId) return { items: [], nextCursor: 101 };
    const result = snapshot(input);
    if (w.deferLoads)
      return new Promise((resolve) =>
        w.pendingReads.push(() => resolve(result))
      );
    return result;
  },
  loadChatSharedMediaItem: async (input: any) => {
    w.itemInput = input;
    const row = w.rows.find(
      (r: any) =>
        r.id === input.messageId &&
        r.channelId === input.channelId &&
        !w.deleted.has(r.id)
    );
    if (!row) throw new Error('Gone');
    const result = structuredClone({
      ...row,
      downloadUrl: 'data:application/octet-stream,fixture-download'
    });
    if (w.deferItem)
      return new Promise((resolve) =>
        w.pendingItems.push(() => resolve(result))
      );
    return result;
  },
  loadChatPins: async (scope: any) => ({
    ...scope,
    pins: [],
    pinnedMessageIds: [],
    revision: 1,
    total: 0,
    nextCursor: null
  }),
  loadChatPinContext: async (input: any) => {
    w.historyRequests.push(input);
    return {
      messageId: input.messageId,
      messages: [
        {
          id: input.cursor ? input.cursor - 1 : input.messageId,
          content: 'The original message with this attachment.'
        }
      ],
      hasOlder: true,
      hasNewer: false
    };
  },
  loadChatMessage: async ({ messageId }: any) => ({
    id: messageId,
    attachmentHidden: 1
  }),
  uploadFile: async () => {},
  saveFileData: async () => {},
  replaceSubjectAttachment: async () => {},
  replaceCommentAttachment: async () => {}
};
function Conversation() {
  const pins = useChatPins();
  return (
    <section
      className={chatPanelClass + ' fixture-conversation'}
      data-chat-panel="conversation"
    >
      <header>
        <strong>Our creative corner</strong>
        <span>All messages · 12 members</span>
      </header>
      <div className="fixture-messages">
        {pins?.history ? (
          <>
            <button onClick={pins.leaveHistory}>Back to latest</button>
            <p data-history>
              Original attachment message #{pins.history.messageId}
            </p>
            <button onClick={() => pins.loadHistory('older')}>
              Older messages
            </button>
          </>
        ) : (
          <>
            <div className="fixture-date">Today</div>
            <article>
              <b>
                Gadget <small>12:10 PM</small>
              </b>
              <p>
                Can we have a place to see the photos and files we’ve shared
                here?
              </p>
            </article>
            <article>
              <b>
                mikey <small>12:18 PM</small>
              </b>
              <p>
                Yes — look under our topics. Everything we’ve shared has a home
                now.
              </p>
              <img src={artwork(0)} alt="Sample mountain illustration" />
            </article>
            <article>
              <b>
                Cloudstar <small>12:24 PM</small>
              </b>
              <p>Found the project notes! 📎</p>
            </article>
          </>
        )}
      </div>
      <footer>
        <textarea aria-label="Message draft" placeholder="Enter a message…" />
      </footer>
    </section>
  );
}
function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const routedTopicId = Number(
    location.pathname.match(/\/topic\/(\d+)/)?.[1] || 0
  );
  const routedTopicTitle =
    routedTopicId === 23 ? 'Weekend photos' : 'Our projects';
  w.currentTopic = routedTopicId;
  const [dm, setDm] = useState(false);
  const [channel, setChannel] = useState(11);
  w.changeChannel = setChannel;
  return (
    <>
      <div className="fixture-bar">
        <strong>
          Twinkle <span>Shared chat media · layout preview</span>
        </strong>
        <div>
          <button
            aria-pressed={!dm}
            onClick={() => {
              setDm(false);
              navigate('/chat/creative/topic/22');
            }}
          >
            Group chat
          </button>
          <button
            aria-pressed={dm}
            onClick={() => {
              setDm(true);
              navigate('/chat/creative');
            }}
          >
            Direct message
          </button>
        </div>
        <small>Sample attachments · nothing is sent</small>
      </div>
      <ChatPinsProvider
        channelId={channel}
        topicId={dm ? 0 : routedTopicId}
        subchannelId={0}
      >
        <main data-chat-workspace className={chatWorkspaceClass}>
          <Layout
            controls={
              <div className="fixture-controls">
                <button>＋ New Group</button>
                <div className="fixture-avatars">🌼　🎨　🌿</div>
              </div>
            }
            filters={<div className="fixture-search">⌕ Search chats…</div>}
            channelNavigation={
              <>
                {!dm && (
                  <div className="fixture-topics">
                    <h3>Topics</h3>
                    <button>⌂ All messages</button>
                    <button className="active">Our projects</button>
                    <button>Weekend photos</button>
                    <button>Ideas & inspiration</button>
                    <button>＋ Manage topics</button>
                  </div>
                )}
                <SharedMedia
                  key={channel}
                  channelId={channel}
                  channelPath="creative"
                  channelName={dm ? 'Gadget' : 'Our creative corner'}
                  currentTopic={
                    dm || !routedTopicId
                      ? undefined
                      : { id: routedTopicId, title: routedTopicTitle }
                  }
                />
              </>
            }
            channels={
              <div className="fixture-chats">
                <button>
                  Ciel<small>Your companion</small>
                </button>
                <button className={!dm ? 'active' : ''}>
                  Our creative corner<small>Found the project notes! 📎</small>
                </button>
                <button className={dm ? 'active' : ''}>
                  Gadget<small>Thanks for sharing!</small>
                </button>
                <button>
                  Suggestions<small>What should we make next?</small>
                </button>
                <button>
                  Grammarbles Club<small>New level unlocked</small>
                </button>
              </div>
            }
          />
          <Conversation />
          <aside
            data-chat-panel="details"
            className={chatPanelClass + ' fixture-members'}
          >
            <strong>In this chat</strong>
            <p>🌼 Gadget</p>
            <p>🎨 mikey</p>
            <p>🌿 Cloudstar</p>
          </aside>
        </main>
      </ChatPinsProvider>
    </>
  );
}
createRoot(document.getElementById('root')!).render(
  <MemoryRouter initialEntries={['/chat/creative/topic/22']}>
    <App />
  </MemoryRouter>
);
