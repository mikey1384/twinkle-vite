import React from 'react';

export default function MainContentType({
  contentType
}: {
  contentType: string;
}) {
  return (
    <div>
      <div>this is a normal content type {contentType}</div>
    </div>
  );
}
