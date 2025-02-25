import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '~/contexts';
import VideoPlayerWithSubtitles from './VideoPlayerWithSubtitles';

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
  const [progressStage, setProgressStage] = useState<string>('');
  const [translationProgress, setTranslationProgress] = useState<number>(0);
  const [translationStage, setTranslationStage] = useState<string>('');
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

  // State for subtitle editing
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null); // Stabilized video URL
  const [srtContent, setSrtContent] = useState<string>('');
  const [subtitles, setSubtitles] = useState<SrtSegment[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const playTimeoutRef = useRef<number | null>(null);
  const [editingTimes, setEditingTimes] = useState<{ [key: string]: string }>(
    {}
  );

  const MAX_MB = 250;
  const MAX_FILE_SIZE = MAX_MB * 1024 * 1024;

  // Manage video URL creation and cleanup
  useEffect(() => {
    if (videoFile) {
      // Revoke any existing URL before creating a new one
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }

      const url = URL.createObjectURL(videoFile);
      setVideoUrl(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      // Clean up URL when videoFile is null
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
        setVideoUrl(null);
      }
    }
  }, [videoFile]);

  // --- Generate Subtitles ---
  async function handleFileUpload() {
    setError('');
    setFinalSrt('');
    setProgress(0);
    setProgressStage('');
    setTranslationProgress(0);
    setTranslationStage('');

    if (!selectedFile) {
      setError('No file selected');
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError(`File exceeds ${MAX_MB}MB limit`);
      return;
    }

    setLoading(true);
    setProgressStage('Preparing file');

    try {
      const reader = new FileReader();
      const fileBase64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      setProgressStage('Uploading to server');
      const { srt } = await generateVideoSubtitles({
        chunk: fileBase64,
        targetLanguage,
        filename: selectedFile.name,
        onProgress: (progress: number) => {
          // Update progress state
          setProgress(progress);
          if (progress >= 99) {
            setProgressStage('Processing audio');
            setProgress(100);

            // Start mock translation progress after processing audio
            let mockProgress = 0;
            setTranslationStage('Analyzing speech patterns');

            const mockInterval = setInterval(() => {
              // Slow down progress, especially towards the end
              let increment;
              if (mockProgress < 30) {
                increment = Math.random() * 1.5; // Faster at the beginning
              } else if (mockProgress < 60) {
                increment = Math.random() * 1.0; // Medium speed
              } else if (mockProgress < 85) {
                increment = Math.random() * 0.7; // Slower
              } else {
                increment = Math.random() * 0.3; // Very slow at the end
              }

              mockProgress += increment;
              if (mockProgress >= 100) {
                mockProgress = 100;
                clearInterval(mockInterval);
              }

              // Update the UI with translation progress
              if (mockProgress < 30) {
                setTranslationStage('Analyzing speech patterns');
              } else if (mockProgress < 60) {
                setTranslationStage('Translating content');
              } else if (mockProgress < 90) {
                setTranslationStage('Synchronizing subtitles');
              } else {
                setTranslationStage('Finalizing subtitles');
              }

              setTranslationProgress(mockProgress);
            }, 500); // Slower interval (500ms instead of 300ms)
          }
        }
      });

      if (!srt) {
        throw new Error('No SRT data received from server');
      }

      setTranslationStage('Complete');
      setTranslationProgress(100);

      const parsedSegments = parseSrt(srt);
      setFinalSrt(buildSrt(parsedSegments));

      // Automatically set up the subtitle editor with the generated subtitles and video
      setVideoFile(selectedFile);
      setSrtContent(buildSrt(parsedSegments));
      setSubtitles(parsedSegments);

      // Scroll to the editor section
      setTimeout(() => {
        const editorSection = document.getElementById(
          'subtitle-editor-section'
        );
        if (editorSection) {
          editorSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 500);
    } catch (err: any) {
      console.error(err);
      setProgressStage('Error');
      setTranslationStage('Error');
      // Provide more specific error messages based on the error type
      if (err.message === 'No SRT data received from server') {
        setError('Server returned empty subtitle data. Please try again.');
      } else if (err.response?.status === 413) {
        setError(`File too large for server processing. Try a smaller file.`);
      } else if (
        err.code === 'ECONNABORTED' ||
        err.message?.includes('timeout')
      ) {
        setError(
          'Request timed out. The video may be too large or server is busy.'
        );
      } else {
        setError(
          `Error generating subtitles: ${err.message || 'Unknown error'}`
        );
      }
    } finally {
      setLoading(false);
    }
  }

  // --- Split SRT ---
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

  // --- Merge SRT ---
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

  // --- Download SRT ---
  function handleDownload() {
    const blob = new Blob([finalSrt], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'subtitles.srt';
    link.click();
    window.URL.revokeObjectURL(url);
  }

  // --- Subtitle Editing Functions ---
  function handlePlayerReady(player: any) {
    setCurrentPlayer(player);
    player.on('play', () => setIsPlaying(true));
    player.on('pause', () => setIsPlaying(false));
    player.on('ended', () => setIsPlaying(false));

    // Add time update listener
    player.on('timeupdate', () => {
      const timeDisplay = document.getElementById('current-timestamp');
      if (timeDisplay && player) {
        const currentTime = player.currentTime();
        timeDisplay.textContent = secondsToSrtTime(currentTime).replace(
          ',',
          '.'
        );
      }
    });
  }

  function handleEditSubtitle(
    index: number,
    field: 'start' | 'end' | 'text',
    value: number | string
  ) {
    if (field === 'text') {
      const newSubtitles = subtitles.map((sub, i) =>
        i === index ? { ...sub, text: value as string } : sub
      );
      setSubtitles(newSubtitles);
      return;
    }

    // Store the intermediate editing value
    const editKey = `${index}-${field}`;
    setEditingTimes((prev) => ({ ...prev, [editKey]: value as string }));

    const numValue = parseFloat(value as string);
    if (isNaN(numValue) || numValue < 0) {
      return;
    }

    // Get the current subtitle and adjacent ones
    const currentSub = subtitles[index];
    const prevSub = index > 0 ? subtitles[index - 1] : null;
    const nextSub = index < subtitles.length - 1 ? subtitles[index + 1] : null;

    // Validate based on field type
    if (field === 'start') {
      // Allow setting start time to match previous subtitle's start time
      if (prevSub && numValue < prevSub.start) return;
      // Start time can't be after current end time
      if (numValue >= currentSub.end) return;
    } else if (field === 'end') {
      // End time can't be before current start time
      if (numValue <= currentSub.start) return;
      // Allow extending end time to match next subtitle's end time
      if (nextSub && numValue > nextSub.end) return;
    }

    const newSubtitles = subtitles.map((sub, i) =>
      i === index ? { ...sub, [field]: numValue } : sub
    );
    setSubtitles(newSubtitles);
  }

  function handleTimeInputBlur(index: number, field: 'start' | 'end') {
    const editKey = `${index}-${field}`;
    setEditingTimes((prev) => {
      const newTimes = { ...prev };
      delete newTimes[editKey];
      return newTimes;
    });
  }

  function handleSeekToSubtitle(startTime: number) {
    if (currentPlayer) {
      currentPlayer.currentTime(startTime);
    }
  }

  function handlePlaySubtitle(startTime: number, endTime: number) {
    if (!currentPlayer) return;

    // Clear any existing timeout
    if (playTimeoutRef.current) {
      window.clearTimeout(playTimeoutRef.current);
      playTimeoutRef.current = null;
    }

    // If we're already playing, pause first
    if (isPlaying) {
      currentPlayer.pause();
      setIsPlaying(false);
      return;
    }

    // Seek to start time and play
    currentPlayer.currentTime(startTime);
    currentPlayer.play();
    setIsPlaying(true);

    // Set timeout to pause at end time
    const duration = (endTime - startTime) * 1000; // Convert to milliseconds
    playTimeoutRef.current = window.setTimeout(() => {
      currentPlayer.pause();
      setIsPlaying(false);
      playTimeoutRef.current = null;
    }, duration);
  }

  function handleUpdateSubtitles() {
    const updatedSrt = buildSrt(subtitles);
    setSrtContent(updatedSrt);
  }

  function handleSaveEditedSrt() {
    const updatedSrt = buildSrt(subtitles);
    const blob = new Blob([updatedSrt], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'edited_subtitles.srt';
    link.click();
    window.URL.revokeObjectURL(url);
  }

  function handleInsertSubtitle(index: number) {
    const currentSub = subtitles[index];
    const nextSub = subtitles[index + 1];

    // Calculate new timings
    let newStart, newEnd;
    if (nextSub) {
      // If there's a next subtitle, insert between current and next
      newStart = currentSub.end;
      newEnd = Math.min(nextSub.start, currentSub.end + 2); // 2 seconds default duration, but don't overlap
    } else {
      // If it's the last subtitle, add after it
      newStart = currentSub.end;
      newEnd = currentSub.end + 2; // 2 seconds default duration
    }

    // Create new subtitle block
    const newSubtitle: SrtSegment = {
      index: currentSub.index + 1,
      start: newStart,
      end: newEnd,
      text: ''
    };

    // Insert new subtitle and reindex all subsequent subtitles
    const updatedSubtitles = [
      ...subtitles.slice(0, index + 1),
      newSubtitle,
      ...subtitles.slice(index + 1).map((sub) => ({
        ...sub,
        index: sub.index + 1
      }))
    ];

    setSubtitles(updatedSubtitles);
  }

  function handleRemoveSubtitle(index: number) {
    if (
      !window.confirm('Are you sure you want to remove this subtitle block?')
    ) {
      return;
    }

    const updatedSubtitles = subtitles
      .filter((_, i) => i !== index)
      .map((sub, i) => ({
        ...sub,
        index: i + 1 // Reindex remaining subtitles
      }));

    setSubtitles(updatedSubtitles);
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playTimeoutRef.current) {
        window.clearTimeout(playTimeoutRef.current);
      }
    };
  }, []);

  // --- JSX Return ---
  return (
    <div style={{ padding: 20 }}>
      {/* Proper padding element to ensure we can scroll to the very top */}
      <div
        id="top-padding"
        style={{ height: '60px', marginBottom: '20px' }}
      ></div>

      <h1>Tools</h1>

      {/* Generate Subtitles Section */}
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

      {/* Split/Merge Operations Section */}
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

      {/* Edit Subtitles Section */}
      <div style={{ marginTop: 20 }} id="subtitle-editor-section">
        <h2>Edit Subtitles</h2>

        {/* Quick Navigation Bar - Only show when not in extraction mode */}
        {subtitles.length > 0 && !videoFile && (
          <div
            style={{
              marginBottom: 20,
              padding: '10px 15px',
              backgroundColor: '#f8f9fa',
              borderRadius: '4px',
              border: '1px solid #dee2e6',
              display: 'flex',
              gap: '10px',
              flexWrap: 'wrap'
            }}
          >
            <button
              onClick={() => {
                const topPadding = document.getElementById('top-padding');
                if (topPadding) {
                  topPadding.scrollIntoView({ behavior: 'smooth' });
                } else {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              style={{
                padding: '8px 12px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9em'
              }}
            >
              ↑ Back to Top
            </button>
            <button
              onClick={() => {
                const generateSection = document.querySelector('h2');
                if (generateSection) {
                  generateSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              style={{
                padding: '8px 12px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9em'
              }}
            >
              Generate Subtitles
            </button>
            <button
              onClick={() => {
                const splitMergeSection = document.querySelectorAll('h2')[1];
                if (splitMergeSection) {
                  splitMergeSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              style={{
                padding: '8px 12px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9em'
              }}
            >
              Split/Merge Operations
            </button>
          </div>
        )}

        {/* File input fields - Show when not in extraction mode or when video is loaded but no subtitles */}
        {(!videoFile || (videoFile && subtitles.length === 0)) && (
          <div style={{ marginBottom: 20 }}>
            {!videoFile && (
              <div style={{ marginBottom: 10 }}>
                <label>Load Video: </label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setVideoFile(e.target.files[0]);
                    }
                  }}
                />
              </div>
            )}
            <div style={{ marginBottom: 10 }}>
              <label>Load SRT: </label>
              <input
                type="file"
                accept=".srt"
                onChange={async (e) => {
                  if (e.target.files?.[0]) {
                    const file = e.target.files[0];
                    const text = await file.text();
                    setSrtContent(text);
                    const parsed = parseSrt(text);
                    setSubtitles(parsed);
                  }
                }}
              />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {videoUrl && (
            <div
              style={{
                position: 'sticky',
                top: '10px',
                zIndex: 100,
                backgroundColor: 'rgba(255, 255, 255, 0.85)', // Semi-transparent white
                backdropFilter: 'blur(5px)', // Add subtle blur effect
                padding: '10px',
                borderBottom: '1px solid rgba(238, 238, 238, 0.8)',
                marginBottom: '20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
                maxHeight: '50vh',
                overflow: 'visible',
                transition: 'max-height 0.3s ease',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)' // Subtle shadow for depth
              }}
            >
              <VideoPlayerWithSubtitles
                videoUrl={videoUrl}
                srtContent={srtContent}
                onPlayerReady={handlePlayerReady}
              />

              {/* Current timestamp display */}
              <div
                style={{
                  marginTop: '5px',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  backgroundColor: 'rgba(248, 249, 250, 0.7)',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid rgba(222, 226, 230, 0.7)',
                  display: 'inline-block'
                }}
              >
                Current time: <span id="current-timestamp">00:00:00.000</span>
              </div>

              {/* Add file change buttons */}
              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  marginTop: '10px',
                  width: '50%',
                  justifyContent: 'center'
                }}
              >
                <button
                  onClick={() => {
                    // Create a hidden file input and trigger it
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'video/*';
                    input.onchange = (e) => {
                      const files = (e.target as HTMLInputElement).files;
                      if (files && files[0]) {
                        // First set videoUrl to null to ensure clean state
                        setVideoUrl(null);
                        // Then set the new video file
                        setTimeout(() => {
                          setVideoFile(files[0]);
                        }, 100);
                      }
                    };
                    input.click();
                  }}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: 'rgba(108, 117, 125, 0.85)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.9em',
                    backdropFilter: 'blur(2px)',
                    transition: 'background-color 0.2s'
                  }}
                >
                  Change Video
                </button>
                <button
                  onClick={() => {
                    // Create a hidden file input and trigger it
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.srt';
                    input.onchange = async (e) => {
                      const files = (e.target as HTMLInputElement).files;
                      if (files && files[0]) {
                        const file = files[0];
                        const text = await file.text();
                        setSrtContent(text);
                        const parsed = parseSrt(text);
                        setSubtitles(parsed);
                      }
                    };
                    input.click();
                  }}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: 'rgba(23, 162, 184, 0.85)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.9em',
                    backdropFilter: 'blur(2px)',
                    transition: 'background-color 0.2s'
                  }}
                >
                  Change Subtitles
                </button>
              </div>
            </div>
          )}

          {subtitles.length > 0 && (
            <div style={{ marginTop: '20px', paddingBottom: '80px' }}>
              <h3>Subtitles</h3>
              <div style={{ marginBottom: 10 }}>
                {subtitles.map((sub, index) => (
                  <React.Fragment key={index}>
                    <div
                      style={{
                        marginBottom: 10,
                        padding: 10,
                        border: '1px solid #ddd',
                        borderRadius: 4,
                        backgroundColor: '#f9f9f9'
                      }}
                    >
                      <div
                        style={{
                          marginBottom: 5,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <span style={{ fontWeight: 'bold' }}>#{sub.index}</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleRemoveSubtitle(index)}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: 4,
                              cursor: 'pointer',
                              fontSize: '0.9em'
                            }}
                            title="Remove this subtitle block"
                          >
                            Remove
                          </button>
                          <button
                            onClick={() => handleInsertSubtitle(index)}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#17a2b8',
                              color: 'white',
                              border: 'none',
                              borderRadius: 4,
                              cursor: 'pointer',
                              fontSize: '0.9em'
                            }}
                            title="Insert new subtitle block after this one"
                          >
                            Insert Below
                          </button>
                        </div>
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <textarea
                          value={sub.text}
                          onChange={(e) =>
                            handleEditSubtitle(index, 'text', e.target.value)
                          }
                          style={{
                            width: '100%',
                            minHeight: '60px',
                            padding: '8px',
                            borderRadius: 4,
                            border: '1px solid #ddd',
                            resize: 'vertical',
                            fontFamily: 'inherit',
                            fontSize: 'inherit',
                            lineHeight: '1.4'
                          }}
                        />
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          gap: 10,
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <label style={{ marginRight: 5 }}>Start:</label>
                          <input
                            type="text"
                            pattern="[0-9]*[.]?[0-9]*"
                            value={
                              editingTimes[`${index}-start`] ??
                              sub.start.toFixed(3)
                            }
                            onChange={(e) =>
                              handleEditSubtitle(index, 'start', e.target.value)
                            }
                            onBlur={() => handleTimeInputBlur(index, 'start')}
                            style={{ width: 100 }}
                          />
                        </div>
                        <div>
                          <label style={{ marginRight: 5 }}>End:</label>
                          <input
                            type="text"
                            pattern="[0-9]*[.]?[0-9]*"
                            value={
                              editingTimes[`${index}-end`] ?? sub.end.toFixed(3)
                            }
                            onChange={(e) =>
                              handleEditSubtitle(index, 'end', e.target.value)
                            }
                            onBlur={() => handleTimeInputBlur(index, 'end')}
                            style={{ width: 100 }}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button
                            onClick={() => handleSeekToSubtitle(sub.start)}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#6c757d',
                              color: 'white',
                              border: 'none',
                              borderRadius: 4,
                              cursor: 'pointer'
                            }}
                            title="Move playhead to this subtitle's start time"
                          >
                            Move to
                          </button>
                          <button
                            onClick={() =>
                              handlePlaySubtitle(sub.start, sub.end)
                            }
                            style={{
                              padding: '4px 8px',
                              backgroundColor: isPlaying
                                ? '#dc3545'
                                : '#007bff',
                              color: 'white',
                              border: 'none',
                              borderRadius: 4,
                              cursor: 'pointer',
                              minWidth: '60px'
                            }}
                            title={
                              isPlaying
                                ? 'Pause playback'
                                : 'Play this subtitle segment'
                            }
                          >
                            {isPlaying ? 'Pause' : 'Play'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Fixed Action Bar */}
        {subtitles.length > 0 && (
          <div
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '15px 20px',
              backgroundColor: 'white',
              borderTop: '1px solid #eee',
              display: 'flex',
              gap: 10,
              justifyContent: 'center',
              zIndex: 100,
              boxShadow: '0 -2px 4px rgba(0,0,0,0.1)'
            }}
          >
            <button
              onClick={handleUpdateSubtitles}
              style={{
                padding: '8px 16px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer'
              }}
            >
              Update Preview
            </button>
            <button
              onClick={handleSaveEditedSrt}
              style={{
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer'
              }}
            >
              Save Edited SRT
            </button>
          </div>
        )}
      </div>

      {/* Error and Progress Displays */}
      {error && <p style={{ color: 'red', marginTop: 10 }}>{error}</p>}

      {/* Audio Processing Progress - Hide when editor is loaded */}
      {(progress > 0 || progressStage) && !videoFile && (
        <div
          style={{
            marginTop: 10,
            padding: '10px 15px',
            backgroundColor: '#f8f9fa',
            borderRadius: '4px',
            border: '1px solid #dee2e6'
          }}
        >
          <div style={{ marginBottom: 5 }}>
            <strong>Audio Processing:</strong> {progressStage || 'Starting...'}
          </div>
          <div
            style={{
              height: '20px',
              backgroundColor: '#e9ecef',
              borderRadius: '4px',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                backgroundColor: progress === 100 ? '#28a745' : '#007bff',
                transition: 'width 0.3s ease'
              }}
            />
          </div>
          <div style={{ fontSize: '0.9em', marginTop: 5, textAlign: 'right' }}>
            {progress.toFixed(1)}%
          </div>
        </div>
      )}

      {/* Translation Progress - Hide when editor is loaded */}
      {(translationProgress > 0 || translationStage) && !videoFile && (
        <div
          style={{
            marginTop: 10,
            padding: '10px 15px',
            backgroundColor: '#f8f9fa',
            borderRadius: '4px',
            border: '1px solid #dee2e6'
          }}
        >
          <div style={{ marginBottom: 5 }}>
            <strong>Translation Progress:</strong>{' '}
            {translationStage || 'Starting...'}
          </div>
          <div
            style={{
              height: '20px',
              backgroundColor: '#e9ecef',
              borderRadius: '4px',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${translationProgress}%`,
                backgroundColor:
                  translationProgress === 100 ? '#28a745' : '#17a2b8',
                transition: 'width 0.5s ease'
              }}
            />
          </div>
          <div style={{ fontSize: '0.9em', marginTop: 5, textAlign: 'right' }}>
            {translationProgress.toFixed(1)}%
          </div>
        </div>
      )}

      {/* Back to Top Button */}
      {subtitles.length > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: '80px',
            right: '20px',
            zIndex: 1000
          }}
        >
          <button
            onClick={() => {
              const topPadding = document.getElementById('top-padding');
              if (topPadding) {
                topPadding.scrollIntoView({ behavior: 'smooth' });
              } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            style={{
              padding: '10px 15px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '50px',
              height: '50px',
              cursor: 'pointer',
              boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}
            title="Back to Top"
          >
            ↑
          </button>
        </div>
      )}

      {/* Final Subtitles Display - Only show for split/merge operations, not for extraction */}
      {finalSrt && !videoFile && (
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
            <button onClick={handleDownload}>Download .srt</button>
            <button
              onClick={() => {
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
      )}

      {/* Tip for extracted subtitles - Only show briefly before scrolling to editor */}
      {finalSrt && videoFile && !subtitles.length && (
        <div style={{ marginTop: 15 }}>
          <p
            style={{
              padding: '10px',
              backgroundColor: '#e8f4f8',
              borderLeft: '4px solid #17a2b8',
              borderRadius: '4px'
            }}
          >
            <strong>Tip:</strong> Your video and subtitles are ready for editing
            in the &ldquo;Edit Subtitles&rdquo; section below.
          </p>
        </div>
      )}
    </div>
  );
}

// --- Helper Functions ---
function buildSrt(segments: SrtSegment[]): string {
  if (!segments || !Array.isArray(segments) || segments.length === 0) {
    return '';
  }

  // Sort segments by start time and ensure valid data
  const validSegments = segments
    .filter(
      (seg) =>
        typeof seg.start === 'number' &&
        typeof seg.end === 'number' &&
        !isNaN(seg.start) &&
        !isNaN(seg.end) &&
        seg.start >= 0 &&
        seg.end > seg.start
    )
    .sort((a, b) => a.start - b.start);

  if (validSegments.length === 0) {
    return '';
  }

  return validSegments
    .map((seg, i) => {
      const index = i + 1;
      const startStr = secondsToSrtTime(seg.start);
      const endStr = secondsToSrtTime(seg.end);
      return `${index}\n${startStr} --> ${endStr}\n${(
        seg.text || ''
      ).trim()}\n`;
    })
    .join('\n');
}

function secondsToSrtTime(totalSec: number): string {
  if (isNaN(totalSec) || totalSec < 0) {
    totalSec = 0;
  }

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
  if (!srtString || typeof srtString !== 'string') {
    return [];
  }

  const segments: SrtSegment[] = [];
  // Normalize line endings and handle different formats
  const normalizedSrt = srtString.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = normalizedSrt.trim().split(/\n\s*\n/);

  blocks.forEach((block, blockIndex) => {
    if (!block.trim()) return;

    const lines = block.split('\n');
    if (lines.length < 2) return;

    // Find the timing line (contains -->)
    const timingLineIndex = lines.findIndex((line) => line.includes('-->'));
    if (timingLineIndex === -1) return;

    // Parse index (use block index + 1 if not a valid number)
    const indexLine = lines[0].trim();
    const index = /^\d+$/.test(indexLine)
      ? parseInt(indexLine, 10)
      : blockIndex + 1;

    // Parse timing
    const timingLine = lines[timingLineIndex].trim();
    const timeParts = timingLine.split('-->');
    if (timeParts.length !== 2) return;

    const startStr = timeParts[0]?.trim();
    const endStr = timeParts[1]?.trim();
    if (!startStr || !endStr) return;

    const startSec = srtTimeToSeconds(startStr);
    const endSec = srtTimeToSeconds(endStr);
    if (isNaN(startSec) || isNaN(endSec) || startSec >= endSec) return;

    // Get text (all lines after timing line)
    const text = lines
      .slice(timingLineIndex + 1)
      .join('\n')
      .trim();

    segments.push({ index, start: startSec, end: endSec, text });
  });

  return segments;
}

function srtTimeToSeconds(timeStr: string): number {
  try {
    const parts = timeStr.split(',');
    if (parts.length !== 2) return NaN;

    const [hms, msStr] = parts;
    const [hh, mm, ss] = hms.split(':');

    if (!hh || !mm || !ss || !msStr) return NaN;

    const hours = parseInt(hh, 10);
    const minutes = parseInt(mm, 10);
    const seconds = parseInt(ss, 10);
    const milliseconds = parseInt(msStr, 10);

    if (
      isNaN(hours) ||
      isNaN(minutes) ||
      isNaN(seconds) ||
      isNaN(milliseconds)
    ) {
      return NaN;
    }

    return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
  } catch (e) {
    console.error('Error parsing SRT time:', e);
    return NaN;
  }
}
