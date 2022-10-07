import ContentInput from './ContentInput';
import SubjectInput from './SubjectInput';
import ErrorBoundary from '~/components/ErrorBoundary';

export default function InputPanel() {
  return (
    <ErrorBoundary componentPath="Home/Stories/InputPanel/index">
      <SubjectInput />
      <ContentInput />
    </ErrorBoundary>
  );
}
