import React, { useState } from 'react';
import Button from '~/components/Button';
import Modal from '~/components/Modal';
import LegacyModalLayout from '~/components/Modal/LegacyModalLayout';
import Table from '../Table';
import ManagementUserSearchInput, {
  ManagementUserSearchResult
} from '../UserSearchInput';
import { Color } from '~/constants/css';

export default function AddNotableUserModal({
  existingUserIds,
  onHide,
  onSubmit
}: {
  existingUserIds: number[];
  onHide: () => void;
  onSubmit: (userId: number) => Promise<void>;
}) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] =
    useState<ManagementUserSearchResult | null>(null);

  return (
    <Modal
      modalKey="AddNotableUserModal"
      isOpen
      onClose={onHide}
      hasHeader={false}
      bodyPadding={0}
    >
      <LegacyModalLayout>
        <header>Add Notable User</header>
        <main>
          <ManagementUserSearchInput
            autoFocus
            excludeUserIds={existingUserIds}
            onSelect={setSelectedUser}
            placeholder="Search by username..."
          />
          {selectedUser ? (
            <Table columns="1fr 1fr" style={{ marginTop: '1.5rem' }}>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Real Name</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 'bold' }}>
                    {selectedUser.username}
                  </td>
                  <td>{selectedUser.realName || ''}</td>
                </tr>
              </tbody>
            </Table>
          ) : (
            <div
              style={{
                marginTop: '5rem',
                fontSize: '2.5rem',
                fontWeight: 'bold',
                paddingBottom: '3.5rem',
                color: Color.darkerGray()
              }}
            >
              No user selected
            </div>
          )}
          {!!error && (
            <div
              style={{
                marginTop: '1.2rem',
                fontSize: '1.2rem',
                color: '#b91c1c'
              }}
            >
              {error}
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
          <Button
            loading={loading}
            disabled={!selectedUser}
            color="blue"
            onClick={handleSubmit}
          >
            Add
          </Button>
        </footer>
      </LegacyModalLayout>
    </Modal>
  );

  async function handleSubmit() {
    if (!selectedUser) return;
    setLoading(true);
    setError('');
    try {
      await onSubmit(selectedUser.id);
      setLoading(false);
      onHide();
    } catch (submitError: any) {
      setError(submitError?.message || 'Failed to add notable user');
      setLoading(false);
    }
  }
}
