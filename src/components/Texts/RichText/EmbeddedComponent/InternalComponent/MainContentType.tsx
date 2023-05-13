import React from 'react';

export default function MainContentType({
  contentId,
  contentType
}: {
  contentId: string;
  contentType: string;
}) {
  return (
    <div>
      <div>
        this is a normal content type {contentType} and id {contentId}
      </div>
    </div>
  );
}
