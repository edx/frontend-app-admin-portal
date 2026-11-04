import {
  getArchivedContentKeysByHighlightSet,
  getDismissedArchivedContentKeys,
  getDismissedArchivedContentKeysByHighlightSet,
  hasUndismissedArchivedContent,
  setDismissedArchivedContentKeys,
} from '../archivedContent';
import { NEW_ARCHIVED_CONTENT_ALERT_DISMISSED_COOKIE_NAME } from '../constants';

const archived = (contentKey) => ({ contentKey, courseRunStatuses: ['archived'] });
const active = (contentKey) => ({ contentKey, courseRunStatuses: ['published'] });
const storageKey = (highlightSetUUID) => `${NEW_ARCHIVED_CONTENT_ALERT_DISMISSED_COOKIE_NAME}-${highlightSetUUID}`;

describe('archivedContent', () => {
  afterEach(() => {
    global.localStorage.clear();
  });

  describe('getArchivedContentKeysByHighlightSet', () => {
    it('groups archived content keys by highlight set uuid', () => {
      const highlightSets = [
        { uuid: 'set-1', highlightedContent: [archived('a'), active('b'), archived('c')] },
        { uuid: 'set-2', highlightedContent: [active('d')] },
        { uuid: 'set-3', highlightedContent: [archived('e')] },
      ];
      expect(getArchivedContentKeysByHighlightSet(highlightSets)).toEqual({
        'set-1': ['a', 'c'],
        'set-3': ['e'],
      });
    });

    it.each([null, undefined])('returns an empty map before highlight sets have loaded (%p)', (highlightSets) => {
      expect(getArchivedContentKeysByHighlightSet(highlightSets)).toEqual({});
    });
  });

  describe('getDismissedArchivedContentKeys', () => {
    it('returns an empty list when nothing was dismissed', () => {
      expect(getDismissedArchivedContentKeys('set-1')).toEqual([]);
    });

    it('reads a single key stored the way the alert has always written it', () => {
      // The alert historically passed the array straight to setItem, which stores String(array).
      global.localStorage.setItem(storageKey('set-1'), ['edX+DemoX']);
      expect(getDismissedArchivedContentKeys('set-1')).toEqual(['edX+DemoX']);
    });

    it('splits multiple comma-joined keys into exact keys', () => {
      global.localStorage.setItem(storageKey('set-1'), ['edX+DemoX', 'edX+Other']);
      expect(getDismissedArchivedContentKeys('set-1')).toEqual(['edX+DemoX', 'edX+Other']);
    });

    it('returns an empty list when storage access throws', () => {
      global.localStorage.setItem(storageKey('set-1'), ['edX+DemoX']);
      // jest-localstorage-mock exposes getItem/setItem as jest.fn on the instance, not on Storage.prototype.
      global.localStorage.getItem.mockImplementationOnce(() => {
        throw new DOMException('The operation is insecure.', 'SecurityError');
      });
      expect(getDismissedArchivedContentKeys('set-1')).toEqual([]);
      expect(global.localStorage.getItem).toHaveBeenCalledWith(storageKey('set-1'));
    });
  });

  describe('setDismissedArchivedContentKeys', () => {
    it('stores keys comma-joined so they round-trip', () => {
      setDismissedArchivedContentKeys('set-1', ['edX+DemoX', 'edX+Other']);
      expect(global.localStorage.getItem(storageKey('set-1'))).toEqual('edX+DemoX,edX+Other');
      expect(getDismissedArchivedContentKeys('set-1')).toEqual(['edX+DemoX', 'edX+Other']);
    });

    it('does not throw when storage access throws', () => {
      global.localStorage.setItem.mockImplementationOnce(() => {
        throw new DOMException('The operation is insecure.', 'SecurityError');
      });
      expect(() => setDismissedArchivedContentKeys('set-1', ['edX+DemoX'])).not.toThrow();
      expect(global.localStorage.setItem).toHaveBeenCalledWith(storageKey('set-1'), 'edX+DemoX');
      expect(global.localStorage.getItem(storageKey('set-1'))).toBeNull();
    });
  });

  describe('getDismissedArchivedContentKeysByHighlightSet', () => {
    it('reads dismissals only for highlight sets that have archived content', () => {
      global.localStorage.setItem(storageKey('set-1'), ['a']);
      global.localStorage.setItem(storageKey('set-2'), ['b']);
      const highlightSets = [
        { uuid: 'set-1', highlightedContent: [archived('a')] },
        { uuid: 'set-2', highlightedContent: [active('b')] },
        { uuid: 'set-3', highlightedContent: [archived('c')] },
      ];
      expect(getDismissedArchivedContentKeysByHighlightSet(highlightSets)).toEqual({
        'set-1': ['a'],
        'set-3': [],
      });
    });
  });

  describe('hasUndismissedArchivedContent', () => {
    const highlightSets = [{ uuid: 'set-1', highlightedContent: [archived('edX+DemoX')] }];

    it('is true when archived content has not been dismissed', () => {
      expect(hasUndismissedArchivedContent(highlightSets)).toBe(true);
    });

    it('is false when every archived item was dismissed', () => {
      expect(hasUndismissedArchivedContent(highlightSets, { 'set-1': ['edX+DemoX'] })).toBe(false);
    });

    it('is true when the archived key is only a prefix of a dismissed key', () => {
      global.localStorage.setItem(storageKey('set-1'), ['edX+DemoX2']);
      const dismissed = getDismissedArchivedContentKeysByHighlightSet(highlightSets);
      expect(hasUndismissedArchivedContent(highlightSets, dismissed)).toBe(true);
    });

    it('is false when there is no archived content', () => {
      expect(hasUndismissedArchivedContent([{ uuid: 'set-1', highlightedContent: [active('a')] }])).toBe(false);
    });
  });
});
