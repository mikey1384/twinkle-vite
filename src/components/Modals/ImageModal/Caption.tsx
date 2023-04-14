import React from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import LongText from '~/components/Texts/LongText';
import CaptionEditor from '~/components/Texts/CaptionEditor';
import { stringIsEmpty } from '~/helpers/stringHelpers';

export default function Caption({
  caption,
  isEditing,
  editedCaption,
  onSetEditedCaption,
  userIsUploader
}: {
  caption: string;
  isEditing: boolean;
  editedCaption: string;
  onSetEditedCaption: (text: string) => void;
  userIsUploader: boolean;
}) {
  return (
    <ErrorBoundary componentPath="ImageModal/Caption">
      {userIsUploader && (stringIsEmpty(caption) || isEditing) ? (
        <CaptionEditor
          style={{ marginTop: '2rem' }}
          text={editedCaption}
          onSetText={onSetEditedCaption}
        />
      ) : !stringIsEmpty(caption) ? (
        <LongText style={{ marginTop: '2rem' }}>{caption}</LongText>
      ) : null}
    </ErrorBoundary>
  );
}
