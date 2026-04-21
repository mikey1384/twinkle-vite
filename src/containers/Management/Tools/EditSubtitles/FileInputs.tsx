import React from 'react';
import StylizedFileInput from '../StylizedFileInput';

interface Props {
  fileKey: number;
  subtitlesCount: number;
  videoFile: File | null;
  onSrtChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onVideoSelect: (file: File) => void;
}

export default function FileInputs({
  fileKey,
  subtitlesCount,
  videoFile,
  onSrtChange,
  onVideoSelect
}: Props) {
  if (videoFile && subtitlesCount > 0) {
    return null;
  }

  return (
    <div style={{ marginBottom: 20 }}>
      {!videoFile && (
        <div style={{ marginBottom: 10 }}>
          <StylizedFileInput
            accept="video/*"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                onVideoSelect(file);
              }
            }}
            label="Load Video:"
            buttonText="Choose Video"
            selectedFile={null}
          />
        </div>
      )}
      <div style={{ marginBottom: 10 }}>
        <StylizedFileInput
          key={fileKey}
          accept=".srt"
          onChange={onSrtChange}
          label="Load SRT:"
          buttonText="Choose SRT File"
          selectedFile={null}
        />
      </div>
    </div>
  );
}
