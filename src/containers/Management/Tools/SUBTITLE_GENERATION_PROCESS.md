# Video Subtitle Generation Process: Technical Details

This document explains in detail what happens after you upload a video and press "Generate Subtitles" in the Tools section.

## System Architecture: Key Files

For AI agents and developers working on this system, here are the key files involved in the subtitle generation process:

### Frontend Components

- **Main UI Component**: `src/containers/Management/Tools/index.tsx` - Contains the user interface and client-side logic
- **Video Player**: `src/containers/Management/Tools/VideoPlayerWithSubtitles.tsx` - Custom video player with subtitle support

### API Communication

- **Request Helper**: `src/contexts/requestHelpers/zero.ts` - Client-side API functions for subtitle generation
- **Socket Events**: `src/contexts/socket.ts` - WebSocket event handling for real-time progress updates

### Backend Processing

- **Main Controller**: `twinkle-api/controllers/zero.ts` - Server-side processing of video files and subtitle generation
- **Socket Handler**: `twinkle-api/socket/ai.ts` - Server-side WebSocket event handling for progress updates
- **AI Helpers**: `twinkle-api/helpers/ai.ts` - AI integration for speech recognition and translation

## Complete Process Flow

### 1. Initial File Handling

- **File Validation**

  - The system checks if you selected a file
  - Verifies the file size is under the 2500MB limit
  - For security, the file type is validated

- **Video Loading**
  - Your browser creates a temporary URL for the video file
  - This allows the video to start loading immediately while processing continues
  - The video player is initialized to prepare for subtitle display

### 2. File Size-Based Processing Path

- **Small Files (under 100MB)**

  - The entire file is converted to base64 format in one operation
  - This encoded data is sent to the server in a single request
  - Progress is tracked and displayed as a percentage

- **Large Files (over 100MB)**
  - The file is divided into 5MB chunks to prevent memory issues
  - A unique session ID is created based on the filename and timestamp
  - Each chunk is processed sequentially:
    - Chunk is read into memory as an ArrayBuffer for efficiency
    - Converted to base64 format
    - Sent to the server with metadata (chunk index, total chunks)
    - Server stores each chunk in a temporary directory
  - If any chunk upload fails, the system retries up to 3 times with exponential backoff
  - After all chunks are uploaded, the server combines them into a complete file

### 3. Audio Extraction and Preprocessing

- **Audio Extraction**

  - The server uses FFmpeg to extract audio from the video file
  - Audio is compressed to MP3 format at 64kbps, 16kHz, mono channel
  - This reduces file size while preserving speech quality

- **Audio Analysis**

  - The system analyzes the audio to detect natural breaks (silences)
  - FFmpeg's silencedetect filter identifies silence periods longer than 0.5 seconds
  - These silence points are used to determine optimal splitting points

- **Smart Chunking Algorithm**
  - For files under 3MB, no chunking is performed
  - For larger files, the audio is split at natural break points:
    - Target chunk size is calculated based on file size (smaller of 8MB or 2 minutes)
    - The system finds silence periods closest to these target points
    - This ensures chunks don't cut in the middle of sentences
  - If no suitable silence points are found, the system falls back to time-based chunking
  - Each chunk is saved as a separate MP3 file

### 4. Transcription Process

- **Per-Chunk Processing**

  - Each audio chunk is processed separately to improve efficiency
  - The system tracks which chunk is being processed (e.g., "Processing chunk 2 of 5")
  - For each chunk:
    - Audio duration is calculated using FFprobe
    - The chunk is sent to a speech recognition service

- **Speech Recognition**

  - The audio is analyzed using advanced AI speech recognition
  - The system identifies:
    - What words are being spoken
    - When each word starts and ends (timestamp)
    - Confidence level for each word
  - For non-English audio, language detection is performed first

- **SRT Generation**
  - The recognized speech is formatted into SRT subtitle format:
    - Sequential numbering for each subtitle segment
    - Timestamps in HH:MM:SS,mmm format
    - The transcribed text
  - Each chunk generates its own partial SRT file

### 5. Translation (if selected)

- **Translation Process**

  - If you selected a target language different from the original:
    - The transcribed text is sent to an AI translation model
    - The model translates while preserving the meaning and context
    - Special markers (###TRANSLATION_MARKER###) separate original and translated text
    - **Protection System**:
      - The system prompt explicitly instructs the AI to never modify the original text
      - After translation, the system uses the pre-processed original text rather than any potentially modified version returned by the AI
      - This ensures 100% preservation of the original content regardless of AI output

- **Quality Review**
  - For translations, an additional quality review is performed:
    - Subtitles are processed in batches of 20 segments
    - Each batch is reviewed by Claude 3.7 Sonnet AI
    - The AI checks for accuracy, completeness, coherence, and context
    - Any issues are automatically fixed
    - The original text is preserved exactly as-is, only translations are modified

### 6. Post-Processing

- **Timing Adjustment**

  - For multi-chunk videos, timing information is adjusted:
    - Each chunk's timestamps are offset by the cumulative duration of previous chunks
    - This ensures continuous timing across the entire video

- **Smart Merging Algorithm**

  - Short fragments (3 words or fewer) that don't end with sentence-ending punctuation are merged with the next subtitle
  - This creates more natural reading flow and prevents choppy subtitles
  - The system preserves the original timing information during merges

- **Final SRT Assembly**
  - All processed chunks are combined into a single SRT file
  - Subtitle indices are renumbered sequentially
  - The final SRT is validated for format compliance

### 7. Completion and Delivery

- **Final Processing**

  - The complete SRT file is loaded into the video player
  - The subtitles are synchronized with the video
  - The system signals completion (100% progress)

- **Cleanup Operations**
  - All temporary files are deleted from the server
  - Any chunks older than 24 hours are automatically removed
  - Memory is freed to optimize server resources
  - Automatic cleanup runs during server start and restart (removing files older than 12 hours)
  - Manual cleanup can be triggered via npm scripts (`npm run cleanup` or `npm run cleanup:all`)

## Progress Tracking System

The system uses a dual-layer progress tracking mechanism:

1. **Upload Progress**

   - For single uploads: Tracks the percentage of the file uploaded
   - For chunked uploads: Tracks which chunk is being uploaded and its progress

2. **Processing Progress**

   - Initial audio processing (0-5%)
   - Chunk-by-chunk transcription (5-95%)
   - Post-processing and quality review (95-100%)
   - Each chunk gets an equal portion of the progress bar

3. **Socket Communication**
   - Progress updates are sent via WebSocket connection
   - This allows real-time updates without refreshing the page
   - Updates include current stage, percentage, and any warnings

## Error Handling

The system includes robust error handling:

- **Retry Mechanism**

  - Failed chunk uploads are retried up to 3 times
  - Each retry uses exponential backoff (increasing delay)

- **Fallback Strategies**

  - If smart chunking fails, the system falls back to time-based chunking
  - If a chunk can't be processed, the error is reported and processing stops

- **User Feedback**
  - Detailed error messages are provided for troubleshooting
  - Warnings are displayed for large files that may take longer to process

## Behind the Scenes: Technical Implementation

- **Frontend Technologies**

  - React for the user interface
  - WebSockets for real-time progress updates
  - FileReader API for efficient file handling
  - Video.js for the video player with subtitle support

- **Backend Technologies**

  - Node.js server with Express
  - FFmpeg for audio extraction and analysis
  - AI speech recognition for transcription
  - Claude 3.7 Sonnet for translation quality review

- **Optimization Techniques**
  - Chunked uploads to handle large files
  - Memory-efficient processing using streams and buffers
  - Parallel processing where possible
  - Automatic cleanup to prevent server storage issues

## Instructions for AI Agents

When working with this subtitle generation system, AI agents must follow these important guidelines:

1. **Testing Protocol**

   - Do NOT attempt to test the subtitle generation functionality yourself
   - All testing will be conducted by human users
   - Your role is to implement requested changes or provide information only
   - Wait for user feedback on testing results rather than attempting to verify functionality

2. **Documentation Maintenance**
   - After implementing any user-requested changes to the system
   - IMMEDIATELY update this documentation file to reflect those changes
   - Include details about what was modified, added, or removed
   - Ensure the documentation remains accurate and comprehensive
   - Add a timestamp and brief description of updates at the bottom of this file

These instructions ensure proper division of responsibilities and maintain accurate documentation for all system components.

## Code Flow Diagram

```
User Interface (index.tsx)
    │
    ▼
Request Helper (zero.ts) ◄──────► WebSocket Events (socket.ts)
    │                                 ▲
    │ HTTP Request                    │ Real-time updates
    ▼                                 │
Backend Controller (zero.ts) ────────►Socket Handler (ai.ts)
    │
    ├─► File Processing
    │       │
    │       ├─► Audio Extraction (FFmpeg)
    │       │
    │       ├─► Smart Chunking
    │       │
    │       └─► Cleanup
    │
    ├─► Transcription
    │       │
    │       └─► AI Speech Recognition
    │
    ├─► Translation (if selected)
    │       │
    │       └─► Claude 3.7 Quality Review
    │
    └─► SRT Generation and Delivery
```

## Document Update History

- **v1.0**: Added "Instructions for AI Agents" section with testing protocol and documentation maintenance guidelines.
- **v1.1**: Updated "Translation Process" section to document the protection system for preserving original text during the first translation run, ensuring consistency with the quality review phase.
- **v1.2**: Implemented protection system for preserving original text during the first translation run by:
  - Storing the original text before sending to AI
  - Adding explicit instructions in the system prompt to never modify the original text
  - Using the preserved original text rather than any potentially modified version returned by the AI
  - Applying the same protection in error handling cases
- **v1.3**: Enhanced server-side cleanup process for temporary files:
  - Improved cleanup function to create the uploads directory if it doesn't exist
  - Added detailed logging for better troubleshooting
  - Implemented more aggressive cleanup on server startup (12 hours instead of 24)
  - Added option for admin-triggered force cleanup of all temporary files
  - Fixed issue where files weren't being properly removed
- **v1.4**: Integrated automatic cleanup into server lifecycle:
  - Added automatic cleanup to server start and restart scripts
  - Configured cleanup to remove files older than 12 hours during server initialization
  - Created dedicated npm scripts for manual cleanup operations
  - Updated documentation to reflect enhanced cleanup capabilities
