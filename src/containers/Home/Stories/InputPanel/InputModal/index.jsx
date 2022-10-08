import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import ContentInput from './ContentInput';
import SubjectInput from './SubjectInput';
import ErrorBoundary from '~/components/ErrorBoundary';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import { isValidUrl } from '~/helpers/stringHelpers';

InputModal.propTypes = {
  onHide: PropTypes.func.isRequired
};

export default function InputModal({ onHide }) {
  const [inputOrder, setInputOrder] = useState(['subject', 'content']);
  useEffect(() => {
    loadClipboard();
    async function loadClipboard() {
      const text = await navigator.clipboard.readText();
      const storedText = localStorage.getItem('clipboard-text');
      if (isValidUrl(text) && text !== storedText) {
        setInputOrder(['content', 'subject']);
        localStorage.setItem('clipboard-text', text);
      }
    }
  }, []);

  return (
    <ErrorBoundary componentPath="Home/Stories/InputPanel/InputModal">
      <Modal onHide={onHide}>
        <header>Post Something</header>
        <main>
          <div style={{ width: '100%' }}>
            {inputOrder.map((inputType) => {
              if (inputType === 'subject') {
                return <SubjectInput onModalHide={onHide} key={inputType} />;
              } else if (inputType === 'content') {
                return <ContentInput onModalHide={onHide} key={inputType} />;
              }
            })}
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
