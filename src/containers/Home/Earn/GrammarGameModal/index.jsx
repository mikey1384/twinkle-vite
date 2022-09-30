import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import FilterBar from '~/components/FilterBar';
import Game from './Game';
import { useAppContext } from '~/contexts';

GrammarGameModal.propTypes = {
  onHide: PropTypes.func.isRequired
};
export default function GrammarGameModal({ onHide }) {
  const [activeTab, setActiveTab] = useState('game');
  const [questions, setQuestions] = useState([]);
  const loadGrammarGame = useAppContext(
    (v) => v.requestHelpers.loadGrammarGame
  );

  useEffect(() => {
    init();
    async function init() {
      const questions = await loadGrammarGame();
      setQuestions(questions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Modal closeWhenClickedOutside={false} onHide={onHide}>
      <header style={{ padding: 0 }}>
        <FilterBar
          style={{
            marginTop: '2rem',
            height: '5rem'
          }}
        >
          <nav
            className={activeTab === 'game' ? 'active' : null}
            onClick={() => setActiveTab('game')}
          >
            The Grammar Game
          </nav>
          <nav
            className={activeTab === 'rankings' ? 'active' : null}
            onClick={() => setActiveTab('rankings')}
          >
            Top Scorers
          </nav>
        </FilterBar>
      </header>
      <main
        style={{
          padding: 0,
          marginTop: 0
        }}
      >
        {activeTab === 'game' ? (
          <Game questions={questions} />
        ) : activeTab === 'rankings' ? (
          <div>Rankings</div>
        ) : (
          <div>Something Else</div>
        )}
      </main>
      <footer></footer>
    </Modal>
  );
}
