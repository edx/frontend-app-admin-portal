import { renderHook } from '@testing-library/react';

import useEnterpriseCuration from './useEnterpriseCuration';
import useEnterpriseCurationContext from './useEnterpriseCurationContext';
import { NEW_ARCHIVED_CONTENT_ALERT_DISMISSED_COOKIE_NAME } from '../../../ContentHighlights/data/constants';

const TEST_ENTERPRISE_UUID = 'test-enterprise-uuid';
const TEST_ENTERPRISE_NAME = 'Test Enterprise';

jest.mock('./useEnterpriseCuration');

describe('useEnterpriseCurationContext', () => {
  beforeEach(() => {
    // clearAllMocks, not resetAllMocks: resetting would also wipe the jest-localstorage-mock
    // implementations of localStorage.getItem/setItem used by the dismissal tests below.
    jest.clearAllMocks();
  });

  afterEach(() => {
    global.localStorage.clear();
  });

  it('should return expected context value', async () => {
    const mockEnterpriseCurationConfig = { uuid: 'fake-uuid' };
    useEnterpriseCuration.mockReturnValue({
      isLoading: false,
      enterpriseCuration: mockEnterpriseCurationConfig,
      enterpriseHighlightedSets: null,
      fetchError: null,
    });
    const args = {
      enterpriseId: TEST_ENTERPRISE_UUID,
      curationTitleForCreation: TEST_ENTERPRISE_NAME,
    };
    const { result } = renderHook(() => useEnterpriseCurationContext(args));

    expect(result.current).toEqual(
      expect.objectContaining({
        isLoading: false,
        enterpriseCuration: mockEnterpriseCurationConfig,
        enterpriseHighlightedSets: null,
        fetchError: null,
      }),
    );
  });

  describe('isNewArchivedContent', () => {
    const args = {
      enterpriseId: TEST_ENTERPRISE_UUID,
      curationTitleForCreation: TEST_ENTERPRISE_NAME,
    };
    const mockHighlightedSets = (enterpriseHighlightedSets) => {
      useEnterpriseCuration.mockReturnValue({
        isLoading: false,
        enterpriseCuration: { uuid: 'fake-uuid' },
        enterpriseHighlightedSets,
        fetchError: null,
      });
    };
    const highlightedSets = [{
      uuid: 'test-uuid',
      highlightedContent: [{ contentKey: 'edX+DemoX', courseRunStatuses: ['archived'] }],
    }];
    const dismissedStorageKey = `${NEW_ARCHIVED_CONTENT_ALERT_DISMISSED_COOKIE_NAME}-test-uuid`;

    it('is true when archived content has not been dismissed', () => {
      mockHighlightedSets(highlightedSets);
      const { result } = renderHook(() => useEnterpriseCurationContext(args));
      expect(result.current.isNewArchivedContent).toBe(true);
    });

    it('is false when the archived content was dismissed in localStorage', () => {
      global.localStorage.setItem(dismissedStorageKey, ['edX+DemoX']);
      mockHighlightedSets(highlightedSets);
      const { result } = renderHook(() => useEnterpriseCurationContext(args));
      expect(result.current.isNewArchivedContent).toBe(false);
    });

    it('is true when only a key sharing a prefix was dismissed', () => {
      global.localStorage.setItem(dismissedStorageKey, ['edX+DemoX2']);
      mockHighlightedSets(highlightedSets);
      const { result } = renderHook(() => useEnterpriseCurationContext(args));
      expect(result.current.isNewArchivedContent).toBe(true);
    });
  });
});
