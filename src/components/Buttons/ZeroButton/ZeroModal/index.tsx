import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import ZeroMessage from './ZeroMessage';
import Rewrite from './Rewrite';

ZeroModal.propTypes = {
  contentId: PropTypes.number,
  contentType: PropTypes.string,
  onHide: PropTypes.func.isRequired,
  modalOverModal: PropTypes.bool,
  content: PropTypes.string
};
export default function ZeroModal({
  contentId,
  contentType,
  onHide,
  modalOverModal,
  content
}: {
  contentId?: number;
  contentType?: string;
  onHide: () => void;
  modalOverModal?: boolean;
  content?: string;
}) {
  const [selectedSection, setSelectedSection] = useState('main');
  return (
    <Modal
      closeWhenClickedOutside={false}
      large
      modalOverModal={modalOverModal}
      onHide={onHide}
    >
      <header>
        <div
          style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
        >
          <ZeroMessage />
        </div>
      </header>
      <main>
        {selectedSection === 'main' && (
          <div>
            What do you want to do
            <div onClick={() => setSelectedSection('rewrite')}>rewrite</div>
            <div onClick={() => setSelectedSection('upgrade')}>
              upgrade AI cards
            </div>
          </div>
        )}
        {selectedSection === 'rewrite' && (
          <Rewrite
            contentId={contentId}
            contentType={contentType}
            content={content}
          />
        )}
      </main>
      <footer>
        <Button transparent onClick={onHide}>
          Close
        </Button>
      </footer>
    </Modal>
  );
}
