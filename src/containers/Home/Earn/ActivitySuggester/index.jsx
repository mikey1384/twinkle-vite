import PropTypes from 'prop-types';
import { panel } from '../Styles';
import { useHomeContext } from '~/contexts';
import EarnXPFromSubjects from './EarnXPFromSubjects';
import RecommendPosts from './RecommendPosts';
import RewardPosts from './RewardPosts';
import StartMenu from './StartMenu';
import GrammarGameModal from './GrammarGameModal';
import KarmaMenu from './KarmaMenu';

ActivitySuggester.propTypes = {
  style: PropTypes.object
};

export default function ActivitySuggester({ style }) {
  const grammarGameModalShown = useHomeContext(
    (v) => v.state.grammarGameModalShown
  );
  const onSetGrammarGameModalShown = useHomeContext(
    (v) => v.actions.onSetGrammarGameModalShown
  );
  const topMenuSection = useHomeContext((v) => v.state.topMenuSection);

  return (
    <div style={style} className={panel}>
      {topMenuSection === 'start' ? (
        <StartMenu onSetGrammarGameModalShown={onSetGrammarGameModalShown} />
      ) : topMenuSection === 'karma' ? (
        <KarmaMenu />
      ) : topMenuSection === 'subject' ? (
        <EarnXPFromSubjects
          onSetGrammarGameModalShown={onSetGrammarGameModalShown}
        />
      ) : topMenuSection === 'recommend' ? (
        <RecommendPosts
          onSetGrammarGameModalShown={onSetGrammarGameModalShown}
        />
      ) : (
        <RewardPosts onSetGrammarGameModalShown={onSetGrammarGameModalShown} />
      )}
      {grammarGameModalShown && (
        <GrammarGameModal onHide={() => onSetGrammarGameModalShown(false)} />
      )}
    </div>
  );
}
