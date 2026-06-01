import React, { useMemo, useState } from 'react';
import Button from '~/components/Button';
import Modal from '~/components/Modal';
import LegacyModalLayout from '~/components/Modal/LegacyModalLayout';
import DropdownButton from '~/components/Buttons/DropdownButton';
import Table from '../Table';
import Icon from '~/components/Icon';
import { useAppContext, useManagementContext, useKeyContext } from '~/contexts';
import {
  MENTOR_ACHIEVEMENT_ID,
  SAGE_ACHIEVEMENT_ID,
  TWINKLE_FOUNDER_ACHIEVEMENT_ID,
  MENTOR_LABEL,
  SAGE_LABEL,
  FOUNDER_LABEL,
  roles
} from '~/constants/defaultValues';
import { Color } from '~/constants/css';
import { useRoleColor } from '~/theme/hooks/useRoleColor';
import ManagementUserSearchInput, {
  ManagementUserSearchResult
} from '../UserSearchInput';

const searchUsersLabel = 'Search Users';

export default function AddSupermodModal({ onHide }: { onHide: () => void }) {
  const [loading, setLoading] = useState(false);
  const doneRole = useRoleColor('done', { fallback: 'blue' });
  const doneColor = useMemo(
    () => doneRole.getColor() || Color.blue(),
    [doneRole]
  );
  const level = useKeyContext((v) => v.myState.level);
  const addSupermods = useAppContext((v) => v.requestHelpers.addSupermods);
  const onEditSupermods = useManagementContext(
    (v) => v.actions.onEditSupermods
  );
  const [dropdownShown, setDropdownShown] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const TableContent = useMemo(() => {
    return selectedUsers.map(
      (user: {
        id: number;
        username: string;
        realName: string;
        role: string;
        unlockedAchievementIds?: number[];
      }) => {
        const dropdownMenu: { label: any; onClick: () => void }[] = [
          {
            label: 'Mentor',
            onClick: () =>
              handleRoleClick({
                role: MENTOR_LABEL,
                userId: user.id
              })
          },
          {
            label: 'Sage',
            onClick: () =>
              handleRoleClick({
                role: SAGE_LABEL,
                userId: user.id
              })
          },
          {
            label: 'Founder',
            onClick: () =>
              handleRoleClick({
                role: FOUNDER_LABEL,
                userId: user.id
              })
          }
        ];
        const isMentor = user.unlockedAchievementIds?.includes(
          MENTOR_ACHIEVEMENT_ID
        );
        const isSage =
          user.unlockedAchievementIds?.includes(SAGE_ACHIEVEMENT_ID);
        const isTwinkleFounder = user.unlockedAchievementIds?.includes(
          TWINKLE_FOUNDER_ACHIEVEMENT_ID
        );
        let role = '';
        if (isMentor) role = 'Mentor';
        if (isSage) role = 'Sage';
        if (isTwinkleFounder) role = 'Founder';

        if (role) {
          dropdownMenu.push({
            label: (
              <>
                <Icon icon="trash-alt" />
                <span style={{ marginLeft: '1rem' }}>Remove</span>
              </>
            ),
            onClick: () =>
              handleRoleClick({
                role: '',
                userId: user.id
              })
          });
        }
        return (
          <tr key={user.id}>
            <td>
              <span style={{ fontWeight: 'bold', fontSize: '1.7rem' }}>
                {user.username}
              </span>
              <small
                style={{
                  color: Color.lightGray(),
                  marginLeft: '0.7rem',
                  fontSize: '1.1rem'
                }}
              >
                ({user.realName})
              </small>
            </td>
            <td style={{ display: 'flex', alignItems: 'center' }}>
              <DropdownButton
                style={{ position: 'absolute' }}
                icon="chevron-down"
                variant="solid"
                tone="raised"
                text={user.role || 'Not Selected'}
                color="darkerGray"
                onDropdownShown={setDropdownShown}
                menuProps={dropdownMenu}
              />
            </td>
          </tr>
        );
      }
    );
  }, [selectedUsers]);

  return (
    <Modal
      modalKey="AddSupermodModal"
      isOpen
      onClose={onHide}
      closeOnBackdropClick={!dropdownShown}
      hasHeader={false}
      bodyPadding={0}
      allowOverflow
    >
      <LegacyModalLayout wrapped>
        <header>Add / Edit Supermods</header>
        <main>
          <ManagementUserSearchInput
            autoFocus
            onSelect={handleSelectUser}
            placeholder={`${searchUsersLabel}...`}
            excludeUserIds={selectedUsers.map((user) => user.id)}
            filterUser={isAllowedSupermodCandidate}
          />
          {selectedUsers.length > 0 && (
            <Table columns="2fr 1fr" style={{ marginTop: '1.5rem' }}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Account Type</th>
                </tr>
              </thead>
              <tbody>{TableContent}</tbody>
            </Table>
          )}
          {selectedUsers.length === 0 && (
            <div
              style={{
                marginTop: '5rem',
                fontSize: '2.5rem',
                fontWeight: 'bold',
                paddingBottom: '3.5rem'
              }}
            >
              No users selected
            </div>
          )}
        </main>
        <footer>
          <Button
            variant="ghost"
            onClick={onHide}
            style={{ marginRight: '0.7rem' }}
          >
            Cancel
          </Button>
          <Button loading={loading} color={doneColor} onClick={handleSubmit}>
            Done
          </Button>
        </footer>
      </LegacyModalLayout>
    </Modal>
  );

  function handleRoleClick({ role, userId }: { role: string; userId: number }) {
    setSelectedUsers((users) =>
      users.map((user) =>
        user.id === userId
          ? {
              ...user,
              role
            }
          : user
      )
    );
  }

  function handleSelectUser(user: ManagementUserSearchResult) {
    setSelectedUsers((users) => {
      const isMentor = user.unlockedAchievementIds?.includes(
        MENTOR_ACHIEVEMENT_ID
      );
      const isSage = user.unlockedAchievementIds?.includes(SAGE_ACHIEVEMENT_ID);
      const isTwinkleFounder = user.unlockedAchievementIds?.includes(
        TWINKLE_FOUNDER_ACHIEVEMENT_ID
      );
      let role = '';
      if (isMentor) role = MENTOR_LABEL;
      if (isSage) role = SAGE_LABEL;
      if (isTwinkleFounder) role = FOUNDER_LABEL;
      return users.concat({
        ...user,
        role
      });
    });
  }

  async function handleSubmit() {
    setLoading(true);
    const supermods = selectedUsers.map((user) => ({
      userId: user.id,
      role: user.role ? roles[user.role] : null
    }));
    const newSupermods = await addSupermods(supermods);
    onEditSupermods(newSupermods);
    onHide();
  }

  function isAllowedSupermodCandidate(user: ManagementUserSearchResult) {
    const supermodAchievementIds = [
      MENTOR_ACHIEVEMENT_ID,
      SAGE_ACHIEVEMENT_ID,
      TWINKLE_FOUNDER_ACHIEVEMENT_ID
    ];
    return (
      level > (user.level || 0) &&
      !(user.unlockedAchievementIds || []).some((id: number) =>
        supermodAchievementIds.includes(id)
      )
    );
  }
}
