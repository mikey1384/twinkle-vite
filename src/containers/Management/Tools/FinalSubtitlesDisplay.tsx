import React from 'react';

interface SrtSegment {
  index: number;
  start: number;
  end: number;
  text: string;
}

interface FinalSubtitlesDisplayProps {
  finalSrt: string;
  targetLanguage: string;
  showOriginalText: boolean;
  onDownload: () => void;
  onSetSrtContent: (content: string) => void;
  onSetSubtitles: (subtitles: SrtSegment[]) => void;
  parseSrt: (
    srtString: string,
    targetLanguage: string,
    showOriginalText: boolean
  ) => SrtSegment[];
}

export default function FinalSubtitlesDisplay({
  finalSrt,
  targetLanguage,
  showOriginalText,
  onDownload,
  onSetSrtContent,
  onSetSubtitles,
  parseSrt
}: FinalSubtitlesDisplayProps) {
  return (
    <div style={{ marginTop: 20 }}>
      <h3>Final Subtitles</h3>
      <pre
        style={{
          maxHeight: 300,
          overflowY: 'auto',
          background: '#f7f7f7',
          border: '1px solid #ccc',
          padding: 10
        }}
      >
        {finalSrt}
      </pre>
      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
        <button onClick={onDownload}>Download .srt</button>
        <button
          onClick={() => {
            // Load the final SRT into the subtitle editor
            const parsedSegments = parseSrt(
              finalSrt,
              targetLanguage,
              showOriginalText
            );

            onSetSrtContent(finalSrt);
            onSetSubtitles(parsedSegments);

            const editorSection = document.getElementById(
              'subtitle-editor-section'
            );
            if (editorSection) {
              editorSection.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          style={{
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            padding: '8px 16px',
            cursor: 'pointer'
          }}
        >
          Edit Subtitles
        </button>
      </div>
    </div>
  );
}
