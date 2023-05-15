import React from 'react';

export default function DefaultComponent({ linkType }: { linkType: string }) {
  return (
    <div>
      <div>
        <div>this is a default content type {linkType}</div>
      </div>
    </div>
  );
}
