import React, { useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Input from '~/components/Texts/Input';
import ErrorBoundary from '~/components/ErrorBoundary';

interface AddUsersModalProps {
  achievementType: string;
  onHide: () => void;
  onSubmit: (users: string[]) => void;
}

export default function AddUsersModal({
  achievementType,
  onHide,
  onSubmit
}: AddUsersModalProps) {
  const [users] = useState('');

  const handleSubmit = () => {
    const userList = users
      .split(',')
      .map((user) => user.trim())
      .filter(Boolean);
    onSubmit(userList);
    onHide();
  };

  return (
    <ErrorBoundary componentPath="Management/Main/Achievements/AddUsersModal">
      <Modal onHide={onHide}>
        <header>Add Users to {achievementType} Achievement</header>
        <main>
          <Input
            placeholder="Enter usernames, separated by commas"
            value={users}
            onChange={(text) => console.log(text)}
            style={{ width: '100%' }}
          />
        </main>
        <footer>
          <Button
            transparent
            style={{ marginRight: '0.7rem' }}
            onClick={onHide}
          >
            Cancel
          </Button>
          <Button color="blue" onClick={handleSubmit}>
            Add Users
          </Button>
        </footer>
      </Modal>
    </ErrorBoundary>
  );
}
