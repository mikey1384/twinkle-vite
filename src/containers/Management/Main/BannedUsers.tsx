import React, { useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import SectionPanel from '~/components/SectionPanel';
import Table from '../Table';
import RedTimes from '../RedTimes';
import EditBanStatusModal from '../Modals/EditBanStatusModal';
import AddBanModal from '../Modals/AddBanModal';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { useManagementContext } from '~/contexts';
import { useRoleColor } from '~/theme/hooks/useRoleColor';
import { BAN_DIMENSIONS } from '../constants/banDimensions';

const restrictedAccountsLabel = 'Restricted Accounts';
const restrictAccountLabel = 'Restrict Account';
const userLabel = 'User';

export default function BannedUsers({ canManage }: { canManage: boolean }) {
  const bannedUsers = useManagementContext((v) => v.state.bannedUsers);
  const bannedUsersLoaded = useManagementContext(
    (v) => v.state.bannedUsersLoaded
  );
  const tableHeaderRole = useRoleColor('tableHeader', { fallback: 'logoBlue' });
  const tableHeaderColor = tableHeaderRole.colorKey || 'logoBlue';
  const [newBanModalShown, setNewBanModalShown] = useState(false);
  const [banStatusModalTarget, setEditBanStatusModalTarget] = useState<{
    id: number;
    username: string;
    banned: Record<string, boolean>;
  } | null>(null);

  return (
    <ErrorBoundary componentPath="Management/Main/BannedUsers">
      <SectionPanel
        title={restrictedAccountsLabel}
        isEmpty={bannedUsers.length === 0}
        emptyMessage="No Restricted Accounts"
        loaded={bannedUsersLoaded}
        innerStyle={{ paddingLeft: 0, paddingRight: 0 }}
        button={
          canManage ? (
            <Button
              color="darkerGray"
              variant="solid"
              tone="raised"
              onClick={() => setNewBanModalShown(true)}
            >
              <Icon icon="plus" />
              <span style={{ marginLeft: '0.7rem' }}>
                {restrictAccountLabel}
              </span>
            </Button>
          ) : null
        }
      >
        <Table
          color={tableHeaderColor}
          headerFontSize="1.5rem"
          columns={Array(BAN_DIMENSIONS.length + 1)
            .fill('minmax(10rem, 1fr)')
            .join('\n')}
        >
          <thead>
            <tr>
              <th>{userLabel}</th>
              {BAN_DIMENSIONS.map((dimension) => (
                <th key={dimension.key} style={{ textAlign: 'center' }}>
                  {dimension.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bannedUsers.map(
              ({
                id,
                username,
                banned
              }: {
                id: number;
                username: string;
                banned: Record<string, boolean>;
              }) => (
                <tr
                  onClick={() =>
                    canManage
                      ? setEditBanStatusModalTarget({ id, username, banned })
                      : {}
                  }
                  key={id}
                  style={{ cursor: canManage ? 'pointer' : '' }}
                >
                  <td
                    style={{
                      fontWeight: 'bold',
                      fontSize: '1.6rem'
                    }}
                  >
                    {username}
                  </td>
                  {BAN_DIMENSIONS.map((dimension) => (
                    <td key={dimension.key} style={{ textAlign: 'center' }}>
                      {banned?.[dimension.key] && <RedTimes />}
                    </td>
                  ))}
                </tr>
              )
            )}
          </tbody>
        </Table>
      </SectionPanel>
      {banStatusModalTarget && (
        <EditBanStatusModal
          target={banStatusModalTarget}
          onHide={() => setEditBanStatusModalTarget(null)}
        />
      )}
      {newBanModalShown && (
        <AddBanModal onHide={() => setNewBanModalShown(false)} />
      )}
    </ErrorBoundary>
  );
}
