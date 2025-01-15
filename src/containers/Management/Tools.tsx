// client/src/pages/Tools.tsx

import React, { useState } from 'react';
import { useAppContext } from '~/contexts';

/**
 * Simple structure to represent one SRT cue:
 * {
 *   index: number;
 *   start: number; // in seconds
 *   end: number;   // in seconds
 *   text: string;
 * }
 */

interface SrtSegment {
  index: number;
  start: number;
  end: number;
  text: string;
}

export default function Tools() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState<number>(0);
  const [finalSrt, setFinalSrt] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('korean');
  const generateVideoSubtitles = useAppContext(
    (v) => v.requestHelpers.generateVideoSubtitles
  );
  const [loading, setLoading] = useState(false);

  const MAX_FILE_SIZE = 350 * 1024 * 1024; // 350 MB

  async function handleFileUpload() {
    setError('');
    setFinalSrt('');
    setProgress(0);

    if (!selectedFile) {
      setError('No file selected');
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError('File exceeds 350 MB limit');
      return;
    }

    setLoading(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      const fileBase64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      // Send to server
      const { srt } = await generateVideoSubtitles({
        chunk: fileBase64,
        targetLanguage,
        filename: selectedFile.name
      });

      if (!srt) {
        throw new Error('No SRT data received from server');
      }

      const parsedSegments = parseSrt(srt);
      setFinalSrt(buildSrt(parsedSegments));
    } catch (err: any) {
      console.error(err);
      setError('Error generating subtitles');
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    const blob = new Blob([finalSrt], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'subtitles.srt';
    link.click();
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Tools</h1>

      <div style={{ marginBottom: 10 }}>
        <label>1. Select Video File (up to 350MB): </label>
        <input
          type="file"
          accept="video/*"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              setSelectedFile(e.target.files[0]);
            }
          }}
        />
      </div>

      <div style={{ marginBottom: 10 }}>
        <label>2. Output Language: </label>
        <select
          value={targetLanguage}
          onChange={(e) =>
            setTargetLanguage(
              e.target.value as 'original' | 'english' | 'korean'
            )
          }
        >
          <option value="original">Same as Audio</option>
          <option value="english">Translate to English</option>
          <option value="korean">Translate to Korean</option>
        </select>
      </div>

      <button onClick={handleFileUpload} disabled={!selectedFile || loading}>
        {loading ? 'Processing...' : 'Generate Subtitles'}
      </button>

      {error && <p style={{ color: 'red', marginTop: 10 }}>{error}</p>}

      {progress > 0 && progress < 100 && (
        <div style={{ marginTop: 10 }}>
          Upload/Process Progress: {progress.toFixed(1)}%
        </div>
      )}

      {finalSrt && (
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
          <button onClick={handleDownload}>Download .srt</button>
        </div>
      )}
    </div>
  );
}

/**
 * Builds a single SRT string from an array of segments.
 * Re-numbers them from 1..N in ascending start time.
 */
function buildSrt(segments: SrtSegment[]): string {
  // 1) Sort by start time
  segments.sort((a, b) => a.start - b.start);

  // 2) Convert each segment to SRT block
  return segments
    .map((seg, i) => {
      const index = i + 1;
      const startStr = secondsToSrtTime(seg.start);
      const endStr = secondsToSrtTime(seg.end);
      return `${index}\n${startStr} --> ${endStr}\n${seg.text.trim()}\n`;
    })
    .join('\n');
}

/**
 * Convert seconds back into "HH:MM:SS,mmm"
 */
function secondsToSrtTime(totalSec: number): string {
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = Math.floor(totalSec % 60);
  const milliseconds = Math.round((totalSec - Math.floor(totalSec)) * 1000);

  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  const mmm = String(milliseconds).padStart(3, '0');
  return `${hh}:${mm}:${ss},${mmm}`;
}

/**
 * Parses an SRT string into an array of { index, start, end, text } objects.
 */
function parseSrt(srtString: string): SrtSegment[] {
  const segments: SrtSegment[] = [];
  const blocks = srtString.trim().split(/\n\s*\n/); // split by blank lines

  blocks.forEach((block) => {
    const lines = block.split('\n');
    if (lines.length >= 3) {
      // line 0 = index
      const index = parseInt(lines[0], 10);

      // line 1 = "HH:MM:SS,mmm --> HH:MM:SS,mmm"
      const times = lines[1].split('-->');
      const startStr = times[0].trim();
      const endStr = times[1].trim();
      const startSec = srtTimeToSeconds(startStr);
      const endSec = srtTimeToSeconds(endStr);

      // remaining lines are text
      const text = lines.slice(2).join('\n');

      segments.push({
        index,
        start: startSec,
        end: endSec,
        text
      });
    }
  });
  return segments;
}

/**
 * Convert "HH:MM:SS,mmm" to total seconds (float).
 */
function srtTimeToSeconds(timeStr: string): number {
  // e.g. "00:03:05,123"
  const [hms, ms] = timeStr.split(',');
  const [hh, mm, ss] = hms.split(':');
  const hours = parseInt(hh, 10);
  const minutes = parseInt(mm, 10);
  const seconds = parseInt(ss, 10);
  const milliseconds = parseInt(ms, 10);
  return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
}
