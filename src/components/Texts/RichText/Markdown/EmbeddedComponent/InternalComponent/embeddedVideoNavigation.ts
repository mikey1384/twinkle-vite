export function shouldNavigateEmbeddedVideoContainerClick({
  defaultPrevented,
  isNestedLink
}: {
  defaultPrevented: boolean;
  isNestedLink: boolean;
}) {
  return !defaultPrevented && !isNestedLink;
}
