import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import Input from '~/components/Texts/Input';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import { Color } from '~/constants/css';
import { useAppContext } from '~/contexts';
import { css } from '@emotion/css';

CategoryModal.propTypes = {
  category: PropTypes.string,
  onEditGrammarCategory: PropTypes.func.isRequired,
  onSetCategories: PropTypes.func.isRequired,
  onHide: PropTypes.func
};

export default function CategoryModal({
  category,
  onEditGrammarCategory,
  onSetCategories,
  onHide
}) {
  const deleteGrammarCategory = useAppContext(
    (v) => v.requestHelpers.deleteGrammarCategory
  );
  const loadGrammarCategoryQuestions = useAppContext(
    (v) => v.requestHelpers.loadGrammarCategoryQuestions
  );
  const editGrammarCategory = useAppContext(
    (v) => v.requestHelpers.editGrammarCategory
  );
  const [confirmModalShown, setConfirmModalShown] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editiedCategory, setEditedCategory] = useState(category);
  const [questions, setQuestions] = useState([]);
  useEffect(() => {
    init();
    async function init() {
      const rows = await loadGrammarCategoryQuestions(category);
      setQuestions(rows);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Modal onHide={onHide}>
      <header>
        <div style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
          <div style={{ width: isEditing ? '60%' : 'auto' }}>
            {isEditing ? (
              <Input
                style={{ width: '100%' }}
                maxLength={100}
                placeholder="Enter a new label..."
                autoFocus
                onChange={(text) => setEditedCategory(text)}
                onKeyPress={(event) => {
                  if (
                    !stringIsEmpty(editiedCategory) &&
                    event.key === 'Enter'
                  ) {
                    handleChangeLabel(editiedCategory);
                  }
                }}
                value={editiedCategory}
              />
            ) : (
              <span style={{ textTransform: 'capitalize' }}>{category}</span>
            )}
            {isEditing && (
              <div
                className={`unselectable ${css`
                  > small {
                    cursor: pointer;
                    color: ${Color.gray()};
                    font-weight: normal;
                    font-size: 1.5rem;
                    &:hover {
                      text-decoration: underline;
                    }
                  }
                `}`}
              >
                <small onClick={handleChangeLabel}>
                  <Icon style={{ color: Color.green() }} icon="check" />
                  <span style={{ marginLeft: '0.7rem', color: Color.green() }}>
                    Change
                  </span>
                </small>
                <small
                  style={{ marginLeft: '2rem' }}
                  onClick={() => {
                    setEditedCategory(category);
                    setIsEditing(false);
                  }}
                >
                  <Icon icon="ban" />
                  <span style={{ marginLeft: '0.7rem' }}>Cancel</span>
                </small>
              </div>
            )}
          </div>
          {category !== 'uncategorized' && !isEditing && (
            <div
              className={`unselectable ${css`
                margin-left: 3rem;
                > small {
                  cursor: pointer;
                  color: ${Color.gray()};
                  font-weight: normal;
                  font-size: 1.5rem;
                  &:hover {
                    text-decoration: underline;
                  }
                }
              `}`}
            >
              <small onClick={() => setIsEditing(true)}>
                <Icon icon="pencil-alt" /> Edit
              </small>
              <small
                onClick={() => setConfirmModalShown(true)}
                style={{ marginLeft: '2rem' }}
              >
                <Icon icon="trash-alt" /> Delete
              </small>
            </div>
          )}
        </div>
      </header>
      <main>
        {questions.map((question, index) => (
          <div
            style={{
              padding: '1rem',
              border: `1px solid ${Color.borderGray()}`,
              marginTop: index === 0 ? 0 : '1rem'
            }}
            key={question.id}
          >
            {question.content}
            {question.choices.map((choice, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginTop: '1rem'
                }}
              >
                <span>{choice.label}</span>
                {choice.isAnswer && (
                  <span
                    style={{
                      marginLeft: '1rem',
                      color: Color.green()
                    }}
                  >
                    <Icon icon="check" />
                  </span>
                )}
              </div>
            ))}
          </div>
        ))}
      </main>
      <footer>
        <Button transparent onClick={onHide}>
          Close
        </Button>
      </footer>
      {confirmModalShown && (
        <ConfirmModal
          modalOverModal
          onHide={() => setConfirmModalShown(false)}
          title="Delete Category"
          onConfirm={async () => {
            await deleteGrammarCategory(category);
            setConfirmModalShown(false);
            onSetCategories((categories) =>
              categories.filter((c) => c !== category)
            );
            onHide();
          }}
        />
      )}
    </Modal>
  );

  async function handleChangeLabel() {
    await editGrammarCategory({ category, newCategory: editiedCategory });
    onEditGrammarCategory({ category, newCategory: editiedCategory });
    setIsEditing(false);
  }
}
