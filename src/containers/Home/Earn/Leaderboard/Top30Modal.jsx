import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import RoundList from '~/components/RoundList';
import RankingsListItem from '~/components/RankingsListItem';
import { useKeyContext } from '~/contexts';

Top30Modal.propTypes = {
  onHide: PropTypes.func.isRequired,
  month: PropTypes.string.isRequired,
  users: PropTypes.array.isRequired,
  year: PropTypes.string.isRequired
};

export default function Top30Modal({ onHide, month, year, users }) {
  const { userId } = useKeyContext((v) => v.myState);
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
