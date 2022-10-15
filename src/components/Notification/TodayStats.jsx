import ErrorBoundary from '~/components/ErrorBoundary';

export default function TodayStats() {
  return (
    <ErrorBoundary componentPath="Notification/TodayStats">
      <div>today stats</div>
    </ErrorBoundary>
  );
}
