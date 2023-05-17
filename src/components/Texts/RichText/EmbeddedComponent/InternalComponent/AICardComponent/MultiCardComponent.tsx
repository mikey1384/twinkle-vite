import React from 'react';

export default function MultiCardComponent({ src }: { src: string }) {
  return (
    <div>
      <div>multiple card mode enabled</div>
      <div>{src}</div>
    </div>
  );
}
