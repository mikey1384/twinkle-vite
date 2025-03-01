import React from 'react';
import { useAppContext } from '~/contexts/hooks';

interface SrtSegment {
  index: number;
  start: number;
  end: number;
  text: string;
}

interface ModalAction {
  label: string;
  action: () => void;
  primary?: boolean;
}

interface SplitMergeSubtitlesProps {
  splitFile: File | null;
  numSplits: number;
  mergeFiles: File[];
  loading: boolean;
  targetLanguage: string;
  showOriginalText: boolean;
  onSetSplitFile: (file: File) => void;
  onSetNumSplits: (num: number) => void;
  onSetMergeFiles: (files: File[]) => void;
  onSetLoading: (loading: boolean) => void;
  onSetError: (error: string) => void;
  onSetFinalSrt: (srt: string) => void;
  onSetSrtContent: (content: string) => void;
  onSetSubtitles: (subtitles: SrtSegment[]) => void;
  onSetModalTitle: (title: string) => void;
  onSetModalContent: (content: string) => void;
  onSetModalActions: (actions: ModalAction[]) => void;
  onSetShowResultModal: (show: boolean) => void;
  parseSrt: (
    srtString: string,
    targetLanguage: string,
    showOriginalText: boolean
  ) => SrtSegment[];
  mergeSubtitles: (fileContents: string[]) => Promise<{ srt: string }>;
}

export default function SplitMergeSubtitles({
  splitFile,
  numSplits,
  mergeFiles,
  loading,
  targetLanguage,
  showOriginalText,
  onSetSplitFile,
  onSetNumSplits,
  onSetMergeFiles,
  onSetLoading,
  onSetError,
  onSetFinalSrt,
  onSetSrtContent,
  onSetSubtitles,
  onSetModalTitle,
  onSetModalContent,
  onSetModalActions,
  onSetShowResultModal,
  parseSrt,
  mergeSubtitles
}: SplitMergeSubtitlesProps) {
  const splitSubtitles = useAppContext((v) => v.requestHelpers.splitSubtitles);
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
          onClick={handleMergeSrt}
          disabled={loading || mergeFiles.length < 2}
        >
          Merge {mergeFiles.length} Files
        </button>
      </div>
    </div>
  );

  async function handleMergeSrt() {
    if (mergeFiles.length < 2) {
      onSetError('Select at least 2 files to merge');
      return;
    }

    try {
      onSetLoading(true);

      const fileContents = await Promise.all(
        mergeFiles.map((file) => file.text())
      );

      const { srt } = await mergeSubtitles(fileContents);

      onSetFinalSrt(srt);

      // Show the merged result in a popup
      const parsedSegments = parseSrt(srt, targetLanguage, showOriginalText);
      onSetModalTitle('Merged Subtitles');
      onSetModalContent(srt);
      onSetModalActions([
        {
          label: 'Download SRT',
          action: () => {
            const blob = new Blob([srt], {
              type: 'text/plain;charset=utf-8'
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'subtitles.srt';
            link.click();
            window.URL.revokeObjectURL(url);

            onSetShowResultModal(false);
          }
        },
        {
          label: 'Edit in Subtitle Editor',
          action: () => {
            // Load the merged result into the subtitle editor

            onSetSrtContent(srt);
            onSetSubtitles(parsedSegments);
            onSetShowResultModal(false);

            // Scroll to the editor section
            setTimeout(() => {
              const editorSection = document.getElementById(
                'subtitle-editor-section'
              );
              if (editorSection) {
                editorSection.scrollIntoView({ behavior: 'smooth' });
              }
            }, 300);
          },
          primary: true
        },
        {
          label: 'Close',
          action: () => onSetShowResultModal(false)
        }
      ]);
      onSetShowResultModal(true);
    } catch (err) {
      console.error(err);
      onSetError('Error merging subtitles');
    } finally {
      onSetLoading(false);
    }
  }

  async function handleSplitSrt() {
    if (!splitFile) {
      onSetError('Please select an SRT file to split');
      return;
    }

    try {
      onSetLoading(true);
      const srtContent = await splitFile.text();
      const blob = await splitSubtitles({
        srt: srtContent,
        numSplits
      });

      // Instead of immediately downloading, show a popup
      onSetModalTitle(`Split Complete: ${splitFile.name}`);
      onSetModalContent(
        `The file has been successfully split into ${numSplits} parts.`
      );
      onSetModalActions([
        {
          label: 'Download ZIP',
          action: () => {
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'subtitle_splits.zip';
            link.click();
            window.URL.revokeObjectURL(url);
            onSetShowResultModal(false);
          },
          primary: true
        },
        {
          label: 'Close',
          action: () => onSetShowResultModal(false)
        }
      ]);
      onSetShowResultModal(true);
    } catch (err) {
      console.error(err);
      onSetError('Error splitting subtitles');
    } finally {
      onSetLoading(false);
    }
  }
}
