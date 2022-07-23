import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';
import localize from '~/constants/localize';
import { Color } from '~/constants/css';
import ErrorBoundary from '~/components/ErrorBoundary';

Video.propTypes = {
  rewardLevel: PropTypes.number,
  style: PropTypes.object
};

export default function Video({ rewardLevel, style }) {
  const forEveryStarYouAddLabel = localize('forEveryStarYouAdd');
  const rewardLevelDescription = useMemo(() => {
    switch (rewardLevel) {
      case 3:
        if (SELECTED_LANGUAGE === 'kr') {
          return (
            <>
              이 동영상은{' '}
              <span style={{ color: Color.pink() }}>흥미 위주의 콘텐츠</span>
              이지만 영어 듣기에 도움이 됩니다
            </>
          );
        }
        return (
          <>
            This video is{' '}
            <span style={{ color: Color.pink() }}>
              purely for entertainment
            </span>
            , but {`it's`} good for English listening
          </>
        );
      case 4:
        if (SELECTED_LANGUAGE === 'kr') {
          return (
            <>
              이 동영상은{' '}
              <span style={{ color: Color.green() }}>교육적이며</span> 영어
              듣기에 도움이 됩니다
            </>
          );
        }
        return (
          <>
            This video is{' '}
            <span style={{ color: Color.green() }}>educational</span> and good
            for English listening
          </>
        );
      case 5:
        if (SELECTED_LANGUAGE === 'kr') {
          return (
            <>
              이 동영상은{' '}
              <span style={{ color: Color.green() }}>교육적이고</span>, 영어
              듣기에 도움이 되며, 유저들이 꼭 봐야할 콘텐츠입니다
            </>
          );
        }
        return (
          <>
            This video is{' '}
            <span style={{ color: Color.green() }}>educational</span>, good for
            English listening, and I want every single user to watch it
          </>
        );
      default:
        return '';
    }
  }, [rewardLevel]);

  return (
    <ErrorBoundary componentPath="RewardLevelExplainer/Video" style={style}>
      {rewardLevelDescription && (
        <div style={{ fontSize: '1.7rem', fontWeight: 'bold' }}>
          {rewardLevelDescription}
        </div>
      )}
      <div style={{ fontSize: '1.5rem' }}>{forEveryStarYouAddLabel}</div>
    </ErrorBoundary>
  );
}
