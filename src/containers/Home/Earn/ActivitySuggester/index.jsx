import PropTypes from 'prop-types';
import { panel } from '../Styles';
import { useHomeContext } from '~/contexts';
import EarnXPFromSubjects from './EarnXPFromSubjects';
import RecommendPosts from './RecommendPosts';
import RewardPosts from './RewardPosts';
import StartMenu from './StartMenu';

ActivitySuggester.propTypes = {
  style: PropTypes.object
};

export default function ActivitySuggester({ style }) {
  const topMenuSection = useHomeContext((v) => v.state.topMenuSection);

  return (
    <div style={style} className={panel}>
      {topMenuSection === 'start' ? (
        <StartMenu />
      ) : topMenuSection === 'subject' ? (
        <EarnXPFromSubjects />
      ) : topMenuSection === 'recommend' ? (
        <RecommendPosts />
      ) : (
        <RewardPosts />
      )}
    </div>
  );
}
