import React from 'react';

export default function StudentForm({
  onSetUsername
}: {
  onSetUsername: (username: string) => void;
}) {
  console.log(onSetUsername);
  return (
    <div>
      <div>Student Form</div>
    </div>
  );
}
