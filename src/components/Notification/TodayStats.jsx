import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { Color, borderRadius } from '~/constants/css';

export default function TodayStats() {
  return (
    <ErrorBoundary componentPath="Notification/TodayStats">
      <div
        style={{ marginBottom: '1rem' }}
        className={css`
          padding: 1.5rem 0;
          font-size: 2rem;
          text-align: center;
          border-radius: ${borderRadius};
          border: 1px solid ${Color.borderGray()};
          background: #fff;
        `}
      >
        today stats
      </div>
    </ErrorBoundary>
  );
}
