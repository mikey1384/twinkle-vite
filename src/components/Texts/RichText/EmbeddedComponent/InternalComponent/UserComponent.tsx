import React from 'react';

export default function UserComponent({ src }: { src: string }) {
  const parts = src.split('/');
  const pageType = parts[3];
  const subPageType = parts[4];

  if (pageType === 'watched') {
    return (
      <div>
        <div>watched page</div>
        <div>{src}</div>
      </div>
    );
  }
  if (pageType === 'all' && subPageType === 'byuser') {
    return (
      <div>
        <div>made by page</div>
        <div>{src}</div>
      </div>
    );
  }
  return (
    <div>
      <div>user page</div>
      <div>{src}</div>
    </div>
  );
}
