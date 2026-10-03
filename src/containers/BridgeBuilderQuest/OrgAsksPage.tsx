import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import ErrorBoundary from '~/components/ErrorBoundary';
import HomeLoginPrompt from '~/components/HomeLoginPrompt';
import Icon from '~/components/Icon';
import Loading from '~/components/Loading';
import { useAppContext, useKeyContext } from '~/contexts';
import { Color } from '~/constants/css';
import { QuestNote } from './StepCard';
import { backLinkClass } from './pageStyles';

// /achievements/bridge-builder/org-asks (owner only): the things only the
// Twinkle organization can decide, each as a short business case. The owner
// picks some, opens a pre-filled email draft in his own mail app and sends it
// himself; nothing is sent from Twinkle.
type Status = 'open' | 'emailed' | 'discussing' | 'approved' | 'declined';
interface Ask {
  slug: string;
  title: string;
  summary: string;
  ask: string;
  why: string;
  cost: string;
  ourSide: string;
  ifNo: string;
  status: Status;
  note: string;
  emailedAt: number;
}

const STATUS_LABEL: Record<Status, string> = {
  open: 'Not sent',
  emailed: 'Email opened',
  discussing: 'Discussing',
  approved: 'Approved',
  declined: 'Declined'
};
const STATUS_COLOR: Record<Status, string> = {
  open: Color.darkGray(),
  emailed: Color.logoBlue(),
  discussing: Color.orange(),
  approved: Color.green(),
  declined: Color.red()
};

export default function OrgAsksPage() {
  const userId = useKeyContext((v) => v.myState.userId);
  const loadMeetupOrgAsks = useAppContext((v) => v.requestHelpers.loadMeetupOrgAsks);
  const setMeetupOrgAskStatus = useAppContext((v) => v.requestHelpers.setMeetupOrgAskStatus);
  const saveMeetupOrgRecipient = useAppContext((v) => v.requestHelpers.saveMeetupOrgRecipient);
  const composeMeetupOrgEmail = useAppContext((v) => v.requestHelpers.composeMeetupOrgEmail);
  const loadFriendsSwitch = useAppContext((v) => v.requestHelpers.loadFriendsSwitch);
  const setFriendsSwitch = useAppContext((v) => v.requestHelpers.setFriendsSwitch);
  const [friendsOn, setFriendsOn] = useState<boolean | null>(null);
  const [asks, setAsks] = useState<Ask[] | null>(null);
  const [recipient, setRecipient] = useState('');
  const [recipientDraft, setRecipientDraft] = useState('');
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<string>('');
  const [editingTo, setEditingTo] = useState(false);

  function apply(data: { asks: Ask[]; recipient: string }) {
    setAsks(data.asks);
    setRecipient(data.recipient);
    setRecipientDraft(data.recipient);
  }

  useEffect(() => {
    if (!userId) return;
    loadFriendsSwitch()
      .then((data: { on: boolean }) => setFriendsOn(!!data?.on))
      .catch(() => null);
    loadMeetupOrgAsks()
      .then((data: any) => {
        apply(data);
      })
      .catch((err: any) => setError(err?.message || 'Could not load.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const pickedList = useMemo(
    () => (asks || []).filter((a) => picked.has(a.slug)).map((a) => a.slug),
    [asks, picked]
  );

  async function run<T>(work: () => Promise<T>) {
    setBusy(true);
    setError('');
    try {
      return await work();
    } catch (err: any) {
      setError(err?.message || 'Something went wrong.');
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function composeDraft() {
    const result: any = await run(() => composeMeetupOrgEmail(pickedList));
    return result?.draft as { to: string; subject: string; body: string } | undefined;
  }

  async function openDraft() {
    const draft = await composeDraft();
    if (!draft) return;
    const url =
      'https://mail.google.com/mail/?view=cm&fs=1' +
      `&to=${encodeURIComponent(draft.to)}` +
      `&su=${encodeURIComponent(draft.subject)}` +
      `&body=${encodeURIComponent(draft.body)}`;
    window.open(url, '_blank', 'noopener');
    for (const slug of pickedList) {
      const ask = asks?.find((a) => a.slug === slug);
      if (ask?.status === 'open') {
        const data = await run(() => setMeetupOrgAskStatus({ slug, status: 'emailed' }));
        if (data) apply(data as any);
      }
    }
  }

  async function copyDraft() {
    const draft = await composeDraft();
    if (!draft) return;
    try {
      await navigator.clipboard.writeText(
        `To: ${draft.to || '(add address)'}\nSubject: ${draft.subject}\n\n${draft.body}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError('Could not copy. Use "Open email draft" instead.');
    }
  }

  if (!userId) return <HomeLoginPrompt />;
  const showToInput = editingTo || !recipient;
  const detail: [string, keyof Ask][] = [
    ['What we need', 'ask'],
    ['Why it is worth it', 'why'],
    ['Cost to the organization', 'cost'],
    ['What we handle', 'ourSide'],
    ['If the answer is no', 'ifNo']
  ];
  return (
    <ErrorBoundary componentPath="BridgeBuilderQuest/OrgAsksPage">
      <div
        className={css`
          width: 100%;
          max-width: 760px;
          margin: 0 auto;
          padding: 1.6rem 16px 14rem;
          font-size: 1.5rem;
          color: ${Color.darkerGray()};
        `}
      >
        <Link to="/achievements/bridge-builder" className={backLinkClass}>
          <Icon icon="arrow-left" /> Bridge Builder
        </Link>
        <h2 style={{ margin: '1.2rem 0 0.4rem', fontSize: '2.4rem', color: Color.black() }}>
          Ask the organization
        </h2>
        <p style={{ margin: 0, color: Color.gray() }}>
          The ticked ones need the organization. The optional ones default to you; tick any
          to raise anyway.
        </p>
        {friendsOn !== null && (
          <label
            className={css`
              display: flex;
              gap: 0.8rem;
              align-items: center;
              margin-top: 1.2rem;
              font-weight: 700;
            `}
          >
            <input
              type="checkbox"
              checked={friendsOn}
              onChange={(e) => {
                const next = e.target.checked;
                setFriendsOn(next);
                setFriendsSwitch(next).catch(() => setFriendsOn(!next));
              }}
              style={{ width: '2rem', height: '2rem' }}
            />
            Friend buttons on profiles
            <span style={{ fontWeight: 400, color: Color.gray() }}>
              ({friendsOn ? 'on' : 'off: nobody sees them'})
            </span>
          </label>
        )}
        {error && (
          <div style={{ marginTop: '1.2rem' }}>
            <QuestNote tone="warning">{error}</QuestNote>
          </div>
        )}
        {!asks && !error && <Loading />}
        {asks && (
          <>
            <ul
              className={css`
                list-style: none;
                margin: 2rem 0 0;
                padding: 0;
                display: flex;
                flex-direction: column;
                gap: 0.8rem;
              `}
            >
              {asks.map((ask) => {
                const isOpen = open === ask.slug;
                return (
                  <li
                    key={ask.slug}
                    className={css`
                      border: 1px solid var(--ui-border);
                      border-radius: 1.2rem;
                      background: #fff;
                      overflow: hidden;
                    `}
                  >
                    <div
                      className={css`
                        display: flex;
                        align-items: center;
                        gap: 1.2rem;
                        padding: 1.2rem 1.4rem;
                      `}
                    >
                      <input
                        type="checkbox"
                        aria-label={`Include "${ask.title}" in the email`}
                        checked={picked.has(ask.slug)}
                        onChange={(e) => {
                          const next = new Set(picked);
                          if (e.target.checked) next.add(ask.slug);
                          else next.delete(ask.slug);
                          setPicked(next);
                        }}
                        style={{ width: '2rem', height: '2rem', flexShrink: 0 }}
                      />
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        onClick={() => setOpen(isOpen ? '' : ask.slug)}
                        className={css`
                          flex: 1;
                          min-width: 0;
                          text-align: left;
                          background: none;
                          border: 0;
                          padding: 0;
                          cursor: pointer;
                          color: inherit;
                          font: inherit;
                        `}
                      >
                        <div style={{ fontWeight: 700, color: Color.black() }}>
                          {ask.title}
                        </div>
                        <div style={{ fontSize: '1.35rem', color: Color.gray(), marginTop: '0.2rem' }}>
                          {ask.summary}
                        </div>
                      </button>
                      <select
                        aria-label={`Status of "${ask.title}"`}
                        value={ask.status}
                        disabled={busy}
                        onChange={async (e) => {
                          const data = await run(() =>
                            setMeetupOrgAskStatus({ slug: ask.slug, status: e.target.value })
                          );
                          if (data) apply(data as any);
                        }}
                        className={css`
                          flex-shrink: 0;
                          padding: 0.4rem 0.6rem;
                          font-size: 1.3rem;
                          font-weight: 700;
                          border-radius: 999px;
                          border: 1px solid ${STATUS_COLOR[ask.status]};
                          background: #fff;
                          color: ${STATUS_COLOR[ask.status]};
                        `}
                      >
                        {(Object.keys(STATUS_LABEL) as Status[]).map((st) => (
                          <option key={st} value={st}>
                            {STATUS_LABEL[st]}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        aria-label={isOpen ? 'Hide the case' : 'Show the case'}
                        onClick={() => setOpen(isOpen ? '' : ask.slug)}
                        className={css`
                          background: none;
                          border: 0;
                          cursor: pointer;
                          color: ${Color.gray()};
                          padding: 0.4rem;
                        `}
                      >
                        <Icon icon={isOpen ? 'chevron-up' : 'chevron-down'} />
                      </button>
                    </div>
                    {isOpen && (
                      <dl
                        className={css`
                          margin: 0;
                          padding: 0.4rem 1.4rem 1.6rem 4.6rem;
                          font-size: 1.4rem;
                          line-height: 1.55;
                          dt {
                            font-weight: 700;
                            margin-top: 1rem;
                            color: ${Color.black()};
                          }
                          dd {
                            margin: 0.1rem 0 0;
                          }
                        `}
                      >
                        {detail.map(([label, key]) => (
                          <React.Fragment key={key}>
                            <dt>{label}</dt>
                            <dd>{String(ask[key])}</dd>
                          </React.Fragment>
                        ))}
                      </dl>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
      {asks && (
        <div
          className={css`
            position: fixed;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 10;
            background: #fff;
            border-top: 1px solid var(--ui-border);
            padding: 1rem 16px;
          `}
        >
          <div
            className={css`
              max-width: 760px;
              margin: 0 auto;
              display: flex;
              gap: 0.8rem;
              align-items: center;
              flex-wrap: wrap;
            `}
          >
            <div style={{ flex: 1, minWidth: '16rem', fontSize: '1.4rem' }}>
              {showToInput ? (
                <span style={{ display: 'flex', gap: '0.6rem' }}>
                  <input
                    type="email"
                    aria-label="Email address to send to"
                    value={recipientDraft}
                    placeholder="Andrew's email"
                    onChange={(e) => setRecipientDraft(e.target.value)}
                    style={{ flex: 1, minWidth: 0, padding: '0.6rem 0.9rem', fontSize: '1.4rem' }}
                  />
                  <Button
                    color="darkerGray"
                    disabled={busy || recipientDraft.trim() === recipient}
                    onClick={async () => {
                      const data = await run(() => saveMeetupOrgRecipient(recipientDraft.trim()));
                      if (data) {
                        apply(data as any);
                        setEditingTo(false);
                      }
                    }}
                  >
                    Save
                  </Button>
                </span>
              ) : (
                <span>
                  To <b>{recipient}</b>{' '}
                  <button
                    type="button"
                    onClick={() => setEditingTo(true)}
                    style={{ background: 'none', border: 0, color: Color.logoBlue(), cursor: 'pointer', font: 'inherit' }}
                  >
                    change
                  </button>
                </span>
              )}
            </div>
            <Button color="darkerGray" disabled={busy || !pickedList.length} onClick={copyDraft}>
              {copied ? 'Copied' : 'Copy'}
            </Button>
            <Button
              color="logoBlue"
              variant="solid"
              disabled={busy || !pickedList.length}
              onClick={openDraft}
            >
              <Icon icon="envelope" />
              <span style={{ marginLeft: '0.6rem' }}>
                Open email draft{pickedList.length ? ` (${pickedList.length})` : ''}
              </span>
            </Button>
          </div>
        </div>
      )}
    </ErrorBoundary>
  );
}
