These tiny synthetic fixtures contain a one-second blue 64×64 H.264 video and
silent AAC audio. `with-subtitles.mkv` also contains an SRT track with the text
“Example subtitle”. `audio-video.mkv` is the same recording without that track.
They exercise the real converter without requiring FFmpeg in the test runner.

Generated with FFmpeg using `color=c=blue:s=64x64:r=10:d=1`,
`anullsrc=r=44100:cl=mono`, `-t 1 -c:v libx264 -threads 1 -pix_fmt yuv420p
-c:a aac -c:s srt`, then remuxed with `-map 0:v -map 0:a -c copy` for the
audio/video-only fixture.
