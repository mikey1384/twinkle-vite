// Mediabunny exposes audio/video tracks only. Read the Matroska Tracks table
// independently so subtitles and other track types cannot disappear unnoticed.
// EBML sizes: https://www.rfc-editor.org/rfc/rfc8794.html#section-6
const EBML = 0x1a45dfa3;
const SEGMENT = 0x18538067;
const TRACKS = 0x1654ae6b;
const TRACK_ENTRY = 0xae;
const TRACK_TYPE = 0x83;
const VOID = 0xec;
const CRC32 = 0xbf;
const READ_SIZE = 4096;
const MAX_READ_BYTES = 1024 * 1024;
const MAX_ELEMENTS = 8192;

// A null result means we could not establish a complete Tracks table. Preserve
// the original in that case. Large payloads are skipped by offset, never loaded.
export async function readMatroskaTrackTypes(
  file: Blob,
  signal?: AbortSignal
): Promise<number[] | null> {
  let cache = new Uint8Array(0);
  let cacheStart = 0;
  let bytesRead = 0;
  let elementsRead = 0;
  const invalid = () => {
    throw new Error('Cannot verify Matroska track inventory');
  };
  async function read(position: number, length: number) {
    signal?.throwIfAborted();
    if (position < 0 || length < 1 || position + length > file.size) invalid();
    if (
      position < cacheStart ||
      position + length > cacheStart + cache.length
    ) {
      const end = Math.min(file.size, position + READ_SIZE);
      bytesRead += end - position;
      if (bytesRead > MAX_READ_BYTES) invalid();
      cache = new Uint8Array(await file.slice(position, end).arrayBuffer());
      signal?.throwIfAborted();
      cacheStart = position;
    }
    if (position + length > cacheStart + cache.length) invalid();
    return cache.subarray(position - cacheStart, position - cacheStart + length);
  }
  async function element(position: number, parentEnd: number) {
    if (++elementsRead > MAX_ELEMENTS || position >= parentEnd) invalid();
    const header = await read(position, Math.min(12, parentEnd - position));
    const width = (offset: number, max: number) => {
      const first = header[offset];
      if (!first) return invalid();
      let length = 1;
      while (!(first & (0x80 >> (length - 1)))) length++;
      if (length > max || offset + length > header.length) invalid();
      return length;
    };
    const idWidth = width(0, 4);
    let id = 0;
    for (let i = 0; i < idWidth; i++) id = id * 256 + header[i];
    const sizeWidth = width(idWidth, 8);
    let size = BigInt(header[idWidth] & (0xff >> sizeWidth));
    for (let i = 1; i < sizeWidth; i++) {
      size = size * 256n + BigInt(header[idWidth + i]);
    }
    const start = position + idWidth + sizeWidth;
    const unknownSize = size === (1n << BigInt(7 * sizeWidth)) - 1n;
    if (!unknownSize && size > BigInt(parentEnd - start)) invalid();
    const end = unknownSize ? parentEnd : start + Number(size);
    return { id, start, end, unknownSize };
  }
  try {
    const header = await element(0, file.size);
    if (header.id !== EBML || header.unknownSize) return null;
    let position = header.end;
    // Global padding/checksums may sit between the EBML header and Segment.
    while (position < file.size) {
      const segment = await element(position, file.size);
      if (segment.id !== SEGMENT) {
        if (![VOID, CRC32].includes(segment.id) || segment.unknownSize) return null;
        position = segment.end;
        continue;
      }
      position = segment.start;
      while (position < segment.end) {
        const child = await element(position, segment.end);
        // An unknown-size cluster before Tracks cannot be safely skipped.
        if (child.unknownSize) return null;
        if (child.id === TRACKS) {
          const types: number[] = [];
          let entryPosition = child.start;
          while (entryPosition < child.end) {
            const entry = await element(entryPosition, child.end);
            if (entry.unknownSize) return null;
            if (entry.id === TRACK_ENTRY) {
              let type: number | undefined;
              let fieldPosition = entry.start;
              while (fieldPosition < entry.end) {
                const field = await element(fieldPosition, entry.end);
                if (field.unknownSize) return null;
                if (field.id === TRACK_TYPE) {
                  const length = field.end - field.start;
                  if (type !== undefined || length < 1 || length > 8) return null;
                  type = 0;
                  for (const byte of await read(field.start, length)) {
                    type = type * 256 + byte;
                  }
                  if (!Number.isSafeInteger(type)) return null;
                }
                fieldPosition = field.end;
              }
              if (type === undefined) return null;
              types.push(type);
            } else if (![VOID, CRC32].includes(entry.id)) {
              return null;
            }
            entryPosition = entry.end;
          }
          return types.length > 0 ? types : null;
        }
        position = child.end;
      }
      return null;
    }
    return null;
  } catch (error) {
    if (signal?.aborted) throw error;
    return null;
  }
}
