// One in-flight request per key: a second caller with the same key gets the
// same promise. The entry is removed once that promise settles, and only if it
// is still the one stored.
//
// The order matters. `map[key] = (async () => { ... finally { delete map[key] } })()`
// breaks when the async body finishes without awaiting anything: its finally
// runs synchronously, BEFORE the assignment, so the settled promise is then
// stored and never removed, and every later call with that key returns it and
// does nothing. That is how re-entering a chat topic stopped working (2.3.43
// made topic switches inside an open chat skip their only await).
export function shareInFlight<T>(
  map: Record<string, Promise<T> | undefined>,
  key: string,
  start: () => Promise<T>
): Promise<T> {
  const existing = map[key];
  if (existing) return existing;
  const promise = start();
  map[key] = promise;
  const clear = () => {
    if (map[key] === promise) delete map[key];
  };
  promise.then(clear, clear);
  return promise;
}
