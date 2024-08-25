import React, { useState, useEffect } from 'react';
import ContentInput from './ContentInput';
import SubjectInput from './SubjectInput';
import ErrorBoundary from '~/components/ErrorBoundary';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import { useAppContext } from '~/contexts';

export default function InputModal({ onHide }: { onHide: () => void }) {
  const checkDrafts = useAppContext((v) => v.requestHelpers.checkDrafts);
  const [drafts, setDrafts] = useState([]);

  useEffect(() => {
    fetchDrafts();
    async function fetchDrafts() {
      const data = await checkDrafts({ contentType: 'subject' });
      console.log('data', data);
      setDrafts(data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  console.log('drafts', drafts);

  return (
    <ErrorBoundary componentPath="Home/Stories/InputPanel/InputModal">
      <Modal wrapped closeWhenClickedOutside={false} onHide={onHide}>
        <header>Post Something</header>
        <main>
          <div style={{ width: '100%' }}>
            <SubjectInput onModalHide={onHide} />
            <ContentInput onModalHide={onHide} />
          </div>
        </main>
        <footer>
          <Button transparent onClick={onHide}>
            Close
          </Button>
        </footer>
      </Modal>
    </ErrorBoundary>
  );
}
