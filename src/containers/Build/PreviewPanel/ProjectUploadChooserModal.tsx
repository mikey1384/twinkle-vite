import React from 'react';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import Modal from '~/components/Modal';

const chooserGridClass = css`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  max-width: 620px;
  margin: 0 auto;
`;

const chooserHintClass = css`
  margin: 0 0 1.1rem;
  font-size: 0.98rem;
  line-height: 1.5;
  color: var(--chat-text);
  opacity: 0.8;
  text-align: center;
`;

const optionButtonStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2rem 1.35rem',
  minHeight: '180px',
  borderRadius: '12px',
  transition: 'all 0.2s ease',
  cursor: 'pointer'
};

const optionIconWrapStyle: React.CSSProperties = {
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  borderRadius: '50%',
  padding: '1rem',
  marginBottom: '1rem'
};

const optionTitleStyle: React.CSSProperties = {
  fontSize: '1.18rem',
  fontWeight: 700,
  marginBottom: '0.45rem'
};

const optionDescriptionStyle: React.CSSProperties = {
  fontSize: '0.9rem',
  opacity: 0.92,
  textAlign: 'center',
  lineHeight: 1.45
};

export default function ProjectUploadChooserModal({
  isOpen,
  onClose,
  onChooseProjectFiles,
  onChooseProjectFolder,
  onChooseAssets
}: {
  isOpen: boolean;
  onClose: () => void;
  onChooseProjectFiles: () => void;
  onChooseProjectFolder: () => void;
  onChooseAssets: () => void;
}) {
  return (
    <Modal
      modalKey="BuildProjectUploadChooserModal"
      isOpen={isOpen}
      onClose={onClose}
      title="Upload to Build"
      size="lg"
      footer={
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      }
    >
      <div style={{ width: '100%' }}>
        <p className={chooserHintClass}>
          Choose whether you are importing project code, a whole project
          folder, or art and sound assets for the build.
        </p>
        <div className={chooserGridClass}>
          <Button
            variant="soft"
            tone="raised"
            color="logoBlue"
            onClick={onChooseProjectFiles}
            style={optionButtonStyle}
          >
            <div style={optionIconWrapStyle}>
              <Icon icon="upload" size="2x" />
            </div>
            <div style={optionTitleStyle}>Project files</div>
            <div style={optionDescriptionStyle}>
              Import code or text files directly into the project explorer.
            </div>
          </Button>
          <Button
            variant="soft"
            tone="raised"
            color="green"
            onClick={onChooseAssets}
            style={optionButtonStyle}
          >
            <div style={optionIconWrapStyle}>
              <Icon icon="image" size="2x" />
            </div>
            <div style={optionTitleStyle}>Assets</div>
            <div style={optionDescriptionStyle}>
              Upload sprites, backgrounds, GIFs, or audio that Lumine can
              reuse in this build.
            </div>
          </Button>
          <Button
            variant="soft"
            tone="raised"
            color="pink"
            onClick={onChooseProjectFolder}
            style={optionButtonStyle}
          >
            <div style={optionIconWrapStyle}>
              <Icon icon="folder-open" size="2x" />
            </div>
            <div style={optionTitleStyle}>Project folder</div>
            <div style={optionDescriptionStyle}>
              Import a folder and preserve nested paths for a multi-file
              project.
            </div>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
