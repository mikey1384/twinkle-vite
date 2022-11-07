import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import { useAppContext } from '~/contexts';

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
        <span style={{ textTransform: 'capitalize' }}>{category}</span>
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
