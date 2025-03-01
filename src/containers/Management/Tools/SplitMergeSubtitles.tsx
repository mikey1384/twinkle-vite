import React from 'react';

interface SplitMergeSubtitlesProps {
  splitFile: File | null;
  numSplits: number;
  mergeFiles: File[];
  loading: boolean;
  onSetSplitFile: (file: File) => void;
  onSetNumSplits: (num: number) => void;
  onSetMergeFiles: (files: File[]) => void;
  onSplitSrt: () => void;
  onMergeSrt: () => void;
}

export default function SplitMergeSubtitles({
  splitFile,
  numSplits,
  mergeFiles,
  loading,
  onSetSplitFile,
  onSetNumSplits,
  onSetMergeFiles,
  onSplitSrt,
  onMergeSrt
}: SplitMergeSubtitlesProps) {
  return (
    <div style={{ marginTop: 20, marginBottom: 20 }}>
      <h2>Split/Merge Operations</h2>

      <div style={{ marginBottom: 20 }}>
        <h3>Split SRT</h3>
        <div style={{ marginBottom: 10 }}>
          <label style={{ display: 'block', marginBottom: 5 }}>
            1. Select SRT file to split:{' '}
          </label>
          <input
            type="file"
            accept=".srt"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                onSetSplitFile(e.target.files[0]);
              }
            }}
          />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={{ marginRight: 10 }}>2. Number of splits: </label>
          <input
            type="number"
            min="2"
            value={numSplits}
            onChange={(e) =>
              onSetNumSplits(Math.max(2, parseInt(e.target.value) || 2))
            }
          />
        </div>
        <button onClick={onSplitSrt} disabled={loading || !splitFile}>
          Split into {numSplits} parts
        </button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <h3>Merge SRT Files</h3>
        <div style={{ marginBottom: 10 }}>
          <label style={{ display: 'block', marginBottom: 5 }}>
            Select multiple SRT files to merge (hold Ctrl/Cmd to select
            multiple):
          </label>
          <input
            type="file"
            multiple
            accept=".srt"
            onChange={(e) => {
              if (e.target.files) {
                onSetMergeFiles(Array.from(e.target.files));
              }
            }}
          />
        </div>
        {mergeFiles.length > 0 && (
          <div style={{ marginBottom: 10, fontSize: '0.9em', color: '#666' }}>
            Selected files ({mergeFiles.length}):
            <ul style={{ margin: '5px 0', paddingLeft: 20 }}>
              {mergeFiles.map((file, index) => (
                <li key={index}>{file.name}</li>
              ))}
            </ul>
          </div>
        )}
        <button
          onClick={onMergeSrt}
          disabled={loading || mergeFiles.length < 2}
        >
          Merge {mergeFiles.length} Files
        </button>
      </div>
    </div>
  );
}
