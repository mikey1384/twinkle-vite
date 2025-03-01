import React from 'react';

interface GenerateSubtitlesProps {
  MAX_MB: number;
  selectedFile: File | null;
  targetLanguage: string;
  showOriginalText: boolean;
  loading: boolean;
  onSetSelectedFile: (file: File) => void;
  onSetTargetLanguage: (language: string) => void;
  onSetShowOriginalText: (show: boolean) => void;
  onFileUpload: () => void;
}

export default function GenerateSubtitles({
  MAX_MB,
  selectedFile,
  targetLanguage,
  showOriginalText,
  loading,
  onSetSelectedFile,
  onSetTargetLanguage,
  onSetShowOriginalText,
  onFileUpload
}: GenerateSubtitlesProps) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2>Generate Subtitles</h2>
      <div style={{ marginBottom: 10 }}>
        <label>1. Select Video File (up to {MAX_MB}MB): </label>
        <input
          type="file"
          accept="video/*"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              onSetSelectedFile(e.target.files[0]);
            }
          }}
        />
      </div>
      <div style={{ marginBottom: 10 }}>
        <label>2. Output Language: </label>
        <select
          value={targetLanguage}
          onChange={(e) => onSetTargetLanguage(e.target.value)}
        >
          <option value="original">Same as Audio</option>
          <option value="english">Translate to English</option>
          <option value="korean">Translate to Korean</option>
          <option value="spanish">Translate to Spanish</option>
          <option value="french">Translate to French</option>
          <option value="german">Translate to German</option>
          <option value="chinese">Translate to Chinese</option>
          <option value="japanese">Translate to Japanese</option>
          <option value="russian">Translate to Russian</option>
          <option value="portuguese">Translate to Portuguese</option>
          <option value="italian">Translate to Italian</option>
          <option value="arabic">Translate to Arabic</option>
        </select>

        {targetLanguage !== 'original' && targetLanguage !== 'english' && (
          <div style={{ marginTop: 5 }}>
            <label>
              <input
                type="checkbox"
                checked={showOriginalText}
                onChange={(e) => onSetShowOriginalText(e.target.checked)}
                style={{ marginRight: 5 }}
              />
              Show original text
            </label>
          </div>
        )}
      </div>
      <button onClick={onFileUpload} disabled={!selectedFile || loading}>
        {loading ? 'Processing...' : 'Generate Subtitles'}
      </button>
    </div>
  );
}
