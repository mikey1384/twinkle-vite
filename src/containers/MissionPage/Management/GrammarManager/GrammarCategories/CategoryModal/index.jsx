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
import Loading from '~/components/Loading';
import QuestionItem from './QuestionItem';

CategoryModal.propTypes = {
  category: PropTypes.string,
  categories: PropTypes.array.isRequired,
  onEditGrammarCategory: PropTypes.func.isRequired,
  onMoveQuestion: PropTypes.func.isRequired,
  onSetCategories: PropTypes.func.isRequired,
  onHide: PropTypes.func
};

export default function CategoryModal({
  category,
  categories,
  onEditGrammarCategory,
  onMoveQuestion,
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
  const [changingLabel, setChangingLabel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmModalShown, setConfirmModalShown] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editiedCategory, setEditedCategory] = useState(category);
  const [questions, setQuestions] = useState([]);
  useEffect(() => {
    init();
    async function init() {
      setLoading(true);
      const rows = await loadGrammarCategoryQuestions(category);
      setQuestions(rows);
      setLoading(false);
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
                    cursor: ${changingLabel ? 'default' : 'pointer'};
                    color: ${Color.gray()};
                    font-weight: normal;
                    font-size: 1.5rem;
                    &:hover {
                      text-decoration: ${changingLabel ? 'none' : 'underline'};
                    }
                  }
                `}`}
              >
                <small
                  style={{ opacity: changingLabel ? 0.5 : 1 }}
                  onClick={changingLabel ? null : handleChangeLabel}
                >
                  <Icon style={{ color: Color.green() }} icon="check" />
                  <span style={{ marginLeft: '0.7rem', color: Color.green() }}>
                    Change
                    {changingLabel && (
                      <Icon
                        style={{ marginLeft: '0.7rem' }}
                        icon="spinner"
                        pulse
                      />
                    )}
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
        {loading ? (
          <Loading />
        ) : (
          <div
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              flexDirection: 'column'
            }}
          >
            {questions.length === 0 && (
              <div>
                <span style={{ fontSize: '2rem' }}>No questions</span>
              </div>
            )}
            {questions.map((question, index) => (
              <QuestionItem
                key={question.id}
                categories={categories}
                index={index}
                question={question}
                onMoveQuestion={handleMoveQuestion}
              />
            ))}
          </div>
        )}
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

  function handleMoveQuestion(questionId) {
    setQuestions((questions) => questions.filter((q) => q.id !== questionId));
    onMoveQuestion();
  }

  async function handleChangeLabel() {
    setChangingLabel(true);
    await editGrammarCategory({ category, newCategory: editiedCategory });
    onEditGrammarCategory({ category, newCategory: editiedCategory });
    setIsEditing(false);
    setChangingLabel(false);
  }
}
