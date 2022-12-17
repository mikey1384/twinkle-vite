import ErrorBoundary from '~/components/ErrorBoundary';

export default function Listings() {
  return (
    <ErrorBoundary componentPath="Chat/RightMenu/AICardInfo/Market/Listings">
      <div>listings</div>
    </ErrorBoundary>
  );
}
