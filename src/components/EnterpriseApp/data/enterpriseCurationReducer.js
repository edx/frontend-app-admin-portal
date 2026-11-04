import { logError } from '@edx/frontend-platform/logging';
import { hasUndismissedArchivedContent } from '../../ContentHighlights/data/archivedContent';

export const initialReducerState = {
  isLoading: true,
  enterpriseCuration: null,
  enterpriseHighlightedSets: null,
  fetchError: null,
};

export const SET_IS_LOADING = 'SET_IS_LOADING';
export const SET_ENTERPRISE_CURATION = 'SET_ENTERPRISE_CURATION';
export const SET_FETCH_ERROR = 'SET_FETCH_ERROR';
export const DELETE_HIGHLIGHT_SET = 'DELETE_HIGHLIGHT_SET';
export const ADD_HIGHLIGHT_SET = 'ADD_HIGHLIGHT_SET';
export const SET_HIGHLIGHT_SET_TOAST_TEXT = 'SET_HIGHLIGHT_SET_TOAST_TEXT';
export const SET_HIGHLIGHT_TOAST_TEXT = 'SET_HIGHLIGHT_TOAST_TEXT';
export const SET_IS_NEW_ARCHIVED_CONTENT = 'SET_IS_NEW_ARCHIVED_CONTENT';
export const SET_ENTERPRISE_HIGHLIGHTED_CONTENTS = 'SET_ENTERPRISE_HIGHLIGHTED_CONTENTS';
export const UPDATE_DISMISSED_ARCHIVED_CONTENT = 'UPDATE_DISMISSED_ARCHIVED_CONTENT';
export const UPDATE_HIGHLIGHT_SET_CONTENT_ITEMS = 'UPDATE_HIGHLIGHT_SET_CONTENT_ITEMS';
export const UPDATE_HIGHLIGHT_SET_TITLE = 'UPDATE_HIGHLIGHT_SET_TITLE';

export const enterpriseCurationActions = {
  setIsLoading: (payload) => ({
    type: SET_IS_LOADING,
    payload,
  }),
  setEnterpriseCuration: (payload) => ({
    type: SET_ENTERPRISE_CURATION,
    payload,
  }),
  setFetchError: (payload) => ({
    type: SET_FETCH_ERROR,
    payload,
  }),
  setHighlightToast: (payload) => ({
    type: SET_HIGHLIGHT_TOAST_TEXT,
    payload,
  }),
  setHighlightSetToast: (payload) => ({
    type: SET_HIGHLIGHT_SET_TOAST_TEXT,
    payload,
  }),
  deleteHighlightSet: (payload) => ({
    type: DELETE_HIGHLIGHT_SET,
    payload,
  }),
  addHighlightSet: (payload) => ({
    type: ADD_HIGHLIGHT_SET,
    payload,
  }),
  setEnterpriseHighlightedSets: (payload) => ({
    type: SET_ENTERPRISE_HIGHLIGHTED_CONTENTS,
    payload,
  }),
  /**
   * @param {Array} highlightSets Highlight sets with their `highlightedContent`
   * @param {Object} dismissedContentKeys Map of highlight set uuid to the archived content keys
   *   already dismissed for it (see getDismissedArchivedContentKeysByHighlightSet)
   */
  setIsNewArchivedContent: (highlightSets, dismissedContentKeys = {}) => ({
    type: SET_IS_NEW_ARCHIVED_CONTENT,
    payload: { highlightSets, dismissedContentKeys },
  }),
  updateDismissedArchivedCourse: (payload) => ({
    type: UPDATE_DISMISSED_ARCHIVED_CONTENT,
    payload,
  }),
  updateHighlightSetContentItems: (payload) => ({
    type: UPDATE_HIGHLIGHT_SET_CONTENT_ITEMS,
    payload,
  }),
  updateHighlightSetTitle: (payload) => ({
    type: UPDATE_HIGHLIGHT_SET_TITLE,
    payload,
  }),
};

function getHighlightSetsFromState(state) {
  return state.enterpriseCuration?.highlightSets || [];
}

function enterpriseCurationReducer(state, action) {
  switch (action.type) {
    case SET_IS_LOADING:
      return { ...state, isLoading: action.payload };
    case SET_ENTERPRISE_CURATION:
      return { ...state, enterpriseCuration: action.payload };
    case SET_ENTERPRISE_HIGHLIGHTED_CONTENTS:
      return { ...state, enterpriseHighlightedSets: action.payload };
    case SET_FETCH_ERROR:
      return { ...state, fetchError: action.payload };
    case SET_HIGHLIGHT_TOAST_TEXT: {
      return {
        ...state,
        enterpriseCuration: {
          ...state.enterpriseCuration,
          toastText: action.payload,
        },
      };
    }
    case SET_HIGHLIGHT_SET_TOAST_TEXT: {
      const existingHighlightSets = getHighlightSetsFromState(state);
      const filteredHighlightSets = existingHighlightSets.find(
        highlightSet => highlightSet.uuid === action.payload,
      );
      return {
        ...state,
        enterpriseCuration: {
          ...state.enterpriseCuration,
          toastText: filteredHighlightSets?.title,
        },
      };
    }
    case DELETE_HIGHLIGHT_SET: {
      const existingHighlightSets = getHighlightSetsFromState(state);
      const filteredHighlightSets = existingHighlightSets.filter(
        highlightSet => highlightSet.uuid !== action.payload,
      );
      return {
        ...state,
        enterpriseCuration: {
          ...state.enterpriseCuration,
          highlightSets: filteredHighlightSets,
        },
      };
    }
    case ADD_HIGHLIGHT_SET: {
      const existingHighlightSets = getHighlightSetsFromState(state);
      return {
        ...state,
        enterpriseCuration: {
          ...state.enterpriseCuration,
          highlightSets: [action.payload, ...existingHighlightSets],
        },
      };
    }
    case SET_IS_NEW_ARCHIVED_CONTENT: {
      const { highlightSets, dismissedContentKeys } = action.payload;
      return {
        ...state,
        isNewArchivedContent: hasUndismissedArchivedContent(highlightSets, dismissedContentKeys),
      };
    }
    case UPDATE_DISMISSED_ARCHIVED_CONTENT: {
      return {
        ...state,
        isNewArchivedContent: action.payload,
      };
    }
    case UPDATE_HIGHLIGHT_SET_CONTENT_ITEMS: {
      const existingHighlightSets = getHighlightSetsFromState(state);
      const updatedHighlightSets = existingHighlightSets.map((highlightSet) => {
        if (highlightSet.uuid === action.payload.highlightSetUUID) {
          const updatedHighlightSet = {
            ...highlightSet,
            highlightedContentUuids: action.payload.activeContentUuids,
          };

          if (Object.prototype.hasOwnProperty.call(action.payload, 'cardImageUrl')) {
            updatedHighlightSet.cardImageUrl = action.payload.cardImageUrl;
          }

          return updatedHighlightSet;
        }
        return highlightSet;
      });
      return {
        ...state,
        enterpriseCuration: {
          ...state.enterpriseCuration,
          highlightSets: updatedHighlightSets,
        },
      };
    }
    case UPDATE_HIGHLIGHT_SET_TITLE: {
      const existingHighlightSets = getHighlightSetsFromState(state);
      const updatedHighlightSets = existingHighlightSets.map((highlightSet) => {
        if (highlightSet.uuid === action.payload.highlightSetUUID) {
          return { ...highlightSet, title: action.payload.title };
        }
        return highlightSet;
      });
      return {
        ...state,
        enterpriseCuration: {
          ...state.enterpriseCuration,
          highlightSets: updatedHighlightSets,
        },
      };
    }
    default: {
      const msg = `enterpriseCurationReducer received an unexpected action type: ${action.type}`;
      logError(msg);
      return state;
    }
  }
}

export default enterpriseCurationReducer;
