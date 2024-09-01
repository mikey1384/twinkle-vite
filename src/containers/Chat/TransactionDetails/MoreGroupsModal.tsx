import React from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import SelectedGroupItem from '~/containers/Chat/SelectedGroupItem';

export default function MoreGroupsModal({
  groups,
  onHide
}: {
  groups: Array<{
    id: number;
    channelName: string;
    thumbPath?: string;
    members: any[];
    isPublic?: boolean;
  }>;
  onHide: () => void;
}) {
  return (
    <Modal onHide={onHide}>
      <header>Selected Groups</header>
      <main>
        <div style={{ display: 'flex', flexWrap: 'wrap', width: '100%' }}>
          {groups.map((group) => (
            <SelectedGroupItem
              key={group.id}
              group={group}
              isConfirmationView={true}
              style={{ width: 'calc(50% - 0.5rem)', margin: '0.25rem' }}
            />
          ))}
        </div>
      </main>
      <footer>
        <Button transparent style={{ marginRight: '0.7rem' }} onClick={onHide}>
          Close
        </Button>
      </footer>
    </Modal>
  );
}
