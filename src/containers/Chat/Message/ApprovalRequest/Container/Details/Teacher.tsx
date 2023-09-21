import React from 'react';

export default function Teacher({ content }: { content: string }) {
  return (
    <div>
      <div>{content}</div>
      {`Hi, my name is XXX and I'm a teacher at XXX, XXX. I would like to request a teacher account.`}
    </div>
  );
}
