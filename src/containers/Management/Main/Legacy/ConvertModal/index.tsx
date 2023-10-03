import React, { useState } from 'react';
import Button from '~/components/Button';
import Modal from '~/components/Modal';
import Table from '../../../Table';
import Check from '../../../Check';
import { Color } from '~/constants/css';
import { User } from '~/types';
import { useKeyContext } from '~/contexts';

export default function ConvertModal({
  target,
  onHide
}: {
  target: User;
  onHide: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);

  return (
    <Modal onHide={onHide}>
      <header>Convert</header>
      <main>
        <Table
          columns="minmax(min-content, 1fr) minmax(min-content, 1fr) minmax(min-content, 1fr) minmax(min-content, 1fr) minmax(min-content, 1fr) minmax(min-content, 1fr) minmax(min-content, 1fr) minmax(min-content, 1fr) minmax(min-content, 1fr)"
          style={{ marginTop: '1.5rem' }}
        >
          <thead>
            <tr>
              <th>User</th>
              <th>Account Type</th>
              <th>Level</th>
              <th>Edit</th>
              <th>Delete</th>
              <th>Reward</th>
              <th>Feature Contents</th>
              <th>Edit Playlists</th>
              <th>Edit Reward Level</th>
            </tr>
          </thead>
          <tbody>
            <tr key={target.id}>
              <td>
                <span style={{ fontWeight: 'bold', fontSize: '1.7rem' }}>
                  {target.username}
                </span>
                <small
                  style={{
                    color: Color.lightGray(),
                    marginLeft: '0.7rem',
                    fontSize: '1rem'
                  }}
                >
                  ({target.realName})
                </small>
              </td>
              <td>{target.userType}</td>
              <td style={{ textAlign: 'center' }}>{target.level}</td>
              <td style={{ textAlign: 'center' }}>
                <Check checked={!!target.canEdit} />
              </td>
              <td style={{ textAlign: 'center' }}>
                <Check checked={!!target.canDelete} />
              </td>
              <td style={{ textAlign: 'center' }}>
                <Check checked={!!target.canReward} />
              </td>
              <td style={{ textAlign: 'center' }}>
                <Check checked={!!target.canPinPlaylists} />
              </td>
              <td style={{ textAlign: 'center' }}>
                <Check checked={!!target.canEditPlaylists} />
              </td>
              <td style={{ textAlign: 'center' }}>
                <Check checked={!!target.canEditRewardLevel} />
              </td>
            </tr>
          </tbody>
        </Table>
      </main>
      <footer>
        <Button transparent onClick={onHide} style={{ marginRight: '0.7rem' }}>
          Cancel
        </Button>
        <Button loading={loading} color={doneColor} onClick={handleSubmit}>
          Done
        </Button>
      </footer>
    </Modal>
  );

  async function handleSubmit() {
    setLoading(true);
    onHide();
  }
}
