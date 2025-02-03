import React, { useState } from 'react';
import { useAppContext } from '~/contexts';

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
  const [targetLanguage, setTargetLanguage] = useState('original');
  const [numSplits, setNumSplits] = useState(2);
  const [mergeFiles, setMergeFiles] = useState<File[]>([]);
  const [splitFile, setSplitFile] = useState<File | null>(null);
  const generateVideoSubtitles = useAppContext(
    (v) => v.requestHelpers.generateVideoSubtitles
  );
  const splitSubtitles = useAppContext((v) => v.requestHelpers.splitSubtitles);
  const mergeSubtitles = useAppContext((v) => v.requestHelpers.mergeSubtitles);
  const [loading, setLoading] = useState(false);

  const MAX_MB = 500;
  const MAX_FILE_SIZE = MAX_MB * 1024 * 1024;

  async function handleFileUpload() {
    setError('');
    setFinalSrt('');
    setProgress(0);

    if (!selectedFile) {
      setError('No file selected');
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError(`File exceeds ${MAX_MB}MB limit`);
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

  async function handleSplitSrt() {
    if (!splitFile) {
      setError('Please select an SRT file to split');
      return;
    }

    try {
      setLoading(true);
      const srtContent = await splitFile.text();
      const blob = await splitSubtitles({
        srt: srtContent,
        numSplits
      });

      // Download the zip file
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'subtitle_splits.zip';
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError('Error splitting subtitles');
    } finally {
      setLoading(false);
    }
  }

  async function handleMergeSrt() {
    if (mergeFiles.length < 2) {
      setError('Select at least 2 files to merge');
      return;
    }

    try {
      setLoading(true);
      const fileContents = await Promise.all(
        mergeFiles.map((file) => file.text())
      );

      const { srt } = await mergeSubtitles(fileContents);
      setFinalSrt(srt);
    } catch (err) {
      console.error(err);
      setError('Error merging subtitles');
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
    window.URL.revokeObjectURL(url);
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Tools</h1>

      <div style={{ marginBottom: 20 }}>
        <h2>Generate Subtitles</h2>
        <div style={{ marginBottom: 10 }}>
          <label>1. Select Video File (up to {MAX_MB}MB): </label>
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
      </div>

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
                  setSplitFile(e.target.files[0]);
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
                setNumSplits(Math.max(2, parseInt(e.target.value) || 2))
              }
            />
          </div>
          <button onClick={handleSplitSrt} disabled={loading || !splitFile}>
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
                  setMergeFiles(Array.from(e.target.files));
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
            onClick={handleMergeSrt}
            disabled={loading || mergeFiles.length < 2}
          >
            Merge {mergeFiles.length} Files
          </button>
        </div>
      </div>

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

function buildSrt(segments: SrtSegment[]): string {
  segments.sort((a, b) => a.start - b.start);

  return segments
    .map((seg, i) => {
      const index = i + 1;
      const startStr = secondsToSrtTime(seg.start);
      const endStr = secondsToSrtTime(seg.end);
      return `${index}\n${startStr} --> ${endStr}\n${seg.text.trim()}\n`;
    })
    .join('\n');
}

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

function parseSrt(srtString: string): SrtSegment[] {
  const segments: SrtSegment[] = [];
  const blocks = srtString.trim().split(/\n\s*\n/);

  blocks.forEach((block) => {
    const lines = block.split('\n');
    if (lines.length >= 3) {
      const index = parseInt(lines[0], 10);

      const times = lines[1].split('-->');
      const startStr = times[0].trim();
      const endStr = times[1].trim();
      const startSec = srtTimeToSeconds(startStr);
      const endSec = srtTimeToSeconds(endStr);

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

function srtTimeToSeconds(timeStr: string): number {
  const [hms, ms] = timeStr.split(',');
  const [hh, mm, ss] = hms.split(':');
  const hours = parseInt(hh, 10);
  const minutes = parseInt(mm, 10);
  const seconds = parseInt(ss, 10);
  const milliseconds = parseInt(ms, 10);
  return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
}
