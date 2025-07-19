import React, { useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import RoundList from '~/components/RoundList';
import RankingsListItem from '~/components/RankingsListItem';
import { useKeyContext } from '~/contexts';

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
        <RoundList style={{ marginTop: 0 }}>
          {users.map((user) => (
            <RankingsListItem
              key={user.id}
              user={user}
              myId={userId}
              onUsermenuShownChange={setUsermenuShown}
            />
          ))}
        </RoundList>
      </main>
      <footer>
        <Button transparent onClick={onHide}>
          Close
        </Button>
      </footer>
    </Modal>
  );
}
