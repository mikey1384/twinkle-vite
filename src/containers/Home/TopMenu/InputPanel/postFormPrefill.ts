// A link typed into Home's Post Something field, for the link form to take
// when it opens: it runs through the form's own URL handling (YouTube
// detection, the video's title, the already-posted check) as if typed there.
let pendingLink: { url: string; title: string } | null = null;

export function setPendingPostLink(link: { url: string; title: string }) {
  pendingLink = link;
}

// Taken once.
export function takePendingPostLink() {
  const link = pendingLink;
  pendingLink = null;
  return link;
}
