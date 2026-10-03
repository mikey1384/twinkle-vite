import React, { useState } from 'react';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import { useAppContext } from '~/contexts';
import { Color } from '~/constants/css';
import { QuestNote } from '../StepCard';
import type { CrewView } from '../types';

// Staff only (admins and headmasters; the server never sends this to members):
// every parent's answer, offers and contact for one crew, and the reply box for
// a parent's question.
type Contact = NonNullable<CrewView['parentContacts']>[number];

export default function ParentContactsAdmin({
  crewId,
  contacts,
  onChanged
}: {
  crewId: number;
  contacts: Contact[];
  // refresh the page's data; without it the page reloads
  onChanged?: () => Promise<void> | void;
}) {
  const replyToMeetupParent = useAppContext((v) => v.requestHelpers.replyToMeetupParent);
  const [replyText, setReplyText] = useState<Record<number, string>>({});
  const [busyId, setBusyId] = useState(0);
  const [error, setError] = useState('');
  if (!contacts.length) return null;
  return (
    <div
      className={css`
        padding: 1.2rem 1.4rem;
        border-radius: 1rem;
        border: 1px dashed ${Color.darkGray()};
        background: ${Color.extraLightGray(0.5)};
        font-size: 1.35rem;
      `}
    >
      <b>Parents (staff only)</b>
      <ul style={{ margin: '0.6rem 0 0', paddingLeft: '1.8rem' }}>
        {contacts.map((parent) => {
          return (
            <li key={parent.userId} style={{ marginBottom: '0.6rem' }}>
              <b>{parent.childUsername}</b>&apos;s parent · {parent.status} ·{' '}
              <span style={{ color: Color.darkGray() }}>
                {parent.verifiedGuardian ? 'guardian on file' : 'address typed by the child'}
              </span>
              <div>
                {parent.email}
                {parent.sharesWithParents ? ' · shared with the other parents' : ''}
              </div>
              {(parent.willingGuardian || parent.offersPlace) && (
                <div style={{ color: Color.green(), fontWeight: 700 }}>
                  Offers:{' '}
                  {[
                    parent.willingGuardian ? 'to be a guardian' : '',
                    parent.offersPlace ? 'their home as the place' : ''
                  ]
                    .filter(Boolean)
                    .join(' and ')}
                </div>
              )}
              {parent.question && <div>Asks: &quot;{parent.question}&quot;</div>}
              {parent.status === 'question' && parent.staffReply && (
                <div style={{ color: Color.green(), fontWeight: 700 }}>
                  You replied: &quot;{parent.staffReply}&quot; (shown on their page; the email follows your email review)
                </div>
              )}
              {parent.status === 'question' && !parent.staffReply && (
                <div style={{ marginTop: '0.4rem' }}>
                  <textarea
                    aria-label={`Reply to ${parent.childUsername}'s parent`}
                    value={replyText[parent.userId] || ''}
                    maxLength={1000}
                    rows={2}
                    placeholder="Your answer. The parent sees it on their page and gets an email."
                    onChange={(e) =>
                      setReplyText((v) => ({ ...v, [parent.userId]: e.target.value }))
                    }
                    style={{ width: '100%', padding: '0.6rem', fontSize: '1.3rem' }}
                  />
                  <Button
                    size="sm"
                    color="logoBlue"
                    loading={busyId === parent.userId}
                    disabled={!!busyId || !(replyText[parent.userId] || '').trim()}
                    style={{ marginTop: '0.4rem' }}
                    onClick={async () => {
                      setBusyId(parent.userId);
                      setError('');
                      try {
                        await replyToMeetupParent({
                          crewId,
                          userId: parent.userId,
                          reply: replyText[parent.userId].trim()
                        });
                        if (onChanged) await onChanged();
                        else window.location.reload();
                      } catch (err: any) {
                        setError(err?.message || 'Could not send the reply.');
                      } finally {
                        setBusyId(0);
                      }
                    }}
                  >
                    Reply to parent
                  </Button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {error && <QuestNote tone="warning">{error}</QuestNote>}
    </div>
  );
}
