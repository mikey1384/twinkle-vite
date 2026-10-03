import React, { useEffect, useState } from 'react';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import SwitchButton from '~/components/Buttons/SwitchButton';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import { useAppContext } from '~/contexts';
import { Color } from '~/constants/css';
import CrewProfileFields from './CrewProfileFields';
import InviteUserPicker from './InviteUserPicker';
import { MemberAvatars } from './DirectoryCard';
import { QuestNote, questHelpClass, questLabelClass } from './StepCard';
import useQuestAction from './useQuestAction';
import type { CrewView } from './types';

const blockClass = css`
  border-top: 1px solid var(--ui-border);
  padding-top: 1.4rem;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
`;

const blockTitleClass = css`
  margin: 0;
  font-size: 1.5rem;
  font-weight: bold;
  color: ${Color.black()};
`;

type Confirm =
  | { kind: 'remove'; userId: number; username: string; parentOk: boolean }
  | { kind: 'founder'; userId: number; username: string }
  | { kind: 'disband' };

// The founder's "Manage crew" panel: profile, open switch, invites,
// members (remove / make founder) and disband.
export default function ManageCrewPanel({
  crew,
  myId,
  onChanged,
  onDisbanded
}: {
  crew: CrewView;
  myId: number;
  onChanged: () => Promise<void>;
  onDisbanded: () => Promise<void>;
}) {
  const updateMeetupCrewProfile = useAppContext((v) => v.requestHelpers.updateMeetupCrewProfile);
  const setMeetupCrewOpen = useAppContext((v) => v.requestHelpers.setMeetupCrewOpen);
  const inviteToMeetupCrew = useAppContext((v) => v.requestHelpers.inviteToMeetupCrew);
  const cancelMeetupInvite = useAppContext((v) => v.requestHelpers.cancelMeetupInvite);
  const removeMeetupCrewMember = useAppContext((v) => v.requestHelpers.removeMeetupCrewMember);
  const makeMeetupCrewFounder = useAppContext((v) => v.requestHelpers.makeMeetupCrewFounder);
  const disbandMeetupCrew = useAppContext((v) => v.requestHelpers.disbandMeetupCrew);

  const profileAction = useQuestAction(onChanged);
  const openAction = useQuestAction(onChanged);
  const inviteAction = useQuestAction(onChanged);
  const membersAction = useQuestAction(onChanged);
  const disbandAction = useQuestAction(onDisbanded);

  const [name, setName] = useState(crew.name);
  const [about, setAbout] = useState(crew.about);
  const [cover, setCover] = useState(crew.cover);
  const [inviteSent, setInviteSent] = useState('');
  const [confirm, setConfirm] = useState<Confirm | null>(null);

  useEffect(() => {
    setName(crew.name);
    setAbout(crew.about);
    setCover(crew.cover);
  }, [crew.name, crew.about, crew.cover]);

  const { frozen } = crew.viewer;
  const others = crew.members.filter((member) => member.userId !== myId);
  const profileChanged =
    name.trim() !== crew.name || about.trim() !== crew.about || cover !== crew.cover;
  const plannedOrReviewed =
    crew.plan.status === 'pending' || crew.plan.status === 'approved';

  return (
    <div
      className={css`
        margin: 1.6rem 0 0.4rem;
        border: 2px solid ${Color.logoBlue(0.4)};
        border-radius: 1.2rem;
        padding: 1.6rem;
        background: ${Color.logoBlue(0.03)};
        display: flex;
        flex-direction: column;
        gap: 1.4rem;
      `}
    >
      <h3
        className={css`
          margin: 0;
          font-size: 1.8rem;
          font-weight: bold;
          color: ${Color.black()};
        `}
      >
        <Icon icon="gear" style={{ color: Color.logoBlue() }} /> Manage crew
      </h3>

      <div className={css`display: flex; flex-direction: column; gap: 0.9rem;`}>
        <CrewProfileFields
          idPrefix={`manage-crew-${crew.crewId}`}
          name={name}
          about={about}
          cover={cover}
          onNameChange={setName}
          onAboutChange={setAbout}
          onCoverChange={setCover}
        />
        <div>
          <Button
            color="logoBlue"
            loading={profileAction.busy}
            disabled={profileAction.busy || !profileChanged}
            onClick={() =>
              profileAction.run(() =>
                updateMeetupCrewProfile({ crewId: crew.crewId, name, about, cover })
              )
            }
          >
            Save crew profile
          </Button>
        </div>
        {profileAction.error && <QuestNote tone="warning">{profileAction.error}</QuestNote>}
      </div>

      <div className={blockClass}>
        <h4 className={blockTitleClass}>Who can join</h4>
        <SwitchButton
          checked={crew.isOpen}
          disabled={openAction.busy}
          label="Open to new members"
          labelStyle={{ fontSize: '1.4rem' }}
          onChange={() =>
            openAction.run(() =>
              setMeetupCrewOpen({ crewId: crew.crewId, isOpen: !crew.isOpen })
            )
          }
        />
        <span className={questHelpClass}>
          {crew.isOpen
            ? 'Anyone can find your crew in the directory and join it.'
            : 'Your crew is invite-only: it still shows in the directory, but only people you invite can join.'}
          {plannedOrReviewed
            ? ' While your plan is being reviewed or after it is approved, only people you invite can join.'
            : ''}
        </span>
        {openAction.error && <QuestNote tone="warning">{openAction.error}</QuestNote>}
      </div>

      <div className={blockClass}>
        <h4 className={blockTitleClass}>Invite someone</h4>
        <InviteUserPicker
          crewId={crew.crewId}
          disabled={frozen}
          busy={inviteAction.busy}
          onInvite={handleInvite}
        />
        <span className={questHelpClass}>
          They see an invitation on their page and a message in chat, with
          your crew name and branches.
          {plannedOrReviewed
            ? ' Someone new keeps your plan: staff check their branch and the crew again, and they ask their own parent.'
            : ''}
        </span>
        {inviteSent && <QuestNote tone="success">Invitation sent to {inviteSent}.</QuestNote>}
        {inviteAction.error && <QuestNote tone="warning">{inviteAction.error}</QuestNote>}
        {crew.invites.length > 0 && (
          <div>
            <span className={questLabelClass}>Waiting for an answer</span>
            <ul className={css`list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.4rem;`}>
              {crew.invites.map((invite) => (
                <li
                  key={invite.inviteId}
                  className={css`
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 1rem;
                    font-size: 1.4rem;
                  `}
                >
                  <span>
                    <Icon icon="clock" style={{ color: Color.gray() }} /> {invite.username}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    color="darkGray"
                    disabled={inviteAction.busy}
                    onClick={() =>
                      inviteAction.run(() =>
                        cancelMeetupInvite({ crewId: crew.crewId, inviteId: invite.inviteId })
                      )
                    }
                  >
                    Cancel invite
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className={blockClass}>
        <h4 className={blockTitleClass}>Members</h4>
        {others.length === 0 ? (
          <span className={questHelpClass}>
            It&apos;s just you so far. Invite friends or wait for someone to
            join from the directory.
          </span>
        ) : (
          <ul className={css`list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.6rem;`}>
            {others.map((member) => (
              <li
                key={member.userId}
                className={css`
                  display: flex;
                  align-items: center;
                  gap: 0.8rem;
                  flex-wrap: wrap;
                  font-size: 1.4rem;
                  padding: 0.6rem 0.8rem;
                  border-radius: 0.8rem;
                  background: #fff;
                  border: 1px solid var(--ui-border);
                `}
              >
                <MemberAvatars members={[member]} size="2.8rem" />
                <b>{member.username}</b>
                <span style={{ color: Color.darkGray() }}>{member.branch}</span>
                <span className={css`margin-left: auto; display: flex; gap: 0.4rem;`}>
                  <Button
                    size="sm"
                    variant="soft"
                    color="logoBlue"
                    disabled={membersAction.busy}
                    onClick={() =>
                      setConfirm({ kind: 'founder', userId: member.userId, username: member.username })
                    }
                  >
                    Make founder
                  </Button>
                  <Button
                    size="sm"
                    variant="soft"
                    color="red"
                    disabled={membersAction.busy || frozen}
                    onClick={() =>
                      setConfirm({ kind: 'remove', userId: member.userId, username: member.username, parentOk: member.parentOk })
                    }
                  >
                    Remove
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        )}
        {membersAction.error && <QuestNote tone="warning">{membersAction.error}</QuestNote>}
      </div>

      <div
        className={css`
          border-top: 1px solid ${Color.red(0.3)};
          padding-top: 1.4rem;
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
        `}
      >
        <h4 className={blockTitleClass} style={{ color: Color.red() }}>
          Disband crew
        </h4>
        <span className={questHelpClass}>
          {frozen
            ? "Your crew's video is with the admins now, so the crew can't be disbanded. Ask an admin if something needs to change."
            : 'This ends the crew for everyone. Members are told on their page.'}
        </span>
        <div>
          <Button
            color="red"
            variant="outline"
            disabled={frozen || disbandAction.busy}
            onClick={() => setConfirm({ kind: 'disband' })}
          >
            <Icon icon="trash-alt" style={{ marginRight: '0.5rem' }} />
            Disband crew
          </Button>
        </div>
        {disbandAction.error && <QuestNote tone="warning">{disbandAction.error}</QuestNote>}
      </div>

      {confirm && (
        <ConfirmModal
          title={
            confirm.kind === 'remove'
              ? `Remove ${confirm.username}?`
              : confirm.kind === 'founder'
              ? `Make ${confirm.username} the founder?`
              : `Disband ${crew.displayName}?`
          }
          descriptionFontSize="1.5rem"
          description={
            confirm.kind === 'remove'
              ? `${confirm.username} leaves the crew and can't join it again from the directory (you can still invite them back). They see a note on their page.${plannedOrReviewed && confirm.parentOk ? ' Their parent already said yes, so your plan will need to be sent again.' : ''}`
              : confirm.kind === 'founder'
              ? `${confirm.username} will lead the crew: they can rename it, invite and remove members, and disband it. You stay in the crew as a member.`
              : 'This ends the crew for everyone. Members are notified on their page. It cannot be undone.'
          }
          confirmButtonColor={confirm.kind === 'founder' ? 'logoBlue' : 'red'}
          confirmButtonLabel={
            confirm.kind === 'remove' ? 'Remove' : confirm.kind === 'founder' ? 'Make founder' : 'Disband'
          }
          onHide={() => setConfirm(null)}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  );

  async function handleInvite(user: { id: number; username: string }) {
    setInviteSent('');
    const ok = await inviteAction.run(() =>
      inviteToMeetupCrew({ crewId: crew.crewId, username: user.username })
    );
    if (ok) setInviteSent(user.username);
    return ok;
  }

  async function handleConfirm() {
    const current = confirm;
    setConfirm(null);
    if (!current) return;
    if (current.kind === 'remove') {
      await membersAction.run(() =>
        removeMeetupCrewMember({ crewId: crew.crewId, memberId: current.userId })
      );
    } else if (current.kind === 'founder') {
      await membersAction.run(() =>
        makeMeetupCrewFounder({ crewId: crew.crewId, userId: current.userId })
      );
    } else {
      await disbandAction.run(() => disbandMeetupCrew(crew.crewId));
    }
  }
}
