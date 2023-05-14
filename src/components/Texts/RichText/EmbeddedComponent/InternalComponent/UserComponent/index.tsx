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
  if (pageType === 'likes') {
    return (
      <div>
        <div>likes page</div>
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
  if (pageType === 'all') {
    return (
      <div>
        <div>all posts by page</div>
        <div>{src}</div>
      </div>
    );
  }
  if (pageType === 'comments') {
    return (
      <div>
        <div>comments by page</div>
        <div>{src}</div>
      </div>
    );
  }
  if (pageType === 'subjects' && subPageType === 'byuser') {
    return (
      <div>
        <div>subjects made by page</div>
        <div>{src}</div>
      </div>
    );
  }
  if (pageType === 'subjects') {
    return (
      <div>
        <div>subjects by page</div>
        <div>{src}</div>
      </div>
    );
  }
  if (pageType === 'ai-stories') {
    return (
      <div>
        <div>ai stories by page</div>
        <div>{src}</div>
      </div>
    );
  }
  if (pageType === 'videos' && subPageType === 'byuser') {
    return (
      <div>
        <div>videos made by page</div>
        <div>{src}</div>
      </div>
    );
  }
  if (pageType === 'videos') {
    return (
      <div>
        <div>videos by page</div>
        <div>{src}</div>
      </div>
    );
  }
  if (pageType === 'links' && subPageType === 'byuser') {
    return (
      <div>
        <div>links made by page</div>
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
