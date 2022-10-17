import PropTypes from 'prop-types';
import FilterBar from '~/components/FilterBar';
import localize from '~/constants/localize';
import { useNavigate } from 'react-router-dom';

const videoLabel = localize('video');
const questionsLabel = localize('questions');

PageTab.propTypes = {
  isContinuing: PropTypes.bool,
  playlistId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  questions: PropTypes.array.isRequired,
  watchTabActive: PropTypes.bool
};

export default function PageTab({
  isContinuing,
  watchTabActive,
  playlistId,
  questions
}) {
  const navigate = useNavigate();
  return (
    <FilterBar>
      <nav
        className={watchTabActive ? 'active' : ''}
        onClick={() => {
          if (!watchTabActive) {
            navigate(
              `..${
                playlistId
                  ? `?playlist=${playlistId}`
                  : isContinuing
                  ? '?continue=true'
                  : ''
              }`
            );
          }
        }}
      >
        {videoLabel}
      </nav>
      <nav
        className={watchTabActive ? '' : 'active'}
        onClick={() => {
          if (watchTabActive) {
            navigate(
              `./questions${
                playlistId
                  ? `?playlist=${playlistId}`
                  : isContinuing
                  ? '?continue=true'
                  : ''
              }`
            );
          }
        }}
      >
        {questionsLabel} {questions.length > 0 && `(${questions.length})`}
      </nav>
    </FilterBar>
  );
}
