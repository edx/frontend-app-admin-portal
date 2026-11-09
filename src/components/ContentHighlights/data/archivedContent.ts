import type { HighlightSet } from '../../../data/services/types';
import { isArchivedContent } from '../../../utils';
import { NEW_ARCHIVED_CONTENT_ALERT_DISMISSED_COOKIE_NAME } from './constants';

/** Content keys grouped by highlight set uuid. */
export type ContentKeysByHighlightSet = Record<string, string[]>;

/** Highlight sets are null until the enterprise curation has loaded. */
type LoadedHighlightSets = HighlightSet[] | null | undefined;

const getDismissedStorageKey = (highlightSetUUID: string) => (
  `${NEW_ARCHIVED_CONTENT_ALERT_DISMISSED_COOKIE_NAME}-${highlightSetUUID}`
);

/**
 * Groups the content keys of archived highlighted content by highlight set uuid.
 *
 * Shared by the curation reducer (sidebar notification) and ContentHighlightArchivedAlert
 * (dismissal) so the two always agree on which archived content exists.
 */
export function getArchivedContentKeysByHighlightSet(highlightSets: LoadedHighlightSets): ContentKeysByHighlightSet {
  const archivedContentKeys: ContentKeysByHighlightSet = {};
  (highlightSets ?? []).forEach((highlightSet) => {
    const contentKeys = highlightSet.highlightedContent
      .filter(content => isArchivedContent(content))
      .map(content => content.contentKey);
    if (contentKeys.length > 0) {
      archivedContentKeys[highlightSet.uuid] = contentKeys;
    }
  });
  return archivedContentKeys;
}

/**
 * Returns the archived content keys an admin has already dismissed for a highlight set.
 *
 * Dismissals are stored comma-joined (e.g. "edX+DemoX,edX+Other"), so they are split back into exact
 * keys. A substring check on the raw string would wrongly treat "edX+DemoX" as dismissed when only
 * "edX+DemoX2" was. When storage is unavailable (blocked site data throws a SecurityError), nothing is
 * treated as dismissed so the archived content warning still shows.
 */
export function getDismissedArchivedContentKeys(highlightSetUUID: string): string[] {
  try {
    const storedValue = globalThis.localStorage.getItem(getDismissedStorageKey(highlightSetUUID));
    return storedValue ? storedValue.split(',') : [];
  } catch {
    return [];
  }
}

/**
 * Persists the dismissed archived content keys for a highlight set, in the comma-joined format read by
 * getDismissedArchivedContentKeys. Does nothing when storage is unavailable.
 */
export function setDismissedArchivedContentKeys(highlightSetUUID: string, contentKeys: string[]): void {
  try {
    globalThis.localStorage.setItem(getDismissedStorageKey(highlightSetUUID), contentKeys.join(','));
  } catch {
    // Storage is unavailable; the dismissal only lasts for this page view.
  }
}

/**
 * Reads the stored dismissals for every highlight set that has archived content. Kept out of the
 * curation reducer so the reducer stays free of I/O.
 */
export function getDismissedArchivedContentKeysByHighlightSet(
  highlightSets: LoadedHighlightSets,
): ContentKeysByHighlightSet {
  return Object.fromEntries(
    Object.keys(getArchivedContentKeysByHighlightSet(highlightSets)).map(
      highlightSetUUID => [highlightSetUUID, getDismissedArchivedContentKeys(highlightSetUUID)],
    ),
  );
}

/**
 * Whether any highlight set has archived content that the admin has not dismissed yet.
 */
export function hasUndismissedArchivedContent(
  highlightSets: LoadedHighlightSets,
  dismissedContentKeys: ContentKeysByHighlightSet = {},
): boolean {
  return Object.entries(getArchivedContentKeysByHighlightSet(highlightSets)).some(
    ([highlightSetUUID, contentKeys]) => {
      const dismissed = new Set(dismissedContentKeys[highlightSetUUID] || []);
      return contentKeys.some(contentKey => !dismissed.has(contentKey));
    },
  );
}
