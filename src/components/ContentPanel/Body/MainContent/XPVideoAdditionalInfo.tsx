import React from 'react';
import AlreadyPosted from '~/components/AlreadyPosted';
import TagStatus from '~/components/TagStatus';

interface Props {
  contentType: string;
  uploader: any;
  contentId: number;
  content: string;
  loggedIn: boolean;
  onAddTags: any;
  onAddTagToContents: any;
  onLoadTags: any;
  rewardLevel: number;
  tags: any;
  theme: string;
}
export default function XPVideoAdditionalInfo({
  contentType,
  uploader,
  contentId,
  content,
  loggedIn,
  onAddTags,
  onAddTagToContents,
  onLoadTags,
  rewardLevel,
  tags,
  theme
}: Props) {
  if (contentType !== 'video') return null;
  return (
    <>
      <AlreadyPosted
        style={{
          marginTop: loggedIn && rewardLevel ? '0.5rem' : '-0.5rem',
          marginBottom: '0.5rem'
        }}
        uploaderId={(uploader || {}).id}
        contentId={contentId}
        contentType={contentType}
        url={content}
        videoCode={contentType === 'video' ? content : undefined}
      />
      <TagStatus
        onAddTags={onAddTags}
        onAddTagToContents={onAddTagToContents}
        onLoadTags={onLoadTags}
        tags={tags || []}
        contentId={contentId}
        theme={theme}
      />
    </>
  );
}
