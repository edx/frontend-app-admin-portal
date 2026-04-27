import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { useContextSelector } from 'use-context-selector';
import EnterpriseCatalogApiService from '../../../data/services/EnterpriseCatalogApiService';
import type { HighlightSet, HighlightedContentItem } from '../../../data/services/types';
import { ContentHighlightsContext } from '../ContentHighlightsContext';

type HighlightSetForCuration = {
  isPublished: boolean;
  [key: string]: unknown;
};

type EnterpriseCurationWithHighlightSets = {
  highlightSets?: HighlightSetForCuration[];
};

const getHighlightSetQueryKey = (highlightSetUUID: string | undefined) => ['highlightSet', highlightSetUUID] as const;

export function useHighlightSetsForCuration(enterpriseCuration?: EnterpriseCurationWithHighlightSets | null) {
  const [highlightSets, setHighlightSets] = useState<{
    draft: HighlightSetForCuration[];
    published: HighlightSetForCuration[];
  }>({
    draft: [],
    published: [],
  });

  useEffect(() => {
    const highlightSetsForCuration = enterpriseCuration?.highlightSets;
    const draftHighlightSets: HighlightSetForCuration[] = [];
    const publishedHighlightSets: HighlightSetForCuration[] = [];

    highlightSetsForCuration?.forEach((highlightSet) => {
      if (highlightSet.isPublished) {
        publishedHighlightSets.push(highlightSet);
      } else {
        draftHighlightSets.push(highlightSet);
      }
    });

    setHighlightSets({
      draft: draftHighlightSets,
      published: publishedHighlightSets,
    });
  }, [enterpriseCuration]);

  return highlightSets;
}

export function useHighlightSet(highlightSetUUID: string | undefined) {
  const queryClient = useQueryClient();

  const {
    data: highlightSet,
    isLoading,
    error,
  } = useQuery<HighlightSet | null>({
    queryKey: getHighlightSetQueryKey(highlightSetUUID),
    queryFn: () => EnterpriseCatalogApiService.fetchHighlightSet(highlightSetUUID as string),
    enabled: !!highlightSetUUID,
  });

  const updateHighlightSet = useCallback((highlightSetContentItems: HighlightedContentItem[]) => {
    if (!highlightSetUUID) {
      return;
    }

    queryClient.setQueryData<HighlightSet | null>(
      getHighlightSetQueryKey(highlightSetUUID),
      (previousHighlightSet) => {
        if (!previousHighlightSet) {
          return previousHighlightSet;
        }

        return {
          ...previousHighlightSet,
          highlightedContent: highlightSetContentItems,
        };
      },
    );
  }, [highlightSetUUID, queryClient]);

  return {
    updateHighlightSet,
    highlightSet: highlightSet || [],
    isLoading,
    error,
  };
}

/**
 * Defines an interface to mutate the `ContentHighlightsContext` context value.
 */
export function useContentHighlightsContext() {
  const setState = useContextSelector(ContentHighlightsContext, v => v[1]);
  // eslint-disable-next-line max-len
  const currentSelectedRowState = useContextSelector(ContentHighlightsContext, v => v[0].stepperModal.currentSelectedRowIds);
  const openStepperModal = useCallback(() => {
    setState(s => ({
      ...s,
      stepperModal: {
        ...s.stepperModal,
        isOpen: true,
      },
    }));
  }, [setState]);

  const resetStepperModal = useCallback(() => {
    setState(s => ({
      ...s,
      stepperModal: {
        ...s.stepperModal,
        isOpen: false,
        highlightTitle: null,
        titleStepValidationError: null,
        currentSelectedRowIds: {},
      },
    }));
  }, [setState]);

  const setCurrentSelectedRowIds = useCallback((selectedRowIds) => {
    setState(s => ({
      ...s,
      stepperModal: {
        ...s.stepperModal,
        currentSelectedRowIds: selectedRowIds,
      },
    }));
  }, [setState]);

  const deleteSelectedRowId = useCallback((rowId) => {
    setState(s => {
      const currentRowIds = { ...currentSelectedRowState };
      delete currentRowIds[rowId];
      return {
        ...s,
        stepperModal: {
          ...s.stepperModal,
          currentSelectedRowIds: currentRowIds,
        },
      };
    });
  }, [setState, currentSelectedRowState]);

  const setHighlightTitle = useCallback(({ highlightTitle, titleStepValidationError }) => {
    setState(s => ({
      ...s,
      stepperModal: {
        ...s.stepperModal,
        highlightTitle,
        titleStepValidationError,
      },
    }));
  }, [setState]);

  const setCatalogVisibilityAlert = useCallback(({ isOpen }) => {
    setState(s => ({
      ...s,
      catalogVisibilityAlertOpen: isOpen,
    }));
  }, [setState]);

  return {
    openStepperModal,
    resetStepperModal,
    deleteSelectedRowId,
    setCurrentSelectedRowIds,
    setHighlightTitle,
    setCatalogVisibilityAlert,
  };
}
