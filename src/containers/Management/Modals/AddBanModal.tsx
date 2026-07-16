import React, { useEffect, useMemo, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import Modal from '~/components/Modal';
import LegacyModalLayout from '~/components/Modal/LegacyModalLayout';
import Button from '~/components/Button';
import Table from '../Table';
import RedTimes from '../RedTimes';
import UserSearchInput, {
  type UserSearchResult
} from '~/components/UserSearchInput';
import { useAppContext, useManagementContext, useKeyContext } from '~/contexts';
import { isEqual } from 'lodash';
import { css } from '@emotion/css';
import { useRoleColor } from '~/theme/hooks/useRoleColor';
import { Color } from '~/constants/css';
import { BAN_DIMENSIONS, EMPTY_BAN_STATUS } from '../constants/banDimensions';

const searchUsersLabel = 'Search Users';

export default function AddBanModal({ onHide }: { onHide: () => void }) {
  const level = useKeyContext((v) => v.myState.level);
  const doneRole = useRoleColor('done', { fallback: 'blue' });
  const doneColor = useMemo(
    () => doneRole.getColor() || Color.blue(),
    [doneRole]
  );
  const [submitting, setSubmitting] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Record<string, any>>({
    banned: null
  });
  const updateBanStatus = useAppContext(
    (v) => v.requestHelpers.updateBanStatus
  );
  const onUpdateBanStatus = useManagementContext(
    (v) => v.actions.onUpdateBanStatus
  );
  const [banStatus, setBanStatus] = useState<Record<string, boolean>>({
    ...EMPTY_BAN_STATUS
  });
  useEffect(() => {
    setBanStatus(selectedUser.banned || { ...EMPTY_BAN_STATUS });
  }, [selectedUser]);
  const submitDisabled = useMemo(() => {
    if (!selectedUser.banned) return true;
    const bannedFeatures: { [key: string]: boolean } = {};
    for (const key in banStatus) {
      if (banStatus[key]) {
        bannedFeatures[key] = true;
      }
    }
    const prevBannedFeatures: { [key: string]: boolean } = {};
    for (const key in selectedUser.banned) {
      if (selectedUser.banned[key]) {
        prevBannedFeatures[key] = true;
      }
    }
    return isEqual(bannedFeatures, prevBannedFeatures);
  }, [banStatus, selectedUser]);

  return (
    <ErrorBoundary componentPath="Management/Modals/AddBanModal">
      <Modal
        modalKey="AddBanModal"
        isOpen
        onClose={onHide}
        hasHeader={false}
        bodyPadding={0}
      >
        <LegacyModalLayout>
          <header style={{ display: 'block' }}>Restrict Account</header>
          <main>
            <div style={{ position: 'relative', width: '100%' }}>
              <UserSearchInput
                autoFocus
                onSelect={handleSelectUser}
                placeholder={`${searchUsersLabel}...`}
                filterUser={(user) => level > (user.level || 0)}
              />
              {selectedUser && (
                <div>
                  <p
                    style={{
                      fontSize: '2rem',
                      fontWeight: 'bold',
                      marginTop: '2rem',
                      textAlign: 'center'
                    }}
                  >
                    {selectedUser.username}
                  </p>
                  <Table style={{ marginTop: '1.5rem' }} columns="2fr 1fr">
                    <thead>
                      <tr>
                        <th>Features</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody
                      className={`${css`
                        tr {
                          cursor: pointer;
                        }
                      `} unselectable`}
                    >
                      {BAN_DIMENSIONS.map((dimension) => (
                        <tr
                          key={dimension.key}
                          onClick={() => handleBanStatusClick(dimension.key)}
                        >
                          <td style={{ fontWeight: 'bold' }}>
                            {dimension.label}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {banStatus[dimension.key] && <RedTimes />}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </div>
          </main>
          <footer>
            <Button
              variant="ghost"
              onClick={onHide}
              style={{ marginRight: '0.7rem' }}
            >
              Cancel
            </Button>
            <Button
              loading={submitting}
              color={doneColor}
              disabled={submitDisabled}
              onClick={handleSubmit}
            >
              Done
            </Button>
          </footer>
        </LegacyModalLayout>
      </Modal>
    </ErrorBoundary>
  );

  function handleBanStatusClick(feature: string) {
    setBanStatus((prevStatus) => ({
      ...prevStatus,
      [feature]: !prevStatus[feature]
    }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const { user } = await updateBanStatus({
        userId: selectedUser.id,
        banStatus
      });
      onUpdateBanStatus(user);
      onHide();
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  }

  function handleSelectUser(user: UserSearchResult) {
    setSelectedUser(user);
  }
}
