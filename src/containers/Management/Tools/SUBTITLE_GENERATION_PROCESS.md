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
    - **Supported Languages**:
      - English
      - Spanish
      - French
      - German
      - Chinese (Mandarin)
      - Japanese
      - Russian
      - Portuguese
      - Italian
      - Arabic
      - Korean
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
  - Automatic cleanup runs during server start, removing all files in the uploads directory
  - Memory is freed to optimize server resources
  - Manual cleanup can be triggered via admin API endpoint
  - **Immediate Cleanup**: Each temporary file is deleted as soon as it's no longer needed:
    - Original video file is deleted immediately after audio extraction
    - Each audio chunk is deleted immediately after processing
    - This progressive cleanup minimizes disk usage during processing of large files

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
  - FFmpeg for audio extraction, analysis, and video processing
  - AI speech recognition for transcription
  - Claude 3.7 Sonnet for translation quality review

- **Optimization Techniques**
  - Chunked uploads to handle large files
  - Memory-efficient processing using streams and buffers
  - Parallel processing where possible
  - Automatic cleanup to prevent server storage issues

## Video-Subtitle Merging Process

The system provides a sophisticated solution for permanently embedding subtitles into video files using FFmpeg.

### 1. User Interface

- **Merge Button**

  - Located in the subtitle editor's action bar
  - Only enabled when both video and subtitles are loaded
  - Initiates the merging process with a single click

- **Default Subtitle Settings**
  - Font size: 20px
  - Text color: White (#FFFFFF)
  - Outline color: Black with 33% opacity
  - Background color: Black with 33% opacity
  - Border style: Opaque box
  - Vertical margin: 5 pixels
  - Alignment: Bottom center

### 2. Technical Process Flow

- **File Preparation**

  - Video file is converted to base64 format
  - SRT content is validated and formatted
  - Both are sent to the server in a single request

- **Server-Side Processing**

  - Files are saved to temporary storage in the OS temp directory
  - FFmpeg command is constructed with customized subtitle styling
  - The following FFmpeg parameters are used:
    ```
    ffmpeg -i video.mp4 \
      -vf "subtitles=subtitles.srt:force_style='\
      Fontsize=20,\
      PrimaryColour=&H00FFFFFF,\
      OutlineColour=&H33000000,\
      BackColour=&H33000000,\
      BorderStyle=3,\
      Outline=1,\
      Shadow=0,\
      MarginV=5,\
      Alignment=2'" \
      -c:a copy output.mp4
    ```
  - Progress is monitored in real-time by parsing FFmpeg output
  - Updates are sent to the client via WebSocket events
  - The Management context tracks and displays progress to the user

- **Subtitle Styling**

  - Font size: 20 (configurable)
  - Text color: White (configurable)
  - Outline color: Black with 33% opacity (configurable)
  - Background color: Black with 33% opacity (configurable)
  - Border style: 3 (Opaque box)
  - Outline width: 1 pixel
  - Shadow: Disabled
  - Vertical margin: 5 pixels
  - Alignment: 2 (Bottom center)

- **Video Encoding**
  - Video codec: Same as source (copy)
  - Audio codec: Same as source (copy)
  - Container format: MP4
  - Metadata is preserved from the original file

### 3. Completion and Delivery

- **Result Handling**

  - Completed video is stored temporarily on the server
  - A unique URL is generated for the file
  - The client fetches the file using this URL
  - Browser creates a Blob from the response
  - Download dialog appears automatically
  - User can save the file with embedded subtitles

- **Cleanup**
  - Temporary files are automatically deleted after 1 hour
  - Input files (video and SRT) are deleted immediately after processing
  - A scheduled task runs hourly to clean up any expired files
  - Client-side resources are freed
  - Progress UI is hidden after a short delay

### 4. Error Handling

- **Robust Recovery**

  - Detailed error messages for troubleshooting
  - Socket events communicate errors to the client
  - Management context displays error messages to the user
  - Graceful failure with user-friendly messages

- **Validation Checks**
  - Ensures video and subtitle files are compatible
  - Verifies FFmpeg processing completed successfully
  - Confirms output file integrity before delivery

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
- **v1.5**: Expanded language support for subtitle translation:
  - Added support for 10 additional languages: Spanish, French, German, Chinese, Japanese, Russian, Portuguese, Italian, and Arabic
  - Implemented "Show original text" option for all non-English translations
  - Updated UI to display the checkbox for all non-English languages
  - Modified subtitle processing to handle all languages consistently
- **v1.6**: Optimized file cleanup process to reduce disk usage:
  - Implemented immediate deletion of original video file after audio extraction
  - Added progressive cleanup of audio chunk files immediately after processing
  - Enhanced logging for better visibility into file cleanup operations
  - Updated documentation to reflect the improved cleanup process
  - Date: June 2024
- **v1.7**: Simplified server cleanup process:
  - Replaced age-based cleanup with complete directory cleanup on server start
  - Removed complex conditional logic for determining which files to delete
  - Improved logging of cleanup operations for better debugging
  - Simplified admin cleanup endpoint to use the same approach
  - Date: June 2024
- **v1.8**: Added comprehensive video-subtitle merging functionality:
  - Implemented client-side UI for merging videos with subtitles
  - Added dedicated progress tracking for the merging process
  - Created backend endpoint for processing using FFmpeg
  - Updated documentation with technical details of the merging process
  - Date: June 2024
- **v1.9**: Implemented server-side component for video-subtitle merging:
  - Added endpoint for processing video and subtitle files
  - Implemented FFmpeg integration for subtitle embedding
  - Created real-time progress tracking via WebSocket
  - Added temporary file storage and cleanup system
  - Date: June 2024
- **v2.0**: Simplified video-subtitle merging process:
  - Removed styling customization modal
  - Set default subtitle style with white text to ensure visibility
  - Made merge happen directly upon button press
  - Fixed issue with black boxes instead of visible text
  - Date: July 2024

## Backend Implementation Guide

For developers implementing the server-side component of the video-subtitle merging feature, here's a detailed guide:

### 1. API Endpoint Structure

The system implements an endpoint at `/zero/subtitle/merge-video` that accepts POST requests with the following parameters:

```javascript
// Request body structure
{
  videoData: string,       // Base64-encoded video file
  srtContent: string,      // SRT subtitle content
  filename: string,        // Original filename for the output
  fontOptions: {           // Subtitle styling options
    size: number,          // Font size (10-40)
    primaryColor: string,  // Text color in FFmpeg format (&HAABBGGRR)
    outlineColor: string,  // Outline color in FFmpeg format
    backgroundColor: string, // Background color in FFmpeg format
    borderStyle: number,   // Border style (3 = opaque box)
    outline: number,       // Outline width (1-4)
    shadow: number,        // Shadow (0-4)
    marginV: number,       // Vertical margin (0-50)
    alignment: number      // Position (1-9)
  }
}
```

### 2. Processing Steps

1. **File Handling**

   ```javascript
   // Save the base64 video to a temporary file
   const videoBuffer = Buffer.from(videoData.split(',')[1], 'base64');
   const tempVideoPath = path.join(
     os.tmpdir(),
     'twinkle-subtitle-merge',
     `input_${Date.now()}_${userId}.mp4`
   );
   fs.writeFileSync(tempVideoPath, videoBuffer);

   // Save the SRT content to a temporary file
   const tempSrtPath = path.join(
     os.tmpdir(),
     'twinkle-subtitle-merge',
     `subtitles_${Date.now()}_${userId}.srt`
   );
   fs.writeFileSync(tempSrtPath, srtContent, 'utf8');

   // Prepare output path
   const outputPath = path.join(
     os.tmpdir(),
     'twinkle-subtitle-merge',
     `output_${Date.now()}_${userId}.mp4`
   );
   ```

2. **FFmpeg Command Construction**

   ```javascript
   // Build the FFmpeg style string
   const styleString =
     `Fontsize=${fontOptions.size},` +
     `PrimaryColour=${fontOptions.primaryColor},` +
     `OutlineColour=${fontOptions.outlineColor},` +
     `BackColour=${fontOptions.backgroundColor},` +
     `BorderStyle=${fontOptions.borderStyle},` +
     `Outline=${fontOptions.outline},` +
     `Shadow=${fontOptions.shadow},` +
     `MarginV=${fontOptions.marginV},` +
     `Alignment=${fontOptions.alignment}`;

   // Construct the FFmpeg command
   const ffmpegCommand = [
     '-i',
     tempVideoPath,
     '-vf',
     `subtitles=${tempSrtPath}:force_style='${styleString}'`,
     '-c:a',
     'copy',
     outputPath
   ];
   ```

3. **Progress Tracking**

   ```javascript
   // Execute FFmpeg with progress monitoring
   const ffmpeg = spawn('ffmpeg', ffmpegCommand);

   // Send initial progress update
   socket.emit('subtitle_merge_progress', {
     progress: 0,
     stage: 'Starting video processing',
     userId: userId
   });

   // Parse FFmpeg output for progress information
   ffmpeg.stderr.on('data', (data) => {
     const output = data.toString();
     // Extract time information
     const timeMatch = output.match(/time=(\d+:\d+:\d+.\d+)/);
     if (timeMatch && timeMatch[1]) {
       const currentTime = timeToSecondsForMerge(timeMatch[1]);
       // Get total duration (determined earlier)
       const progress = Math.min(
         Math.round((currentTime / totalDuration) * 100),
         99
       );
       // Send progress update via socket
       socket.emit('subtitle_merge_progress', {
         progress,
         stage: 'Encoding video with subtitles',
         userId: userId
       });
     }
   });
   ```

4. **Result Handling**

   ```javascript
   // When FFmpeg completes
   await new Promise<void>((resolve, reject) => {
     ffmpeg.on('close', (code) => {
       if (code === 0) {
         resolve();
       } else {
         reject(new Error(`FFmpeg process exited with code ${code}`));
       }
     });

     ffmpeg.on('error', (err) => {
       reject(err);
     });
   });

   // Send completion notification
   socket.emit('subtitle_merge_progress', {
     progress: 100,
     stage: 'Complete',
     userId: userId
   });

   // Create a temporary URL for the file
   const fileId = uuid();
   const fileUrl = `/temp/${fileId}`;

   // Store file info for later retrieval
   if (!global.tempFiles) {
     global.tempFiles = {};
   }
   global.tempFiles[fileId] = {
     path: outputPath,
     expires: Date.now() + 3600000 // 1 hour expiration
   };

   // Return the URL to the client
   res.json({ success: true, videoUrl: fileUrl });
   ```

### 3. Temporary File Serving

```javascript
// Add an endpoint to serve the temporary files
router.get('/temp/:fileId', (req, res) => {
  const fileId = req.params.fileId;
  if (!global.tempFiles) {
    global.tempFiles = {};
  }
  const fileInfo = global.tempFiles[fileId];

  if (!fileInfo || !fs.existsSync(fileInfo.path)) {
    return res.status(404).send('File not found');
  }

  // Check if expired
  if (fileInfo.expires < Date.now()) {
    delete global.tempFiles[fileId];
    if (fs.existsSync(fileInfo.path)) {
      fs.unlinkSync(fileInfo.path);
    }
    return res.status(410).send('File has expired');
  }

  // Stream the file
  const stat = fs.statSync(fileInfo.path);
  res.writeHead(200, {
    'Content-Type': 'video/mp4',
    'Content-Length': stat.size,
    'Content-Disposition': `attachment; filename="${path.basename(
      fileInfo.path
    )}"`
  });

  const readStream = fs.createReadStream(fileInfo.path);
  readStream.pipe(res);
});
```

### 4. Cleanup Process

```javascript
// Run every hour
setInterval(() => {
  if (!global.tempFiles) {
    global.tempFiles = {};
    return;
  }

  const now = Date.now();

  Object.keys(global.tempFiles).forEach((fileId) => {
    const fileInfo = global.tempFiles[fileId];
    if (fileInfo.expires < now) {
      if (fs.existsSync(fileInfo.path)) {
        fs.unlinkSync(fileInfo.path);
      }
      delete global.tempFiles[fileId];
    }
  });
}, 3600000);
```

### 5. Socket Event Handling

```javascript
// In socket/ai.ts
socket.on(
  'subtitle_merge_progress',
  (data: {
    userId: number,
    progress: number,
    stage: string,
    error?: string
  }) => {
    const userId = data.userId || connectedSocket[socket.id];

    if (userId) {
      io.to('notification ' + userId).emit(
        'subtitle_merge_progress_update',
        data
      );
    }
  }
);
```

This implementation provides a robust foundation for the server-side component of the video-subtitle merging feature, with proper file handling, progress tracking, and cleanup processes.

## Document Update History
