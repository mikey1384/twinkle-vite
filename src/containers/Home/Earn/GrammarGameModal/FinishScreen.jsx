import ErrorBoundary from '~/components/ErrorBoundary';

export default function FinishScreen() {
  return (
    <ErrorBoundary componentPath="Earn/GrammarGameModal/FinishScreen">
      <div>Game Finished</div>
    </ErrorBoundary>
  );
}
