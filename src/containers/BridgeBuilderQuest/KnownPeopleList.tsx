import React, { useEffect, useState } from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import ProfilePic from '~/components/ProfilePic';
import { useAppContext } from '~/contexts';
import { Color } from '~/constants/css';

export interface KnownPerson {
  id: number;
  username: string;
  profilePicUrl: string;
  reasons: ('friend' | 'chat' | 'group' | 'comments')[];
  crewStatus: 'ok' | 'member' | 'invited' | 'in_crew';
}

// the strongest suggestions first; the rest are one tap away
const INITIAL_SHOWN = 9;

const REASON_LABELS: Record<KnownPerson['reasons'][number], string> = {
  friend: 'Friend',
  chat: 'You chat',
  group: 'Same group chat',
  comments: 'You talk in comments'
};

const STATUS_LABELS: Partial<Record<KnownPerson['crewStatus'], string>> = {
  member: 'in your crew',
  invited: 'invited',
  in_crew: 'in a crew'
};

// "People you already know on Twinkle": suggestions built by the server from
// the viewer's OWN chats and comment replies (never from who contacted them).
// Used when starting a crew (pick several) and when inviting later (pick one).
export default function KnownPeopleList({
  crewId,
  selectedIds,
  onToggle,
  maxSelected
}: {
  crewId?: number;
  selectedIds: number[];
  onToggle: (person: KnownPerson) => void;
  maxSelected?: number;
}) {
  const loadMeetupKnownPeople = useAppContext(
    (v) => v.requestHelpers.loadMeetupKnownPeople
  );
  const trackMeetupQuestView = useAppContext(
    (v) => v.requestHelpers.trackMeetupQuestView
  );
  const [people, setPeople] = useState<KnownPerson[] | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let active = true;
    loadMeetupKnownPeople(crewId)
      .then((data: { people?: KnownPerson[] }) => {
        if (!active) return;
        const list = Array.isArray(data?.people) ? data.people : [];
        setPeople(list);
        trackMeetupQuestView(list.length ? 'known_people_shown' : 'known_people_empty');
      })
      .catch(() => {
        if (active) setPeople([]);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crewId]);

  if (people === null) return null;
  return (
    <div>
      <div
        className={css`
          font-size: 1.3rem;
          font-weight: bold;
          color: ${Color.darkerGray()};
          margin-bottom: 0.6rem;
        `}
      >
        <Icon icon="user-group" style={{ marginRight: '0.6rem', color: Color.logoBlue() }} />
        People you already know on Twinkle
      </div>
      {people.length === 0 ? (
        <div style={{ fontSize: '1.25rem', color: Color.darkGray() }}>
          Chat with someone or reply to their comments, and they will show up
          here. You can also search by username.
        </div>
      ) : (
        <ul
          className={css`
            list-style: none;
            margin: 0;
            padding: 0;
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(17rem, 1fr));
            gap: 0.6rem;
          `}
        >
          {people
            .filter(
              (person, index) =>
                showAll || index < INITIAL_SHOWN || selectedIds.includes(person.id)
            )
            .map((person) => {
            const selected = selectedIds.includes(person.id);
            const unavailable = person.crewStatus !== 'ok';
            const full =
              !selected && maxSelected !== undefined && selectedIds.length >= maxSelected;
            const disabled = unavailable || full;
            return (
              <li key={person.id}>
                <button
                  type="button"
                  disabled={disabled}
                  aria-pressed={selected}
                  onClick={() => onToggle(person)}
                  className={css`
                    width: 100%;
                    display: flex;
                    align-items: center;
                    gap: 0.8rem;
                    padding: 0.6rem 0.8rem;
                    text-align: left;
                    cursor: ${disabled ? 'default' : 'pointer'};
                    font-family: inherit;
                    border-radius: 1rem;
                    border: 1.5px solid ${selected ? Color.logoBlue() : 'var(--ui-border)'};
                    background: ${selected ? Color.logoBlue(0.08) : '#fff'};
                    opacity: ${disabled ? 0.5 : 1};
                  `}
                >
                  <ProfilePic
                    userId={person.id}
                    profilePicUrl={person.profilePicUrl || undefined}
                    preferProvidedProfilePicUrl
                    size="3rem"
                    style={{ cursor: 'inherit', flex: '0 0 auto' }}
                  />
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span
                      className={css`
                        display: block;
                        font-size: 1.35rem;
                        font-weight: bold;
                        color: ${Color.black()};
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                      `}
                    >
                      {person.username}
                    </span>
                    <span
                      className={css`
                        display: block;
                        font-size: 1.15rem;
                        color: ${Color.darkGray()};
                      `}
                    >
                      {STATUS_LABELS[person.crewStatus] ||
                        REASON_LABELS[person.reasons[0]] ||
                        ''}
                    </span>
                  </span>
                  {selected && <Icon icon="check" style={{ color: Color.logoBlue() }} />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {people.length > INITIAL_SHOWN && (
        <button
          type="button"
          onClick={() => setShowAll((shown) => !shown)}
          className={css`
            margin-top: 0.8rem;
            padding: 0;
            border: 0;
            background: none;
            cursor: pointer;
            font-family: inherit;
            font-size: 1.3rem;
            font-weight: bold;
            color: ${Color.logoBlue()};
          `}
        >
          {showAll ? 'Show fewer' : `Show ${people.length - INITIAL_SHOWN} more`}
        </button>
      )}
    </div>
  );
}
