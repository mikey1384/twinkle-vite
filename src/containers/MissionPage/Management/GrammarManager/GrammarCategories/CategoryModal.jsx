import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
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
        <div style={{ display: 'flex' }}>
          <div>
            <span style={{ textTransform: 'capitalize' }}>{category}</span>
          </div>
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
            <small>
              <Icon icon="pencil-alt" /> Edit
            </small>
            <small style={{ marginLeft: '2rem' }}>
              <Icon icon="trash-alt" /> Delete
            </small>
          </div>
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
}
