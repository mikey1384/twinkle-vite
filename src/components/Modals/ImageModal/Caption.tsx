import React from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import RichText from '~/components/Texts/RichText';
import CaptionEditor from '~/components/Texts/CaptionEditor';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import { Color } from '~/constants/css';

export default function Caption({
  caption,
  isEditing,
  editedCaption,
  onSetEditedCaption,
  userIsUploader,
  style
}: {
  caption: string;
  isEditing: boolean;
  editedCaption: string;
  onSetEditedCaption: (text: string) => void;
  userIsUploader: boolean;
  style?: React.CSSProperties;
}) {
  const isEditingCaption = userIsUploader && (stringIsEmpty(caption) || isEditing);
  const wrapperStyle: React.CSSProperties = {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    ...style
  };
  const containerStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: 'min(90%, 65rem)',
    padding: '1.5rem',
    borderRadius: '12px',
    border: `2px dotted ${Color.darkerGray(0.35)}`,
    background: Color.wellGray(0.15),
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    alignItems: isEditingCaption ? 'stretch' : 'center',
    justifyContent: isEditingCaption ? 'flex-start' : 'center',
    textAlign: 'center',
    minHeight: '10rem'
  };
  return (
    <ErrorBoundary componentPath="ImageModal/Caption">
      <div style={wrapperStyle}>
        <div style={containerStyle}>
          {isEditingCaption ? (
            <CaptionEditor
              style={{ width: '100%' }}
              text={editedCaption}
              onSetText={onSetEditedCaption}
            />
          ) : !stringIsEmpty(caption) ? (
            <RichText
              style={{
                width: '100%',
                margin: 0,
                textAlign: 'center'
              }}
            >
              {caption}
            </RichText>
          ) : null}
        </div>
      </div>
    </ErrorBoundary>
  );
}
