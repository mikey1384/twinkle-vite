import React, {
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
  forwardRef
} from 'react';
import FilterBar from '~/components/FilterBar';
import Button from '~/components/Button';
import Reorder from './Reorder';
import Remove from './Remove';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { isEqual } from 'lodash';
import { useAppContext, useKeyContext } from '~/contexts';
import { capitalize } from '~/helpers/stringHelpers';

export default forwardRef(function EditTab(
  {
    deletedDefIds: originalDeletedIds = [],
    editedDefinitionOrder,
    onEditWord,
    originalPosOrder,
    originalDefinitionOrder,
    posObj,
    onSetEditedDefinitionOrder,
    word,
    onDisabledChange,
    onPostingChange
  }: {
    deletedDefIds: number[];
    editedDefinitionOrder: { [key: string]: number[] };
    onEditWord: (v: any) => any;
    originalDefinitionOrder: { [key: string]: number[] };
    originalPosOrder: string[];
    posObj: { [key: string]: { [key: number]: { title: string } } };
    onSetEditedDefinitionOrder: (arg0: { [key: string]: number[] }) => void;
    word: string;
    onDisabledChange?: (disabled: boolean) => void;
    onPostingChange?: (posting: boolean) => void;
  },
  ref
) {
  const editWord = useAppContext((v) => v.requestHelpers.editWord);
  const canDelete = useKeyContext((v) => v.myState.canDelete);
  const level = useKeyContext((v) => v.myState.level);
  const doneColor = useKeyContext((v) => v.theme.done.color);
  const [selectedTab, setSelectedTab] = useState('reorder');
  const [posting, setPosting] = useState(false);
  const [poses, setPoses] = useState<string[]>([]);
  const [deletedDefIds, setDeletedDefIds] = useState(originalDeletedIds);

  const disabled = useMemo(() => {
    let deletedDefIdsAreTheSame = false;
    let deletedDefIdsAreIncludedInTheOriginal = true;
    for (const deletedId of deletedDefIds) {
      if (!originalDeletedIds.includes(deletedId)) {
        deletedDefIdsAreIncludedInTheOriginal = false;
        break;
      }
    }
    deletedDefIdsAreTheSame =
      deletedDefIdsAreIncludedInTheOriginal &&
      deletedDefIds.length === originalDeletedIds.length;

    return (
      isEqual(originalPosOrder, poses) &&
      isEqual(originalDefinitionOrder, editedDefinitionOrder) &&
      deletedDefIdsAreTheSame
    );
  }, [
    deletedDefIds,
    editedDefinitionOrder,
    originalDefinitionOrder,
    originalDeletedIds,
    originalPosOrder,
    poses
  ]);

  useEffect(() => {
    onDisabledChange?.(disabled);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled]);

  useEffect(() => {
    onPostingChange?.(posting);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posting]);

  useImperativeHandle(ref, () => ({
    async apply() {
      await handleEditDone({ poses, editedDefinitionOrder });
    },
    getDisabled() {
      return disabled;
    },
    getPosting() {
      return posting;
    }
  }));

  useEffect(() => {
    setPoses(originalPosOrder);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <main>
        <p
          className={css`
            font-weight: bold;
            font-size: 2.5rem;
            width: 100%;
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 2rem;
            }
          `}
        >
          {`${capitalize(selectedTab)} Definitions of "${word}"`}
        </p>
        {canDelete && level > 3 && (
          <FilterBar style={{ marginTop: '0.5rem', marginBottom: '2rem' }}>
            <nav
              className={selectedTab === 'reorder' ? 'active' : ''}
              onClick={() => setSelectedTab('reorder')}
            >
              Reorder
            </nav>
            <nav
              className={selectedTab === 'remove' ? 'active' : ''}
              onClick={() => setSelectedTab('remove')}
            >
              Remove
            </nav>
          </FilterBar>
        )}
        {selectedTab === 'reorder' && (
          <Reorder
            deletedDefIds={originalDeletedIds}
            editedDefinitionOrder={editedDefinitionOrder}
            onSetEditedDefinitionOrder={onSetEditedDefinitionOrder}
            onSetPoses={setPoses}
            poses={poses}
            posObj={posObj}
          />
        )}
        {selectedTab === 'remove' && (
          <Remove
            editedDefinitionOrder={editedDefinitionOrder}
            onListItemClick={handleRemoveListItemClick}
            poses={poses}
            posObj={posObj}
            deletedDefIds={deletedDefIds}
          />
        )}
      </main>
      <footer
        className={css`
          display: flex;
          justify-content: flex-end;
          margin-top: 2rem;
        `}
      >
        <Button
          color={doneColor}
          disabled={disabled || posting}
          loading={posting}
          onClick={() => handleEditDone({ poses, editedDefinitionOrder })}
        >
          Apply
        </Button>
      </footer>
    </>
  );

  async function handleEditDone({
    poses,
    editedDefinitionOrder
  }: {
    poses: string[];
    editedDefinitionOrder: { [key: string]: number[] };
  }) {
    setPosting(true);
    await editWord({
      editedDefinitionOrder,
      deletedDefIds,
      partOfSpeeches: poses,
      word
    });
    onEditWord({
      deletedDefIds,
      partOfSpeeches: poses,
      editedDefinitionOrder,
      word
    });
    setPosting(false);
  }

  function handleRemoveListItemClick(defId: number) {
    setDeletedDefIds((defIds) => {
      if (defIds.includes(defId)) {
        return defIds.filter((id) => id !== defId);
      } else {
        return [...defIds, defId];
      }
    });
  }
});
