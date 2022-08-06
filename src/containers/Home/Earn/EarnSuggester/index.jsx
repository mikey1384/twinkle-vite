import PropTypes from 'prop-types';
import { panel } from '../Styles';
import { useHomeContext } from '~/contexts';
import EarnXPFromSubjects from './EarnXPFromSubjects';
import RecommendPosts from './RecommendPosts';
import RewardPosts from './RewardPosts';
import StartMenu from './StartMenu';

EarnSuggester.propTypes = {
  style: PropTypes.object
};

export default function EarnSuggester({ style }) {
  const earnSection = useHomeContext((v) => v.state.earnSection);

  return (
    <div style={style} className={panel}>
      {earnSection === 'start' ? (
        <StartMenu />
      ) : earnSection === 'subject' ? (
        <EarnXPFromSubjects />
      ) : earnSection === 'recommend' ? (
        <RecommendPosts />
      ) : (
        <RewardPosts />
      )}
    </div>
  );
}
