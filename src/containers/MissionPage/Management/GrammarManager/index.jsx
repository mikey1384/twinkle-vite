import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import GrammarQuestionGenerator from './GrammarQuestionGenerator';

GrammarManager.propTypes = {
  mission: PropTypes.object.isRequired,
  onSetMissionState: PropTypes.func.isRequired
};

export default function GrammarManager({ mission, onSetMissionState }) {
  return (
    <ErrorBoundary componentPath="MissionPage/Management/GrammarManager">
      <div style={{ width: '100%', display: 'flex' }}>
        <GrammarQuestionGenerator
          mission={mission}
          onSetMissionState={onSetMissionState}
        />
      </div>
    </ErrorBoundary>
  );
}
