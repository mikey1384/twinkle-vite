import type { SrtSegment } from './types';

export function generateSrtContent(
  segments: SrtSegment[],
  secondsToSrtTime: (seconds: number) => string
) {
  return segments
    .map((segment, index) => {
      const startTime = secondsToSrtTime(segment.start);
      const endTime = secondsToSrtTime(segment.end);
      return `${index + 1}\n${startTime} --> ${endTime}\n${segment.text}`;
    })
    .join('\n\n');
}
