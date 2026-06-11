import React from 'react';
import {
  act, renderHook, waitFor,
} from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IntlProvider } from '@edx/frontend-platform/i18n';
import { logError } from '@edx/frontend-platform/logging';
import EnterpriseCatalogApiService from '../../../../data/services/EnterpriseCatalogApiService';
import useFeaturedStarring from '../useFeaturedStarring';
import { getHighlightSetQueryKey } from '../hooks';

jest.mock('../../../../data/services/EnterpriseCatalogApiService');
jest.mock('@edx/frontend-platform/logging');

const createWrapper = (queryClient) => function Wrapper({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <IntlProvider locale="en">{children}</IntlProvider>
    </QueryClientProvider>
  );
};

const makeQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const highlightSetUUID = 'highlight-set-uuid-123';

const mockHighlightedContent = [
  {
    uuid: 'content-1',
    contentKey: 'edX+Course1',
    title: 'Course Alpha',
    contentType: 'course',
    isFavorite: true,
    authoringOrganizations: [{ uuid: 'org-1', name: 'OrgA', logoImageUrl: 'https://example.com/logo.png' }],
  },
  {
    uuid: 'content-2',
    contentKey: 'edX+Course2',
    title: 'Course Beta',
    contentType: 'course',
    isFavorite: false,
    authoringOrganizations: [{ uuid: 'org-2', name: 'OrgB' }],
  },
  {
    uuid: 'content-3',
    contentKey: 'edX+Course3',
    title: 'Course Gamma',
    contentType: 'program',
    isFavorite: true,
    authoringOrganizations: [{ uuid: 'org-3', name: 'OrgC' }],
  },
  {
    uuid: 'content-4',
    contentKey: 'edX+Course4',
    title: 'Course Delta',
    contentType: 'course',
    isFavorite: false,
    authoringOrganizations: [{ uuid: 'org-4', name: 'OrgD' }],
  },
  {
    uuid: 'content-5',
    contentKey: 'edX+Course5',
    title: 'Course Epsilon',
    contentType: 'course',
    isFavorite: true,
    authoringOrganizations: [{ uuid: 'org-5', name: 'OrgE' }],
  },
  {
    uuid: 'content-6',
    contentKey: 'edX+Course6',
    title: 'Course Zeta',
    contentType: 'course',
    isFavorite: true,
    authoringOrganizations: [{ uuid: 'org-6', name: 'OrgF' }],
  },
];

describe('useFeaturedStarring', () => {
  let testQueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    testQueryClient = makeQueryClient();
  });

  it('initializes starredContentKeys from isFavorite items', () => {
    const { result } = renderHook(
      () => useFeaturedStarring(highlightSetUUID, mockHighlightedContent),
      { wrapper: createWrapper(testQueryClient) },
    );
    expect(result.current.starredContentKeys.has('edX+Course1')).toBe(true);
    expect(result.current.starredContentKeys.has('edX+Course3')).toBe(true);
    expect(result.current.starredContentKeys.has('edX+Course5')).toBe(true);
    expect(result.current.starredContentKeys.has('edX+Course6')).toBe(true);
    expect(result.current.starredContentKeys.has('edX+Course2')).toBe(false);
  });

  it('returns starredItems derived from starredContentKeys', () => {
    const { result } = renderHook(
      () => useFeaturedStarring(highlightSetUUID, mockHighlightedContent),
      { wrapper: createWrapper(testQueryClient) },
    );

    expect(result.current.starredItems).toHaveLength(4);
    expect(result.current.starredItems.map((item) => item.contentKey)).toEqual([
      'edX+Course1',
      'edX+Course3',
      'edX+Course5',
      'edX+Course6',
    ]);
  });

  it('returns loadingContentKey as null initially', () => {
    const { result } = renderHook(
      () => useFeaturedStarring(highlightSetUUID, mockHighlightedContent),
      { wrapper: createWrapper(testQueryClient) },
    );
    expect(result.current.loadingContentKey).toBeNull();
  });

  it('returns isMaxStarredModalOpen as false initially', () => {
    const { result } = renderHook(
      () => useFeaturedStarring(highlightSetUUID, mockHighlightedContent),
      { wrapper: createWrapper(testQueryClient) },
    );
    expect(result.current.isMaxStarredModalOpen).toBe(false);
  });

  it('opens max starred modal when trying to star beyond max', () => {
    // All 4 slots are taken (content-1, content-3, content-5, content-6)
    const { result } = renderHook(
      () => useFeaturedStarring(highlightSetUUID, mockHighlightedContent),
      { wrapper: createWrapper(testQueryClient) },
    );

    act(() => {
      result.current.handleToggleStar('edX+Course2'); // 5th item
    });

    expect(result.current.isMaxStarredModalOpen).toBe(true);
    expect(result.current.starredContentKeys.has('edX+Course2')).toBe(false);
  });

  it('closes max starred modal via closeMaxStarredModal', () => {
    const { result } = renderHook(
      () => useFeaturedStarring(highlightSetUUID, mockHighlightedContent),
      { wrapper: createWrapper(testQueryClient) },
    );

    act(() => {
      result.current.handleToggleStar('edX+Course2');
    });
    expect(result.current.isMaxStarredModalOpen).toBe(true);

    act(() => {
      result.current.closeMaxStarredModal();
    });
    expect(result.current.isMaxStarredModalOpen).toBe(false);
  });

  it('optimistically unstars a starred item', async () => {
    EnterpriseCatalogApiService.toggleFavoriteHighlight.mockResolvedValue({});

    const { result } = renderHook(
      () => useFeaturedStarring(highlightSetUUID, mockHighlightedContent),
      { wrapper: createWrapper(testQueryClient) },
    );

    act(() => {
      result.current.handleToggleStar('edX+Course1'); // unstar
    });

    expect(result.current.starredContentKeys.has('edX+Course1')).toBe(false);

    await waitFor(() => {
      expect(EnterpriseCatalogApiService.toggleFavoriteHighlight).toHaveBeenCalledWith(
        highlightSetUUID,
        'content-1',
        false,
      );
    });
  });

  it('optimistically stars an unstarred item and sets loadingContentKey', async () => {
    const content = mockHighlightedContent.slice(0, 3); // 2 favorites
    EnterpriseCatalogApiService.toggleFavoriteHighlight.mockResolvedValue({});

    const { result } = renderHook(
      () => useFeaturedStarring(highlightSetUUID, content),
      { wrapper: createWrapper(testQueryClient) },
    );

    act(() => {
      result.current.handleToggleStar('edX+Course2');
    });

    expect(result.current.starredContentKeys.has('edX+Course2')).toBe(true);
    expect(result.current.loadingContentKey).toBe('edX+Course2');

    await waitFor(() => {
      expect(EnterpriseCatalogApiService.toggleFavoriteHighlight).toHaveBeenCalledWith(
        highlightSetUUID,
        'content-2',
        true,
      );
      expect(result.current.loadingContentKey).toBeNull();
    });
  });

  it('reverts optimistic update on API failure', async () => {
    const content = mockHighlightedContent.slice(0, 3);
    EnterpriseCatalogApiService.toggleFavoriteHighlight.mockRejectedValue(new Error('API error'));

    const { result } = renderHook(
      () => useFeaturedStarring(highlightSetUUID, content),
      { wrapper: createWrapper(testQueryClient) },
    );

    act(() => {
      result.current.handleToggleStar('edX+Course2');
    });

    expect(result.current.starredContentKeys.has('edX+Course2')).toBe(true);

    await waitFor(() => {
      expect(result.current.starredContentKeys.has('edX+Course2')).toBe(false);
      expect(result.current.loadingContentKey).toBeNull();
      expect(logError).toHaveBeenCalled();
    });
  });

  it('does nothing if contentKey is not found in highlightedContent', () => {
    const { result } = renderHook(
      () => useFeaturedStarring(highlightSetUUID, mockHighlightedContent),
      { wrapper: createWrapper(testQueryClient) },
    );

    act(() => {
      result.current.handleToggleStar('nonexistent-key');
    });

    expect(EnterpriseCatalogApiService.toggleFavoriteHighlight).not.toHaveBeenCalled();
  });

  it('does not reinitialize starred keys on subsequent renders', () => {
    const content = [
      { ...mockHighlightedContent[0], isFavorite: true },
      { ...mockHighlightedContent[1], isFavorite: false },
    ];

    const { result, rerender } = renderHook(
      ({ items }) => useFeaturedStarring(highlightSetUUID, items),
      { wrapper: createWrapper(testQueryClient), initialProps: { items: content } },
    );

    expect(result.current.starredContentKeys.has('edX+Course1')).toBe(true);

    const updatedContent = [
      { ...mockHighlightedContent[0], isFavorite: false },
      { ...mockHighlightedContent[1], isFavorite: true },
    ];

    rerender({ items: updatedContent });

    // Should NOT reinitialize — still has original state
    expect(result.current.starredContentKeys.has('edX+Course1')).toBe(true);
    expect(result.current.starredContentKeys.has('edX+Course2')).toBe(false);
  });

  it('updates the cached highlight set when starring or unstarring', async () => {
    EnterpriseCatalogApiService.toggleFavoriteHighlight.mockResolvedValue({});

    const content = mockHighlightedContent.slice(0, 3);
    const queryKey = getHighlightSetQueryKey(highlightSetUUID);

    testQueryClient.setQueryData(queryKey, {
      uuid: highlightSetUUID,
      highlightedContent: content,
    });

    const setQueryDataSpy = jest.spyOn(testQueryClient, 'setQueryData');

    const { result } = renderHook(
      () => useFeaturedStarring(highlightSetUUID, content),
      { wrapper: createWrapper(testQueryClient) },
    );

    await act(async () => {
      result.current.handleToggleStar('edX+Course2');
    });

    await waitFor(() => expect(setQueryDataSpy).toHaveBeenCalledWith(queryKey, expect.any(Function)));

    const updaterFn = setQueryDataSpy.mock.calls[0][1];
    const starredCachedHighlightSet = updaterFn({
      uuid: highlightSetUUID,
      highlightedContent: content,
    });

    expect(
      starredCachedHighlightSet.highlightedContent.find((item) => item.contentKey === 'edX+Course2').isFavorite,
    ).toBe(true);

    expect(
      starredCachedHighlightSet.highlightedContent.find((item) => item.contentKey === 'edX+Course1').isFavorite,
    ).toBe(true);
    expect(
      starredCachedHighlightSet.highlightedContent.find((item) => item.contentKey === 'edX+Course3').isFavorite,
    ).toBe(true);

    setQueryDataSpy.mockClear();

    await act(async () => {
      result.current.handleToggleStar('edX+Course2');
    });

    await waitFor(() => expect(setQueryDataSpy).toHaveBeenCalledWith(queryKey, expect.any(Function)));

    const unstarUpdaterFn = setQueryDataSpy.mock.calls[0][1];
    const unstarredCachedHighlightSet = unstarUpdaterFn({
      uuid: highlightSetUUID,
      highlightedContent: content,
    });

    expect(
      unstarredCachedHighlightSet.highlightedContent.find((item) => item.contentKey === 'edX+Course2').isFavorite,
    ).toBe(false);
  });
});
