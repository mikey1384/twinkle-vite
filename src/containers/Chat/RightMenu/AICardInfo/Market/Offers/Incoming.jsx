import ErrorBoundary from '~/components/ErrorBoundary';

export default function Incoming() {
  return (
    <ErrorBoundary componentPath="Chat/RightMenu/AICardInfo/Market/Offers/Incoming">
      <div>Incoming</div>
    </ErrorBoundary>
  );
}
