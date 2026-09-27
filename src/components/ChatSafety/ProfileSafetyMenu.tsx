import React, { useMemo, useState } from 'react';
import DropdownButton from '~/components/Buttons/DropdownButton';
import Icon from '~/components/Icon';
import { useKeyContext } from '~/contexts';
import useBlockedUsers, { canBlockUser } from '~/helpers/hooks/useBlockedUsers';
import BlockUserModal from './BlockUserModal';

// "More" next to a profile's Message button. Block/Unblock lives behind it (and
// behind a confirmation), never as a one-tap button.
export default function ProfileSafetyMenu({
  userId,
  username
}: {
  userId: number;
  username: string;
}) {
  const myId = Number(useKeyContext((v) => v.myState.userId) || 0);
  const blockList = useBlockedUsers();
  const [modalMode, setModalMode] = useState<'block' | 'unblock' | null>(null);
  const blockable =
    blockList.status === 'loaded' && canBlockUser(blockList, userId, myId);
  const blocked = blockable && blockList.blockedIds.has(Number(userId));

  const menuProps = useMemo(
    () => [
      {
        label: (
          <span style={{ color: blocked ? undefined : '#b42318' }}>
            <Icon icon="ban" />
            <span style={{ marginLeft: '1rem' }}>
              {blocked ? 'Unblock' : 'Block'} {username}
            </span>
          </span>
        ),
        onClick: () => setModalMode(blocked ? 'unblock' : 'block')
      }
    ],
    [blocked, username]
  );

  if (!blockable || !username) return null;

  return (
    <>
      <DropdownButton
        variant="soft"
        tone="raised"
        color="darkerGray"
        icon="ellipsis-h"
        text="More"
        listStyle={{ minWidth: '20rem' }}
        menuProps={menuProps}
      />
      {blocked && (
        <span
          style={{ fontSize: '1.3rem', fontWeight: 700, color: '#b42318' }}
        >
          Blocked
        </span>
      )}
      {modalMode && (
        <BlockUserModal
          user={{ id: Number(userId), username }}
          mode={modalMode}
          onHide={() => setModalMode(null)}
        />
      )}
    </>
  );
}
