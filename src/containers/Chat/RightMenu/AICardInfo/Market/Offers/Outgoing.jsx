import ErrorBoundary from '~/components/ErrorBoundary';

export default function Outgoing() {
  return (
    <ErrorBoundary componentPath="Chat/RightMenu/AICardInfo/Market/Offers/Outgoing">
      <div>Outgoing</div>
    </ErrorBoundary>
  );
}
