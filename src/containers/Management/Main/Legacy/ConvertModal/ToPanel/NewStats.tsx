import React from 'react';
import Table from '../../../../Table';
import Check from '../../../../Check';
import { Color } from '~/constants/css';
import { User } from '~/types';
import { StatsProp } from './types';

export default function NewStats({
  newStats,
  target
}: {
  newStats: StatsProp;
  target: User;
}) {
  return (
    <Table columns="minmax(min-content, 1fr) minmax(min-content, 1fr) minmax(min-content, 1fr) minmax(min-content, 1fr) minmax(min-content, 1fr) minmax(min-content, 1fr) minmax(min-content, 1fr) minmax(min-content, 1fr) minmax(min-content, 1fr)">
      <thead>
        <tr>
          <th>User</th>
          <th>Title</th>
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
              {newStats.username}
            </span>
            <small
              style={{
                color: Color.lightGray(),
                marginLeft: '0.7rem',
                fontSize: '1rem'
              }}
            >
              ({newStats.realName})
            </small>
          </td>
          <td>{newStats.title}</td>
          <td style={{ textAlign: 'center' }}>{newStats.level}</td>
          <td style={{ textAlign: 'center' }}>
            <Check checked={!!newStats.canEdit} />
          </td>
          <td style={{ textAlign: 'center' }}>
            <Check checked={!!newStats.canDelete} />
          </td>
          <td style={{ textAlign: 'center' }}>
            <Check checked={!!newStats.canReward} />
          </td>
          <td style={{ textAlign: 'center' }}>
            <Check checked={!!newStats.canPinPlaylists} />
          </td>
          <td style={{ textAlign: 'center' }}>
            <Check checked={!!newStats.canEditPlaylists} />
          </td>
          <td style={{ textAlign: 'center' }}>
            <Check checked={!!newStats.canEditRewardLevel} />
          </td>
        </tr>
      </tbody>
    </Table>
  );
}
