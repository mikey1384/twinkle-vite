import React from 'react';
import PropTypes from 'prop-types';
import {
  TOTAL_TRIES_TEXT,
  SUCCESS_RATE_TEXT,
  CURRENT_STREAK_TEXT,
  BEST_STREAK_TEXT
} from '../constants/strings';
import ErrorBoundary from '~/components/ErrorBoundary';

StatItem.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired
};
function StatItem({ label, value }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: '1rem'
      }}
    >
      <div style={{ fontWeight: 'bold', fontSize: '2rem', lineHeight: 1 }}>
        {value}
      </div>
      <div
        style={{
          fontSize: '1.2rem',
          lineHeight: 1,
          marginTop: '0.5rem'
        }}
      >
        {label}
      </div>
    </div>
  );
}

StatBar.propTypes = {
  isGameOver: PropTypes.bool,
  stats: PropTypes.object.isRequired,
  style: PropTypes.object
};
export default function StatBar({ stats, style, isGameOver }) {
  return (
    <ErrorBoundary componentPath="WordleModal/OverviewModal/StatBar">
      <div style={{ display: 'flex', flexDirection: 'column', ...style }}>
        {isGameOver && (
          <div
            style={{
              fontWeight: 'bold',
              textAlign: 'center',
              fontSize: '1.7rem'
            }}
          >
            Your Stats
          </div>
        )}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: isGameOver ? '1.2rem' : 0
          }}
        >
          <StatItem label={TOTAL_TRIES_TEXT} value={stats.totalGames} />
          <StatItem
            label={SUCCESS_RATE_TEXT}
            value={`${
              Math.round((stats.numSuccess * 100 * 10) / stats.totalGames) / 10
            }%`}
          />
          <StatItem label={CURRENT_STREAK_TEXT} value={stats.currentStreak} />
          <StatItem label={BEST_STREAK_TEXT} value={stats.bestStreak} />
        </div>
      </div>
    </ErrorBoundary>
  );
}
