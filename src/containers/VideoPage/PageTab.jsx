import PropTypes from 'prop-types';
import FilterBar from '~/components/FilterBar';
import localize from '~/constants/localize';

const videoLabel = localize('video');
const questionsLabel = localize('questions');

PageTab.propTypes = {
  onQuestionTabClick: PropTypes.func.isRequired,
  onWatchTabClick: PropTypes.func.isRequired,
  questions: PropTypes.array.isRequired,
  watchTabActive: PropTypes.bool.isRequired
};

export default function PageTab({
  watchTabActive,
  onWatchTabClick,
  onQuestionTabClick,
  questions
}) {
  return (
    <FilterBar>
      <nav className={watchTabActive ? 'active' : ''} onClick={onWatchTabClick}>
        {videoLabel}
      </nav>
      <nav
        className={watchTabActive ? '' : 'active'}
        onClick={onQuestionTabClick}
      >
        {questionsLabel} {questions.length > 0 && `(${questions.length})`}
      </nav>
    </FilterBar>
  );
}
