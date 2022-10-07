import { useState } from 'react';
import PropTypes from 'prop-types';
import { panel } from '../Styles';
import { useHomeContext } from '~/contexts';
import EarnXPFromSubjects from './EarnXPFromSubjects';
import RecommendPosts from './RecommendPosts';
import RewardPosts from './RewardPosts';
import StartMenu from './StartMenu';
import GrammarGameModal from '../GrammarGameModal';

EarnSuggester.propTypes = {
  style: PropTypes.object
};

export default function EarnSuggester({ style }) {
  const [grammarGameModalShown, setGrammarGameModalShown] = useState(false);
  const earnSection = useHomeContext((v) => v.state.earnSection);

  return (
    <div style={style} className={panel}>
      {earnSection === 'start' ? (
        <StartMenu onSetGrammarGameModalShown={setGrammarGameModalShown} />
      ) : earnSection === 'subject' ? (
        <EarnXPFromSubjects
          onSetGrammarGameModalShown={setGrammarGameModalShown}
        />
      ) : earnSection === 'recommend' ? (
        <RecommendPosts onSetGrammarGameModalShown={setGrammarGameModalShown} />
      ) : (
        <RewardPosts onSetGrammarGameModalShown={setGrammarGameModalShown} />
      )}
      {grammarGameModalShown && (
        <GrammarGameModal onHide={() => setGrammarGameModalShown(false)} />
      )}
    </div>
  );
}
