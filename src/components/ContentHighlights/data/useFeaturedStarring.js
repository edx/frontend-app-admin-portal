import {
  useState, useCallback, useEffect, useMemo, useContext,
} from 'react';
import { defaultContext } from '@tanstack/react-query';
import { getConfig } from '@edx/frontend-platform';
import { useToggle } from '@openedx/paragon';
import { logError } from '@edx/frontend-platform/logging';
import EnterpriseCatalogApiService from '../../../data/services/EnterpriseCatalogApiService';
import { getHighlightSetQueryKey } from './hooks';

const { MAX_STARRED_CONTENT_ITEMS_PER_HIGHLIGHT_SET = 4 } = getConfig();

/**
 * Custom hook that encapsulates all starring state and logic.
 * Persists starring via the toggle-favorite-highlight API endpoint.
 * Initializes from `highlightedContent[].isFavorite` returned by the backend.
 */
const useFeaturedStarring = (highlightSetUUID, highlightedContent) => {
  const queryClient = useContext(defaultContext);
  const [isMaxStarredModalOpen, openMaxStarredModal, closeMaxStarredModal] = useToggle(false);
  const [starredContentKeys, setStarredContentKeys] = useState(new Set());
  const [loadingContentKey, setLoadingContentKey] = useState(null);

  useEffect(() => {
    setStarredContentKeys(new Set(
      (highlightedContent || [])
        .filter((item) => item.isFavorite)
        .map((item) => item.contentKey),
    ));
  }, [highlightedContent]);

  const starredItems = useMemo(
    () => highlightedContent?.filter(({ contentKey }) => starredContentKeys.has(contentKey)) || [],
    [highlightedContent, starredContentKeys],
  );

  const handleToggleStar = useCallback((contentKey) => {
    const contentItem = highlightedContent?.find((item) => item.contentKey === contentKey);
    if (!contentItem) { return; }

    const shouldFavorite = !starredContentKeys.has(contentKey);
    if (shouldFavorite && starredContentKeys.size >= MAX_STARRED_CONTENT_ITEMS_PER_HIGHLIGHT_SET) {
      openMaxStarredModal();
      return;
    }

    const prevStarredKeys = new Set(starredContentKeys);

    const next = new Set(starredContentKeys);
    if (shouldFavorite) {
      next.add(contentKey);
      setLoadingContentKey(contentKey);
    } else {
      next.delete(contentKey);
    }
    setStarredContentKeys(next);

    EnterpriseCatalogApiService.toggleFavoriteHighlight(
      highlightSetUUID,
      contentItem.uuid,
      shouldFavorite,
    ).then(() => {
      if (queryClient) {
        queryClient.setQueryData(
          getHighlightSetQueryKey(highlightSetUUID),
          (previousHighlightSet) => {
            if (!previousHighlightSet?.highlightedContent) {
              return previousHighlightSet;
            }

            return {
              ...previousHighlightSet,
              highlightedContent: previousHighlightSet.highlightedContent.map((item) => (
                item.contentKey === contentKey
                  ? { ...item, isFavorite: shouldFavorite }
                  : item
              )),
            };
          },
        );

        queryClient.invalidateQueries({
          queryKey: getHighlightSetQueryKey(highlightSetUUID),
          exact: true,
        });
      }

      setLoadingContentKey((currentLoadingContentKey) => (
        currentLoadingContentKey === contentKey ? null : currentLoadingContentKey
      ));
    }).catch((err) => {
      logError(err);
      // Revert to pre-toggle state
      setStarredContentKeys(prevStarredKeys);
      setLoadingContentKey((currentLoadingContentKey) => (
        currentLoadingContentKey === contentKey ? null : currentLoadingContentKey
      ));
    });
  }, [openMaxStarredModal, highlightSetUUID, highlightedContent, starredContentKeys, queryClient]);

  return {
    starredContentKeys,
    starredItems,
    loadingContentKey,
    isMaxStarredModalOpen,
    closeMaxStarredModal,
    handleToggleStar,
  };
};

export default useFeaturedStarring;
