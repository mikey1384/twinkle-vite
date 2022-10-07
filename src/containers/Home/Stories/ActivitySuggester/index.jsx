import { useState } from 'react';
import PropTypes from 'prop-types';
import { panel } from '../Styles';
import { useHomeContext } from '~/contexts';
import EarnXPFromSubjects from './EarnXPFromSubjects';
import RecommendPosts from './RecommendPosts';
import RewardPosts from './RewardPosts';
import StartMenu from './StartMenu';
import GrammarGameModal from './GrammarGameModal';

ActivitySuggester.propTypes = {
  style: PropTypes.object
};

export default function ActivitySuggester({ style }) {
  const [grammarGameModalShown, setGrammarGameModalShown] = useState(false);
  const topMenuSection = useHomeContext((v) => v.state.topMenuSection);

  return (
    <div style={style} className={panel}>
      {topMenuSection === 'start' ? (
        <StartMenu onSetGrammarGameModalShown={setGrammarGameModalShown} />
      ) : topMenuSection === 'subject' ? (
        <EarnXPFromSubjects
          onSetGrammarGameModalShown={setGrammarGameModalShown}
        />
      ) : topMenuSection === 'recommend' ? (
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
