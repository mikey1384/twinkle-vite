import ErrorBoundary from '~/components/ErrorBoundary';

export default function Offers() {
  return (
    <ErrorBoundary componentPath="components/Modals/AICardModal/UnlistedMenu/OwnerMenu/Offers">
      <div>Offers</div>
    </ErrorBoundary>
  );
}
