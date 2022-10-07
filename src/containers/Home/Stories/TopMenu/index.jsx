import ErrorBoundary from '~/components/ErrorBoundary';
import { panel } from '../Styles';

export default function TopMenu() {
  return (
    <ErrorBoundary componentPath="Home/Stories/TopMenu">
      <div style={{ marginBottom: '1rem' }} className={panel}>
        This is the top menu
      </div>
    </ErrorBoundary>
  );
}
