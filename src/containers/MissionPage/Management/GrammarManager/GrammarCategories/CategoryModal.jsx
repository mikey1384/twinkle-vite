import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import Input from '~/components/Texts/Input';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import { Color } from '~/constants/css';
import { useAppContext } from '~/contexts';
import { css } from '@emotion/css';

CategoryModal.propTypes = {
  category: PropTypes.string,
  onHide: PropTypes.func
};

export default function CategoryModal({ category, onHide }) {
  const loadGrammarCategoryQuestions = useAppContext(
    (v) => v.requestHelpers.loadGrammarCategoryQuestions
  );
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
        <div style={{ display: 'flex', width: '100%' }}>
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
              <small style={{ marginLeft: '2rem' }}>
                <Icon icon="trash-alt" /> Delete
              </small>
            </div>
          )}
        </div>
      </header>
      <main>
        {questions.map((question) => (
          <div key={question.id}>{question.content}</div>
        ))}
      </main>
      <footer>
        <Button transparent onClick={onHide}>
          Close
        </Button>
      </footer>
    </Modal>
  );

  async function handleChangeLabel(text) {
    console.log(text);
  }
}
