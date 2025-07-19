import React from 'react';
import SubjectInputForm from './SubjectInputForm';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { charLimit } from '~/constants/defaultValues';
import { useAppContext, useContentContext, useKeyContext } from '~/contexts';
import { useContentState } from '~/helpers/hooks';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import localize from '~/constants/localize';

const startNewSubjectLabel = localize('startNewSubject');
const enterSubjectLabel = localize('enterSubject');
const enterDetailsLabel = localize('enterDetails');
const optionalLabel = localize('optional');

export default function StartNewSubjectPanel({
  contentId,
  contentType,
  onUploadSubject
}: {
  contentId: number;
  contentType: string;
  onUploadSubject: any;
}) {
  const uploadSubject = useAppContext((v) => v.requestHelpers.uploadSubject);
  const canEditRewardLevel = useKeyContext((v) => v.myState.canEditRewardLevel);
  const onSetSubjectFormShown = useContentContext(
    (v) => v.actions.onSetSubjectFormShown
  );
  const { subjectFormShown } = useContentState({ contentType, contentId });
  return (
    <div
      className={css`
        background: #fff;
        border: 1px solid ${Color.borderGray()};
        font-size: 1.5rem;
        margin-top: 1rem;
        @media (max-width: ${mobileMaxWidth}) {
          border-left: 0;
          border-right: 0;
        }
      `}
    >
      <div style={{ padding: '1rem' }}>
        {subjectFormShown ? (
          <div>
            <SubjectInputForm
              contentId={contentId}
              contentType={contentType}
              canEditRewardLevel={canEditRewardLevel}
              isSubject
              autoFocus
              onSubmit={handleSubmit}
              onClose={() =>
                onSetSubjectFormShown({
                  contentId,
                  contentType,
                  shown: false
                })
              }
              rows={4}
              titleMaxChar={charLimit.subject.title}
              descriptionMaxChar={charLimit.subject.description}
              titlePlaceholder={`${enterSubjectLabel}...`}
              descriptionPlaceholder={`${enterDetailsLabel}... ${optionalLabel}`}
            />
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Button
              skeuomorphic
              color="black"
              style={{ fontSize: '2rem' }}
              onClick={() =>
                onSetSubjectFormShown({ contentId, contentType, shown: true })
              }
            >
              <Icon icon="comment-alt" />
              <span style={{ marginLeft: '1rem' }}>{startNewSubjectLabel}</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  async function handleSubmit({
    title,
    description,
    rewardLevel,
    secretAnswer,
    secretAttachmentFilePath,
    secretAttachmentFileName,
    secretAttachmentFileSize,
    secretAttachmentThumbUrl
  }: {
    title: string;
    description: string;
    rewardLevel: number;
    secretAnswer: string;
    secretAttachmentFilePath: string;
    secretAttachmentFileName: string;
    secretAttachmentFileSize: number;
    secretAttachmentThumbUrl: string;
  }) {
    const data = await uploadSubject({
      title,
      description,
      contentId,
      rewardLevel,
      secretAnswer,
      contentType,
      secretAttachmentFilePath,
      secretAttachmentFileName,
      secretAttachmentFileSize,
      secretAttachmentThumbUrl
    });
    onSetSubjectFormShown({ contentId, contentType, shown: false });
    onUploadSubject({ ...data, contentType, contentId });
  }
}
