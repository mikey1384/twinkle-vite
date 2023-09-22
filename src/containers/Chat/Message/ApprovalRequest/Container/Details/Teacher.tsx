import React from 'react';

export default function Teacher({ content }: { content: string }) {
  const parsedContent = JSON.parse(content);

  const {
    realName = '',
    branchName = '---',
    className = '---'
  } = parsedContent;

  return (
    <div>
      {`Hi, my name is ${realName} and I'm a teacher at ${branchName}, ${className}. I would like to request a teacher account.`}
    </div>
  );
}
