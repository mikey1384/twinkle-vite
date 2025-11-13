import React, { useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import SectionPanel from '~/components/SectionPanel';
import Table from '../Table';
import RedTimes from '../RedTimes';
import EditBanStatusModal from '../Modals/EditBanStatusModal';
import AddBanModal from '../Modals/AddBanModal';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { useManagementContext } from '~/contexts';import { useRoleColor } from '~/theme/useRoleColor';

const chatLabel = 'Chat';
const chessLabel = 'Chess';
const logInLabel = 'Log In';
const postingLabel = 'Posting';
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
    banned: {
      all: boolean;
      chat: boolean;
      chess: boolean;
      posting: boolean;
    };
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
          columns={`
          minmax(10rem, 1fr)
          minmax(10rem, 1fr)
          minmax(10rem, 1fr)
          minmax(10rem, 1fr)
          minmax(10rem, 1fr)
        `}
        >
          <thead>
            <tr>
              <th>{userLabel}</th>
              <th style={{ textAlign: 'center' }}>{logInLabel}</th>
              <th style={{ textAlign: 'center' }}>{chatLabel}</th>
              <th style={{ textAlign: 'center' }}>{chessLabel}</th>
              <th style={{ textAlign: 'center' }}>{postingLabel}</th>
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
                banned: {
                  all: boolean;
                  chat: boolean;
                  chess: boolean;
                  posting: boolean;
                };
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
                  <td style={{ textAlign: 'center' }}>
                    {banned?.all && <RedTimes />}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {banned?.chat && <RedTimes />}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {banned?.chess && <RedTimes />}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {banned?.posting && <RedTimes />}
                  </td>
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
