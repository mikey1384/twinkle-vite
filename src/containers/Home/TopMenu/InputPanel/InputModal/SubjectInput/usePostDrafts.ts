import { useCallback, useEffect, useRef, useState } from 'react';
import { stringIsEmpty } from '~/helpers/stringHelpers';

// Several post drafts at once. Each draft in the post form is one row of
// users_drafts (type "subject"); the form edits one of them at a time, and
// a row of chips above it switches between them, starts a new one or
// deletes one. Switching saves the one being left first, so nothing typed
// is ever written into a different draft. While a post is on its way, the
// drafts can't be switched, started or deleted.

export interface ServerPostDraft {
  id: number;
  type: string;
  title: string;
  description: string;
  secretAnswer: string;
  lastUpdated: number;
}

export interface PostDraftText {
  title: string;
  description: string;
  secretAnswer: string;
}

// Attachments, reward level, the secret-message switch and "I made this
// myself" aren't saved with a draft; they stay with it in memory while the
// page is open.
export interface PostDraftExtras {
  attachment: any;
  secretAttachment: any;
  hasSecretAnswer: boolean;
  rewardLevel: number;
  isMadeByUser: boolean;
}

export interface PostDraftEntry extends PostDraftText {
  key: string;
}

type SaveResult = 'saved' | 'skipped' | 'failed';

const SAVE_DELAY_MS = 3000;
const SAVED_INDICATOR_MS = 3000;
const WAIT_FOR_SAVES_MS = 4000;
const SAVE_FAILED_MESSAGE =
  "Couldn't save this draft, so it stayed open. Check your connection and try again.";
const DELETE_FAILED_MESSAGE = "Couldn't delete the draft. Please try again.";
const LOAD_FAILED_MESSAGE = "Couldn't load your other drafts just now.";

// What the form remembers between openings during this page load. Keys are
// local: a draft keeps its key while it waits for its first save to return
// an id.
const session = {
  userId: 0,
  activeKey: '',
  newCount: 0,
  idByKey: new Map<string, number>(),
  // the text this page last saved or loaded for each draft
  savedTextByKey: new Map<string, PostDraftText>(),
  extrasByKey: new Map<string, PostDraftExtras>(),
  // each draft's saves and deletes run one after another
  chain: new Map<string, Promise<SaveResult>>(),
  removedKeys: new Set<string>(),
  // plain posts still on their way (their text may still be in the form)
  postsInFlight: 0,
  lastPostAt: 0,
  // post forms open right now
  openForms: 0
};

// A post that hasn't settled after this long (a hung request) no longer
// keeps the form from holding its own text.
const POST_IN_FLIGHT_MAX_MS = 60_000;

// Home's Post Something field fills the form with new text: that text is a
// new draft, never a continuation of the newest saved one.
export function startNewPostDraft() {
  session.activeKey = '';
}

// A draft deleted outside the drafts row (closing the form with no title):
// call before deleting it, so a save still on its way can't bring it back.
export function forgetActivePostDraft() {
  const key = session.activeKey;
  if (!key) return;
  session.removedKeys.add(key);
  session.idByKey.delete(key);
  session.savedTextByKey.delete(key);
  session.extrasByKey.delete(key);
  session.activeKey = '';
}

export function forgetPostDraft(id: number) {
  for (const [key, knownId] of session.idByKey) {
    if (knownId !== id) continue;
    session.idByKey.delete(key);
    session.savedTextByKey.delete(key);
    session.extrasByKey.delete(key);
    session.removedKeys.add(key);
    if (session.activeKey === key) session.activeKey = '';
  }
}

// Saves still on their way (the list is read after them, so a draft saved
// while the form was closing isn't listed twice).
export async function waitForPostDraftSaves() {
  // a stuck request never holds the list up for long
  await Promise.race([
    Promise.all(Array.from(session.chain.values())).catch(() => {}),
    new Promise((resolve) => setTimeout(resolve, WAIT_FOR_SAVES_MS))
  ]);
}

// Whether a post form is open (a post finishing in a form that was closed
// leaves a reopened form's text alone).
export function isPostFormOpen() {
  return session.openForms > 0;
}

export function isEmptyDraftText(text: PostDraftText) {
  return (
    stringIsEmpty(text.title) &&
    stringIsEmpty(text.description) &&
    stringIsEmpty(text.secretAnswer)
  );
}

export default function usePostDrafts({
  userId,
  drafts,
  draftsLoadFailed,
  draftIdRef,
  ...callbacks
}: {
  userId: number;
  // null until this opening's drafts have loaded
  drafts: ServerPostDraft[] | null;
  draftsLoadFailed: boolean;
  draftIdRef: React.RefObject<number | null>;
  // the form already holds text this opening (kept from before, or
  // filled in by Home's field)
  hasLocalEdits: () => boolean;
  // a post is on its way
  isPosting: () => boolean;
  getText: () => PostDraftText;
  getExtras: () => PostDraftExtras;
  // extras: undefined leaves them as they are, null resets them
  applyDraft: (
    text: PostDraftText,
    extras: PostDraftExtras | null | undefined
  ) => void;
  saveDraft: (params: any) => Promise<any>;
  deleteDraft: (draftId: number) => Promise<any>;
}) {
  // The form's latest callbacks (they read its current attachment etc.).
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;
  const hasLocalEdits = () => callbacksRef.current.hasLocalEdits();
  const isPosting = () => callbacksRef.current.isPosting();
  const getText = () => callbacksRef.current.getText();
  const getExtras = () => callbacksRef.current.getExtras();
  const applyDraft: typeof callbacks.applyDraft = (text, extras) =>
    callbacksRef.current.applyDraft(text, extras);
  const saveDraft = (params: any) => callbacksRef.current.saveDraft(params);
  const deleteDraft = (draftId: number) =>
    callbacksRef.current.deleteDraft(draftId);

  const [entries, setEntriesState] = useState<PostDraftEntry[]>([]);
  const entriesRef = useRef<PostDraftEntry[]>([]);
  const [activeKey, setActiveKeyState] = useState('');
  const activeKeyRef = useRef('');
  // drafts started in this opening (the row shows for them only once
  // there is another draft)
  const freshKeysRef = useRef(new Set<string>());
  const [busy, setBusy] = useState<string | null>(null);
  const busyRef = useRef<string | null>(null);
  const [error, setError] = useState('');
  const [savingState, setSavingState] = useState<'idle' | 'saved'>('idle');
  const pendingRef = useRef<{ key: string; text: PostDraftText } | null>(null);
  const saveTimeoutRef = useRef<number | null>(null);
  const savedIndicatorTimeoutRef = useRef<number | null>(null);
  const initializedRef = useRef(false);
  const mountedRef = useRef(true);

  const setEntries = useCallback(
    (updater: (prev: PostDraftEntry[]) => PostDraftEntry[]) => {
      entriesRef.current = updater(entriesRef.current);
      if (mountedRef.current) setEntriesState(entriesRef.current);
    },
    []
  );

  const syncDraftIdRef = useCallback(() => {
    if (!mountedRef.current) return;
    draftIdRef.current = session.idByKey.get(activeKeyRef.current) ?? null;
  }, [draftIdRef]);

  const setActiveKey = useCallback(
    (key: string) => {
      activeKeyRef.current = key;
      session.activeKey = key;
      syncDraftIdRef();
      if (mountedRef.current) setActiveKeyState(key);
    },
    [syncDraftIdRef]
  );

  useEffect(() => {
    mountedRef.current = true;
    session.openForms += 1;
    return () => {
      session.openForms = Math.max(0, session.openForms - 1);
      const key = activeKeyRef.current;
      if (initializedRef.current && key && !session.removedKeys.has(key)) {
        session.extrasByKey.set(key, getExtras());
      }
      mountedRef.current = false;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (savedIndicatorTimeoutRef.current) {
        clearTimeout(savedIndicatorTimeoutRef.current);
      }
      // What was typed in the last few seconds before closing still saves.
      const pending = pendingRef.current;
      pendingRef.current = null;
      if (pending) void saveNow(pending.key, pending.text);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!Array.isArray(drafts) || initializedRef.current) return;
    initializedRef.current = true;
    const userChanged = session.userId !== 0 && session.userId !== userId;
    if (session.userId !== userId) {
      session.userId = userId;
      session.activeKey = '';
      session.idByKey.clear();
      session.savedTextByKey.clear();
      session.extrasByKey.clear();
      session.chain.clear();
      session.removedKeys.clear();
    }
    if (draftsLoadFailed) setError(LOAD_FAILED_MESSAGE);
    // a draft deleted since (posted, or closed with no title) isn't reused
    const prevActive = session.removedKeys.has(session.activeKey)
      ? ''
      : session.activeKey;
    const lastSaved = prevActive
      ? session.savedTextByKey.get(prevActive)
      : undefined;
    const fetched = drafts.filter((draft) => draft?.type === 'subject');
    const fetchedIds = new Set(fetched.map((draft) => draft.id));
    const loaded: PostDraftEntry[] = fetched.map((draft) => ({
      key: keyForId(draft.id),
      title: draft.title || '',
      description: normalizeDraftDescription({
        description: draft.description || '',
        title: draft.title || ''
      }),
      secretAnswer: draft.secretAnswer || ''
    }));
    const rememberLoaded = () => {
      for (const entry of loaded) {
        session.savedTextByKey.set(entry.key, textOf(entry));
      }
    };

    // Text left in the form from another account is never kept, and
    // neither is a post still on its way (the form was closed and reopened
    // while it was sending): that text is the post, not a draft.
    const postInFlight =
      session.postsInFlight > 0 &&
      Date.now() - session.lastPostAt < POST_IN_FLIGHT_MAX_MS;
    // A file post is uploading (the form is hidden behind its progress):
    // nothing is put in the form, so a failed upload comes back to the
    // post's own text and attachment.
    if (isPosting()) {
      rememberLoaded();
      const key = newKey();
      freshKeysRef.current.add(key);
      entriesRef.current = [{ key, ...emptyText() }, ...loaded];
      setEntriesState(entriesRef.current);
      setActiveKey(key);
      return;
    }
    if (!userChanged && !postInFlight && hasLocalEdits()) {
      const localText = getText();
      let key = prevActive;
      if (!key) {
        key = newKey();
        freshKeysRef.current.add(key);
      }
      const knownId = session.idByKey.get(key);
      if (
        knownId &&
        !draftsLoadFailed &&
        !fetchedIds.has(knownId) &&
        !session.chain.has(key)
      ) {
        // deleted elsewhere: it saves as a new draft instead
        session.idByKey.delete(key);
        session.savedTextByKey.delete(key);
      }
      const serverEntry = loaded.find((entry) => entry.key === key);
      const unchangedHere = !!lastSaved && sameText(lastSaved, localText);
      if (
        serverEntry &&
        unchangedHere &&
        !sameText(textOf(serverEntry), localText)
      ) {
        // nothing new here, and a newer copy came from elsewhere: show it
        rememberLoaded();
        entriesRef.current = loaded;
        setEntriesState(loaded);
        setActiveKey(key);
        applyDraft(serverEntry, undefined);
        return;
      }
      rememberLoaded();
      const rest = loaded.filter((entry) => entry.key !== key);
      entriesRef.current = [{ key, ...localText }, ...rest];
      setEntriesState(entriesRef.current);
      setActiveKey(key);
      // edits not on the server yet save now
      if (
        !isEmptyDraftText(localText) &&
        !(serverEntry && sameText(textOf(serverEntry), localText))
      ) {
        scheduleSave();
      }
      return;
    }

    rememberLoaded();
    if (loaded.length > 0) {
      const [newest] = loaded;
      entriesRef.current = loaded;
      setEntriesState(loaded);
      setActiveKey(newest.key);
      applyDraft(
        newest,
        userChanged || postInFlight ? null : session.extrasByKey.get(newest.key)
      );
      return;
    }

    const key = newKey();
    freshKeysRef.current.add(key);
    entriesRef.current = [{ key, ...emptyText() }];
    setEntriesState(entriesRef.current);
    setActiveKey(key);
    if (userChanged || postInFlight) applyDraft(emptyText(), null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drafts]);

  // Called after every edit in the form.
  const scheduleSave = useCallback(() => {
    if (!initializedRef.current || isPosting()) return;
    const key = activeKeyRef.current;
    if (!key) return;
    const previous = pendingRef.current;
    if (previous && previous.key !== key) {
      // never dropped: a different draft's waiting save goes now
      void saveNow(previous.key, previous.text);
    }
    pendingRef.current = { key, text: getText() };
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    if (savedIndicatorTimeoutRef.current) {
      clearTimeout(savedIndicatorTimeoutRef.current);
    }
    setSavingState('idle');
    saveTimeoutRef.current = window.setTimeout(async () => {
      saveTimeoutRef.current = null;
      const pending = pendingRef.current;
      pendingRef.current = null;
      if (!pending) return;
      const result = await saveNow(pending.key, pending.text);
      if (result !== 'saved' || !mountedRef.current) return;
      setError('');
      setSavingState('saved');
      savedIndicatorTimeoutRef.current = window.setTimeout(() => {
        if (mountedRef.current) setSavingState('idle');
      }, SAVED_INDICATOR_MS);
    }, SAVE_DELAY_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const switchTo = useCallback(async (key: string) => {
    if (busyRef.current || isPosting() || key === activeKeyRef.current) {
      return;
    }
    if (!entriesRef.current.some((entry) => entry.key === key)) return;
    startBusy(key);
    try {
      const from = activeKeyRef.current;
      if (!(await leaveActive())) return;
      if (activeKeyRef.current !== from || isPosting()) return;
      const target = entriesRef.current.find((entry) => entry.key === key);
      if (!target) return;
      setActiveKey(key);
      applyDraft(target, session.extrasByKey.get(key) ?? null);
    } finally {
      endBusy();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startNew = useCallback(async () => {
    if (busyRef.current || isPosting()) return;
    if (isEmptyDraftText(getText())) return;
    startBusy('new');
    try {
      const from = activeKeyRef.current;
      if (!(await leaveActive())) return;
      if (activeKeyRef.current !== from || isPosting()) return;
      const key = newKey();
      freshKeysRef.current.add(key);
      setEntries((prev) => [{ key, ...emptyText() }, ...prev]);
      setActiveKey(key);
      applyDraft(emptyText(), null);
    } finally {
      endBusy();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const remove = useCallback(async (key: string) => {
    if (busyRef.current || isPosting()) return;
    startBusy(`delete:${key}`);
    setError('');
    const wasActive = key === activeKeyRef.current;
    if (wasActive) cancelPendingSave();
    try {
      await (session.chain.get(key) ?? Promise.resolve());
      const id = session.idByKey.get(key);
      // marked first: a save landing after the delete can't recreate it
      session.removedKeys.add(key);
      if (id) await deleteDraft(id);
    } catch (error) {
      // nothing changed: the draft stays, and its edits save as usual
      session.removedKeys.delete(key);
      setError(DELETE_FAILED_MESSAGE);
      if (wasActive) scheduleSave();
      endBusy();
      throw error;
    }
    session.removedKeys.add(key);
    session.idByKey.delete(key);
    session.savedTextByKey.delete(key);
    session.extrasByKey.delete(key);
    setEntries((prev) => prev.filter((entry) => entry.key !== key));
    if (wasActive) {
      const next = entriesRef.current.find((entry) => !isEmptyDraftText(entry));
      if (next) {
        setActiveKey(next.key);
        applyDraft(next, session.extrasByKey.get(next.key) ?? null);
      } else {
        const fresh = newKey();
        freshKeysRef.current.add(fresh);
        setEntries((prev) => [
          { key: fresh, ...emptyText() },
          ...prev.filter((entry) => !isEmptyDraftText(entry))
        ]);
        setActiveKey(fresh);
        applyDraft(emptyText(), null);
      }
    }
    endBusy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The draft being edited is being posted: only that draft goes. Typing
  // after this starts a new one.
  const markPosted = useCallback(async () => {
    session.postsInFlight += 1;
    session.lastPostAt = Date.now();
    const key = activeKeyRef.current;
    cancelPendingSave();
    setError('');
    const id = session.idByKey.get(key);
    session.removedKeys.add(key);
    session.idByKey.delete(key);
    session.savedTextByKey.delete(key);
    session.extrasByKey.delete(key);
    const fresh = newKey();
    freshKeysRef.current.add(fresh);
    setEntries((prev) => [
      { key: fresh, ...emptyText() },
      ...prev.filter((entry) => entry.key !== key)
    ]);
    setActiveKey(fresh);
    session.activeKey = '';
    if (id) {
      try {
        await deleteDraft(id);
      } catch (error) {
        console.error('Failed to delete draft:', error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The post has gone, failed, or was handed to the file upload (which
  // clears the form first).
  const finishPost = useCallback(() => {
    session.postsInFlight = Math.max(0, session.postsInFlight - 1);
  }, []);

  // A post that didn't go: its text saves again as a draft. It's passed in
  // because a form reopened meanwhile may hold another draft's text.
  const keepAsDraft = useCallback((text: PostDraftText) => {
    if (isEmptyDraftText(text)) return;
    const key = mountedRef.current ? activeKeyRef.current : newKey();
    if (!key) return;
    // the form (closed) reopens on this draft rather than saving it again
    if (!mountedRef.current) session.activeKey = key;
    void saveNow(key, text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A failed file post put back in the form: it saves as its own new
  // draft, never into whichever draft the form had open.
  const saveFormAsNewDraft = useCallback(() => {
    if (!initializedRef.current || isPosting()) return;
    let key = activeKeyRef.current;
    const freshAndUnsaved =
      !!key &&
      freshKeysRef.current.has(key) &&
      !session.idByKey.has(key) &&
      !session.chain.has(key);
    if (!freshAndUnsaved) {
      key = newKey();
      freshKeysRef.current.add(key);
      const text = getText();
      setEntries((prev) => [{ key, ...text }, ...prev]);
      setActiveKey(key);
    }
    scheduleSave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    entries,
    activeKey,
    activeIsFresh: freshKeysRef.current.has(activeKey),
    busy,
    error,
    savingState,
    scheduleSave,
    switchTo,
    startNew,
    remove,
    markPosted,
    finishPost,
    keepAsDraft,
    saveFormAsNewDraft
  };

  function startBusy(key: string) {
    busyRef.current = key;
    setBusy(key);
  }

  function endBusy() {
    busyRef.current = null;
    if (mountedRef.current) setBusy(null);
  }

  function cancelPendingSave() {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = null;
    pendingRef.current = null;
  }

  // Saves the draft being left (an empty one is dropped) and keeps its
  // attachments with it in memory. If the save fails, it stays open.
  async function leaveActive() {
    const from = activeKeyRef.current;
    if (!from) return true;
    const text = getText();
    cancelPendingSave();
    setError('');
    session.extrasByKey.set(from, getExtras());
    const result = await saveNow(from, text);
    if (result === 'failed') {
      if (mountedRef.current) setError(SAVE_FAILED_MESSAGE);
      if (activeKeyRef.current === from) scheduleSave();
      return false;
    }
    if (isEmptyDraftText(text)) {
      session.extrasByKey.delete(from);
      setEntries((prev) => prev.filter((entry) => entry.key !== from));
    }
    return true;
  }

  function saveNow(key: string, text: PostDraftText): Promise<SaveResult> {
    const run = async (): Promise<SaveResult> => {
      if (session.removedKeys.has(key)) return 'skipped';
      const id = session.idByKey.get(key);
      setEntries((prev) =>
        prev.map((entry) => (entry.key === key ? { ...entry, ...text } : entry))
      );
      if (isEmptyDraftText(text)) {
        // an emptied draft is no draft
        if (!id) return 'skipped';
        session.idByKey.delete(key);
        session.savedTextByKey.delete(key);
        if (key === activeKeyRef.current) syncDraftIdRef();
        try {
          await deleteDraft(id);
        } catch (error) {
          console.error('Failed to delete draft:', error);
        }
        return 'skipped';
      }
      try {
        const result = await saveDraft({
          contentType: 'subject',
          draftId: id,
          title: text.title,
          description: text.description,
          content: '',
          secretAnswer: text.secretAnswer
        });
        const savedId = Number(result?.draftId) || 0;
        if (!savedId) return 'failed';
        if (session.removedKeys.has(key)) {
          // deleted or posted while its first save was on its way
          // (or recreated by the server after it was deleted)
          if (savedId !== id) await deleteDraft(savedId).catch(() => {});
          return 'skipped';
        }
        session.idByKey.set(key, savedId);
        session.savedTextByKey.set(key, text);
        // the list may already hold this draft under another key
        for (const [otherKey, otherId] of session.idByKey) {
          if (otherKey === key || otherId !== savedId) continue;
          session.idByKey.delete(otherKey);
          session.savedTextByKey.delete(otherKey);
          setEntries((prev) => prev.filter((entry) => entry.key !== otherKey));
          if (pendingRef.current?.key === otherKey) {
            pendingRef.current.key = key;
          }
          if (activeKeyRef.current === otherKey) setActiveKey(key);
        }
        if (key === activeKeyRef.current) syncDraftIdRef();
        return 'saved';
      } catch (error) {
        console.error('Failed to save draft:', error);
        return 'failed';
      }
    };
    const previous = session.chain.get(key);
    const next = previous ? previous.then(run, run) : run();
    session.chain.set(key, next);
    void next.then(() => {
      if (session.chain.get(key) === next) session.chain.delete(key);
    });
    return next;
  }
}

function keyForId(id: number) {
  for (const [key, knownId] of session.idByKey) {
    if (knownId === id) return key;
  }
  const key = `d${id}`;
  session.idByKey.set(key, id);
  return key;
}

function newKey() {
  session.newCount += 1;
  return `n${session.newCount}`;
}

function emptyText(): PostDraftText {
  return { title: '', description: '', secretAnswer: '' };
}

function textOf(text: PostDraftText): PostDraftText {
  return {
    title: text.title || '',
    description: text.description || '',
    secretAnswer: text.secretAnswer || ''
  };
}

function sameText(a: PostDraftText, b: PostDraftText) {
  return (
    (a.title || '') === (b.title || '') &&
    (a.description || '') === (b.description || '') &&
    (a.secretAnswer || '') === (b.secretAnswer || '')
  );
}

export function normalizeDraftDescription({
  description,
  title
}: {
  description: string;
  title: string;
}) {
  const normalizedTitle = title.trim();
  if (stringIsEmpty(description) || stringIsEmpty(normalizedTitle)) {
    return description || '';
  }

  const normalizedDescription = description.replace(/\r\n/g, '\n');
  if (!normalizedDescription.startsWith(normalizedTitle)) {
    return description;
  }

  const remainder = normalizedDescription.slice(normalizedTitle.length);
  if (!/^\n{3,}/.test(remainder)) {
    return description;
  }

  const nextDescription = remainder.replace(/^\n+/, '');
  return stringIsEmpty(nextDescription) ? description : nextDescription;
}
