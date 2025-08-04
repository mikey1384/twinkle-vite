import React, { useEffect, useState } from 'react';
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

export default function CategoryModal({
  category,
  categories,
  onEditGrammarCategory,
  onMoveQuestion,
  onSetCategories,
  onHide
}: {
  category: string;
  categories: any[];
  onEditGrammarCategory: (info: {
    category: string;
    newCategory: string;
  }) => void;
  onMoveQuestion: () => void;
  onSetCategories: (categories: any) => void;
  onHide: () => void;
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
  const [editedCategory, setEditedCategory] = useState(category);
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
                onKeyPress={(event: any) => {
                  if (!stringIsEmpty(editedCategory) && event.key === 'Enter') {
                    handleChangeLabel();
                  }
                }}
                value={editedCategory}
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
                  onClick={changingLabel ? undefined : handleChangeLabel}
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
            {questions.map((question: { id: number }, index) => (
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
            onSetCategories((categories: any[]) =>
              categories.filter((c: string) => c !== category)
            );
            onHide();
          }}
        />
      )}
    </Modal>
  );

  function handleMoveQuestion(questionId: number) {
    setQuestions((questions) =>
      questions.filter((q: { id: number }) => q.id !== questionId)
    );
    onMoveQuestion();
  }

  async function handleChangeLabel() {
    setChangingLabel(true);
    await editGrammarCategory({ category, newCategory: editedCategory });
    onEditGrammarCategory({ category, newCategory: editedCategory });
    setIsEditing(false);
    setChangingLabel(false);
  }
}
