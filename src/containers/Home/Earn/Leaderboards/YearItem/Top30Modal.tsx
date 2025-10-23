import React, { useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import RankingsListItem from '~/components/RankingsListItem';
import { useKeyContext } from '~/contexts';
import LeaderboardList from '~/components/LeaderboardList';

export default function Top30Modal({
  onHide,
  month,
  year,
  users
}: {
  onHide: () => void;
  month: string;
  users: any[];
  year: string;
}) {
  const userId = useKeyContext((v) => v.myState.userId);
  const [usermenuShown, setUsermenuShown] = useState(false);

  return (
    <Modal small closeWhenClickedOutside={!usermenuShown} onHide={onHide}>
      <header>{`${month} ${year}`}</header>
      <main style={{ paddingTop: 0 }}>
        <LeaderboardList
          scrollable={false}
          padding="0"
          mobilePadding="0"
          bottomPadding="0"
          gap="0.75rem"
        >
          {users.map((user) => (
            <RankingsListItem
              key={user.id}
              user={user}
              myId={userId}
              onUsermenuShownChange={setUsermenuShown}
            />
          ))}
        </LeaderboardList>
      </main>
      <footer>
        <Button transparent onClick={onHide}>
          Close
        </Button>
      </footer>
    </Modal>
  );
}
