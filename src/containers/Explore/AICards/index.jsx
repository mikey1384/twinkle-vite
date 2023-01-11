import ErrorBoundary from '~/components/ErrorBoundary';

export default function AICards() {
  return (
    <ErrorBoundary componentPath="Explore/AICards">
      <div>
        <h1>AICards</h1>
      </div>
    </ErrorBoundary>
  );
}
