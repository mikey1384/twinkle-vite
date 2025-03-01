import React, { useState, useEffect } from 'react';
import { useAppContext, useManagementContext } from '~/contexts';
import EditSubtitles from './EditSubtitles';
import GenerateSubtitles from './GenerateSubtitles';
import SplitMergeSubtitles from './SplitMergeSubtitles';
import TranslationProgressArea from './TranslationProgressArea';
import MergingProgressArea from './MergingProgressArea';
import BackToTopButton from './BackToTopButton';
import ResultModal from './ResultModal';
import FinalSubtitlesDisplay from './FinalSubtitlesDisplay';
import { SrtSegment, parseSrt, secondsToSrtTime } from './utils';

export default function Tools() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState<number>(0);
  const [progressStage, setProgressStage] = useState<string>('');
  const [translationProgress, setTranslationProgress] = useState<number>(0);
  const [translationStage, setTranslationStage] = useState<string>('');
  const [finalSrt, setFinalSrt] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('original');
  const [showOriginalText, setShowOriginalText] = useState(true);
  const [numSplits, setNumSplits] = useState(2);
  const [mergeFiles, setMergeFiles] = useState<File[]>([]);
  const [splitFile, setSplitFile] = useState<File | null>(null);
  const [isTranslationInProgress, setIsTranslationInProgress] = useState(false);
  const [isMergingInProgress, setIsMergingInProgress] = useState(false);
  const [mergeProgress, setMergeProgress] = useState<number>(0);
  const [mergeStage, setMergeStage] = useState<string>('');
  const mergeSubtitles = useAppContext((v) => v.requestHelpers.mergeSubtitles);
  const [loading, setLoading] = useState(false);

  // State for subtitle editing
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null); // Stabilized video URL
  const [srtContent, setSrtContent] = useState<string>('');
  const [subtitles, setSubtitles] = useState<SrtSegment[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [editingTimes, setEditingTimes] = useState<any>({});

  // Modal popup states
  const [showResultModal, setShowResultModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState('');
  const [modalActions, setModalActions] = useState<
    Array<{
      label: string;
      action: () => void;
      primary?: boolean;
    }>
  >([]);

  const MAX_MB = 2500;

  // Get subtitle translation progress from Management context
  const subtitleProgress = useManagementContext(
    (v) => v.state.subtitleTranslationProgress
  );

  // Get subtitle merge progress from Management context
  const subtitleMergeProgress = useManagementContext(
    (v) => v.state.subtitleMergeProgress
  );

  // Update local progress when management context changes
  useEffect(() => {
    if (subtitleProgress) {
      setTranslationProgress(subtitleProgress.progress);
      setTranslationStage(subtitleProgress.stage);

      // If the progress is not 0, we're in a translation process
      if (subtitleProgress.progress > 0) {
        setIsTranslationInProgress(true);
      }

      // If progress reaches 100%, we're done
      if (subtitleProgress.progress === 100) {
        // Add a small delay before hiding the progress bar
        setTimeout(() => {
          setIsTranslationInProgress(false);
        }, 2000);
      }

      if (subtitleProgress.error) {
        setError(subtitleProgress.error);
      }
    }
  }, [subtitleProgress]);

  // Update local merge progress when management context changes
  useEffect(() => {
    if (subtitleMergeProgress) {
      setMergeProgress(subtitleMergeProgress.progress);
      setMergeStage(subtitleMergeProgress.stage);

      // If the progress is not 0, we're in a merging process
      if (subtitleMergeProgress.progress > 0) {
        setIsMergingInProgress(true);
      }

      // If progress reaches 100%, we're done
      if (subtitleMergeProgress.progress === 100) {
        // Add a small delay before hiding the progress bar
        setTimeout(() => {
          setIsMergingInProgress(false);
        }, 2000);
      }

      if (subtitleMergeProgress.error) {
        setError(subtitleMergeProgress.error);
      }
    }
  }, [subtitleMergeProgress]);

  // Manage video URL creation and cleanup
  useEffect(() => {
    if (videoFile) {
      // Revoke any existing URL before creating a new one
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }

      try {
        // Create URL immediately first
        let url: string | null = null;
        try {
          url = URL.createObjectURL(videoFile);
          setVideoUrl(url);
          setError(''); // Clear any previous errors
        } catch (immediateError) {
          console.error(
            'Error creating object URL immediately:',
            immediateError
          );
          // Don't set error yet, we'll try again with a delay
        }

        // If immediate creation failed or as a backup, try again with a delay
        setTimeout(() => {
          // Only try again if the immediate attempt failed
          if (!url) {
            try {
              url = URL.createObjectURL(videoFile);
              setVideoUrl(url);
              setError(''); // Clear any previous errors
            } catch (delayedError) {
              console.error(
                'Error creating object URL (delayed):',
                delayedError
              );
              setError(
                'Failed to load video file. Please try again with a different format.'
              );
            }
          }
        }, 100);
      } catch (error) {
        console.error('Error in URL creation process:', error);
        setError('Failed to load video file. Please try again.');
      }

      return () => {
        if (videoUrl) {
          URL.revokeObjectURL(videoUrl);
        }
      };
    } else {
      // Clean up URL when videoFile is null
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
        setVideoUrl(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoFile]);

  return (
    <div
      style={{
        padding: 20,
        paddingTop: isTranslationInProgress ? 160 : 20
      }}
    >
      <div id="top-padding" style={{ height: '60px', marginBottom: '20px' }} />

      <h1>Tools</h1>

      <GenerateSubtitles
        MAX_MB={MAX_MB}
        selectedFile={selectedFile}
        targetLanguage={targetLanguage}
        showOriginalText={showOriginalText}
        loading={loading}
        onSetSelectedFile={setSelectedFile}
        onSetTargetLanguage={setTargetLanguage}
        onSetShowOriginalText={setShowOriginalText}
        onSetLoading={setLoading}
        onSetError={setError}
        onSetFinalSrt={setFinalSrt}
        onSetProgress={setProgress}
        onSetProgressStage={setProgressStage}
        onSetTranslationProgress={setTranslationProgress}
        onSetTranslationStage={setTranslationStage}
        onSetIsTranslationInProgress={setIsTranslationInProgress}
        onSetVideoFile={setVideoFile}
        onSetSrtContent={setSrtContent}
        onSetSubtitles={setSubtitles}
      />

      <SplitMergeSubtitles
        splitFile={splitFile}
        numSplits={numSplits}
        mergeFiles={mergeFiles}
        loading={loading}
        onSetSplitFile={setSplitFile}
        onSetNumSplits={setNumSplits}
        onSetMergeFiles={setMergeFiles}
        targetLanguage={targetLanguage}
        showOriginalText={showOriginalText}
        onSetLoading={setLoading}
        onSetError={setError}
        onSetFinalSrt={setFinalSrt}
        onSetSrtContent={setSrtContent}
        onSetSubtitles={setSubtitles}
        onSetModalTitle={setModalTitle}
        onSetModalContent={setModalContent}
        onSetModalActions={setModalActions}
        onSetShowResultModal={setShowResultModal}
        parseSrt={parseSrt}
        mergeSubtitles={mergeSubtitles}
      />

      <EditSubtitles
        videoFile={videoFile}
        videoUrl={videoUrl}
        srtContent={srtContent}
        subtitles={subtitles}
        isPlaying={isPlaying}
        editingTimes={editingTimes}
        targetLanguage={targetLanguage}
        showOriginalText={showOriginalText}
        isMergingInProgress={isMergingInProgress}
        onSetEditingTimes={setEditingTimes}
        onSetVideoFile={setVideoFile}
        onSetVideoUrl={setVideoUrl}
        onSetSrtContent={setSrtContent}
        onSetSubtitles={setSubtitles}
        onSetError={setError}
        secondsToSrtTime={secondsToSrtTime}
        parseSrt={parseSrt}
        onSetIsMergingInProgress={setIsMergingInProgress}
        onSetMergeProgress={setMergeProgress}
        onSetMergeStage={setMergeStage}
        onSetIsPlaying={setIsPlaying}
        currentPlayer={currentPlayer}
        onSetCurrentPlayer={setCurrentPlayer}
      />

      {error && <p style={{ color: 'red', marginTop: 10 }}>{error}</p>}

      <TranslationProgressArea
        isTranslationInProgress={isTranslationInProgress}
        progress={progress}
        progressStage={progressStage}
        translationProgress={translationProgress}
        translationStage={translationStage}
        onSetIsTranslationInProgress={setIsTranslationInProgress}
        subtitleProgress={subtitleProgress}
      />

      <MergingProgressArea
        isMergingInProgress={isMergingInProgress}
        mergeProgress={mergeProgress}
        mergeStage={mergeStage}
        onSetIsMergingInProgress={setIsMergingInProgress}
        isTranslationInProgress={isTranslationInProgress}
      />

      <BackToTopButton
        showButton={subtitles.length > 0}
        onClick={() => {
          const topPadding = document.getElementById('top-padding');
          if (topPadding) {
            topPadding.scrollIntoView({ behavior: 'smooth' });
          }
        }}
      />

      {showResultModal && (
        <ResultModal
          modalTitle={modalTitle}
          modalContent={modalContent}
          modalActions={modalActions}
          onClose={() => setShowResultModal(false)}
        />
      )}

      {/* Final Subtitles Display - Only show for split/merge operations, not for extraction */}
      {finalSrt && !videoFile && !showResultModal && (
        <FinalSubtitlesDisplay
          finalSrt={finalSrt}
          targetLanguage={targetLanguage}
          showOriginalText={showOriginalText}
          onSetSrtContent={setSrtContent}
          onSetSubtitles={setSubtitles}
          parseSrt={parseSrt}
          onSetError={setError}
        />
      )}
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
      <div style={{ height: 100 }} />
    </div>
  );
}
