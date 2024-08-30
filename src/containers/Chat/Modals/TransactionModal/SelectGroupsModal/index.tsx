import React, { useEffect, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import { css } from '@emotion/css';
import { cloudFrontURL } from '~/constants/defaultValues';
import { Color, borderRadius } from '~/constants/css';
import Icon from '~/components/Icon';
import { useAppContext, useKeyContext } from '~/contexts';

export default function SelectGroupsModal({
  onHide,
  onSelectDone,
  currentlySelectedGroupIds
}: {
  onHide: () => void;
  onSelectDone: (groupIds: number[]) => void;
  currentlySelectedGroupIds: number[];
}) {
  const [groups] = useState<any[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>(
    currentlySelectedGroupIds
  );
  const [loading] = useState(true);
  const loadPublicGroups = useAppContext(
    (v) => v.requestHelpers.loadPublicGroups
  );
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);

  useEffect(() => {
    init();
    async function init() {
      console.log('initing');
    }
  }, [loadPublicGroups]);

  const handleGroupSelect = (groupId: number) => {
    setSelectedGroupIds((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  return (
    <Modal large wrapped modalOverModal onHide={onHide}>
      <header>Select Groups</header>
      <main>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <div
            className={css`
              display: flex;
              flex-direction: column;
              gap: 1rem;
              max-height: 70vh;
              overflow-y: auto;
            `}
          >
            {groups.map((group) => (
              <div
                key={group.id}
                className={css`
                  display: flex;
                  align-items: center;
                  padding: 1rem;
                  cursor: pointer;
                  border-radius: ${borderRadius};
                  background-color: ${selectedGroupIds.includes(group.id)
                    ? Color.highlightGray()
                    : 'transparent'};
                  &:hover {
                    background-color: ${Color.highlightGray()};
                  }
                `}
                onClick={() => handleGroupSelect(group.id)}
              >
                <div
                  className={css`
                    width: 4rem;
                    height: 4rem;
                    border-radius: 50%;
                    margin-right: 1.5rem;
                    flex-shrink: 0;
                    background-color: ${Color.lightGray()};
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                  `}
                >
                  {group.thumbPath ? (
                    <img
                      src={`${cloudFrontURL}/thumbs/${group.thumbPath}/thumb.png`}
                      alt={group.channelName}
                      className={css`
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                      `}
                    />
                  ) : (
                    <Icon icon="users" style={{ fontSize: '2rem' }} />
                  )}
                </div>
                <div
                  className={css`
                    flex-grow: 1;
                  `}
                >
                  <div
                    className={css`
                      font-size: 1.3rem;
                      font-weight: bold;
                      color: ${Color.darkerGray()};
                    `}
                  >
                    {group.channelName}
                  </div>
                  <div
                    className={css`
                      font-size: 1.1rem;
                      color: ${Color.gray()};
                    `}
                  >
                    {group.members} members
                  </div>
                </div>
                {selectedGroupIds.includes(group.id) && (
                  <Icon
                    icon="check"
                    style={{
                      marginLeft: '1rem',
                      color: Color.green(),
                      fontSize: '1.5rem'
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </main>
      <footer>
        <Button transparent style={{ marginRight: '0.7rem' }} onClick={onHide}>
          Cancel
        </Button>
        <Button
          disabled={selectedGroupIds.length === 0}
          color={doneColor}
          onClick={() => onSelectDone(selectedGroupIds)}
        >
          Done
        </Button>
      </footer>
    </Modal>
  );
}
