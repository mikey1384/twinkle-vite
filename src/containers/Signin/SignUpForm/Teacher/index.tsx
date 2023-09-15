import React from 'react';

export default function TeacherForm({
  onSetUsername,
  onSetIsTeacherFormComplete
}: {
  onSetUsername: (username: string) => void;
  onSetIsTeacherFormComplete: (value: boolean) => void;
}) {
  console.log(onSetUsername, onSetIsTeacherFormComplete);
  return (
    <div>
      <div>Teacher Form</div>
    </div>
  );
}
