import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import GrammarQuestionGenerator from './GrammarQuestionGenerator';
import SideMenu from '~/components/SideMenu';
import Icon from '~/components/Icon';

GrammarManager.propTypes = {
  mission: PropTypes.object.isRequired,
  onSetMissionState: PropTypes.func.isRequired
};

export default function GrammarManager({ mission, onSetMissionState }) {
  return (
    <ErrorBoundary componentPath="MissionPage/Management/GrammarManager">
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'flex-end',
          position: 'relative'
        }}
      >
        <SideMenu style={{ left: 0 }}>
          <nav>
            <Icon icon="bolt" />
            <span style={{ marginLeft: '1.1rem' }}>Questions</span>
          </nav>
          <nav>
            <Icon icon="film" />
            <span style={{ marginLeft: '1.1rem' }}>Categories</span>
          </nav>
        </SideMenu>
        <GrammarQuestionGenerator
          style={{ width: 'CALC(100% - 20rem)' }}
          mission={mission}
          onSetMissionState={onSetMissionState}
        />
      </div>
    </ErrorBoundary>
  );
}
