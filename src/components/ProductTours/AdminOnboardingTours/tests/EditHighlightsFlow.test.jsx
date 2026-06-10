import { render, renderHook } from '@testing-library/react';
import { IntlProvider } from '@edx/frontend-platform/i18n';

import EditHighlightsFlow from '../flows/EditHighlightsFlow';
import {
  ADMIN_TOUR_EVENT_NAMES,
  EDIT_HIGHLIGHTS_LEARN_MORE_URL,
  EDIT_HIGHLIGHTS_TARGETS,
} from '../constants';
import messages from '../messages';
import { EnterpriseAppContext } from '../../../EnterpriseApp/EnterpriseAppContextProvider';

const mockFormatMessage = jest.fn((message) => message.defaultMessage || message.id || 'Mocked message');

jest.mock('@edx/frontend-platform/i18n', () => ({
  ...jest.requireActual('@edx/frontend-platform/i18n'),
  useIntl: () => ({
    formatMessage: mockFormatMessage,
  }),
}));

const buildContext = (highlightSets) => ({
  enterpriseCuration: {
    enterpriseCuration: { highlightSets },
    isLoading: false,
    fetchError: null,
  },
});

// Admins who already have highlight sets get the full 5-step flow.
const withHighlightsWrapper = ({ children }) => (
  <IntlProvider locale="en" messages={{}}>
    <EnterpriseAppContext.Provider value={buildContext([{ uuid: 'set-1', title: 'Set 1' }])}>
      {children}
    </EnterpriseAppContext.Provider>
  </IntlProvider>
);

// Admins with no highlight sets (whether new or existing) get the 3-step flow.
const withoutHighlightsWrapper = ({ children }) => (
  <IntlProvider locale="en" messages={{}}>
    <EnterpriseAppContext.Provider value={buildContext([])}>
      {children}
    </EnterpriseAppContext.Provider>
  </IntlProvider>
);

const mockHandleAdvanceTour = jest.fn();
const mockHandleEndTour = jest.fn();
const mockHandleBackTour = jest.fn();
const mockHandleDismissTour = jest.fn();

describe('EditHighlightsFlow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderFlow = (wrapper) => renderHook(
    () => EditHighlightsFlow({
      handleAdvanceTour: mockHandleAdvanceTour,
      handleBackTour: mockHandleBackTour,
      handleEndTour: mockHandleEndTour,
      handleDismissTour: mockHandleDismissTour,
    }),
    { wrapper },
  );

  describe('when the admin has highlight sets (existing 5-step flow)', () => {
    it('returns a 5-step flow with the expected targets and copy', () => {
      const { result } = renderFlow(withHighlightsWrapper);
      const flow = result.current;

      expect(flow).toHaveLength(5);

      expect(flow[0]).toMatchObject({
        target: `#${EDIT_HIGHLIGHTS_TARGETS.HIGHLIGHTS_SIDEBAR}`,
        placement: 'right',
        title: messages.editHighlightsPopupOneTitle.defaultMessage,
      });
      // Step one body is a node containing the copy and a custom Dismiss button
      expect(flow[0].body).toBeTruthy();
      expect(flow[1]).toMatchObject({
        target: `#${EDIT_HIGHLIGHTS_TARGETS.HIGHLIGHTS_TAB}`,
        overlayTarget: `#${EDIT_HIGHLIGHTS_TARGETS.HIGHLIGHTS_SECTION}`,
        placement: 'top-start',
        body: messages.editHighlightsStepTwoBody.defaultMessage,
      });
      expect(flow[2]).toMatchObject({
        target: `#${EDIT_HIGHLIGHTS_TARGETS.HIGHLIGHTS_NEW_BUTTON}`,
        placement: 'left',
      });
      // Step three body is a FormattedMessage with a "Learn more" hyperlink
      expect(flow[2].body.props).toMatchObject(messages.editHighlightsStepThreeBody);
      expect(flow[3]).toMatchObject({
        target: `#${EDIT_HIGHLIGHTS_TARGETS.HIGHLIGHTS_CATALOG_VISIBILITY_TAB}`,
        placement: 'top-start',
        body: messages.editHighlightsStepFourBody.defaultMessage,
      });
      expect(flow[4]).toMatchObject({
        target: `#${EDIT_HIGHLIGHTS_TARGETS.HIGHLIGHT_SET_CARD}`,
        overlayTarget: `#${EDIT_HIGHLIGHTS_TARGETS.HIGHLIGHTS_SECTION}`,
        overlayWidthRatio: 0.6,
        placement: 'right',
        body: messages.editHighlightsStepFiveBody.defaultMessage,
      });
    });

    it('fires the advance tracking event on step one advance', () => {
      const { result } = renderFlow(withHighlightsWrapper);
      result.current[0].onAdvance();
      expect(mockHandleAdvanceTour).toHaveBeenCalledWith(
        ADMIN_TOUR_EVENT_NAMES.EDIT_HIGHLIGHTS_ADVANCE_EVENT_NAME,
      );
    });

    it('fires advance and back events on middle steps', () => {
      const { result } = renderFlow(withHighlightsWrapper);
      result.current[1].onAdvance();
      result.current[1].onBack();
      result.current[2].onAdvance();
      result.current[3].onBack();
      expect(mockHandleAdvanceTour).toHaveBeenCalledTimes(2);
      expect(mockHandleAdvanceTour).toHaveBeenCalledWith(
        ADMIN_TOUR_EVENT_NAMES.EDIT_HIGHLIGHTS_ADVANCE_EVENT_NAME,
      );
      expect(mockHandleBackTour).toHaveBeenCalledTimes(2);
      expect(mockHandleBackTour).toHaveBeenCalledWith(
        ADMIN_TOUR_EVENT_NAMES.EDIT_HIGHLIGHTS_BACK_EVENT_NAME,
      );
    });

    it('fires the completed event on the final step end', () => {
      const { result } = renderFlow(withHighlightsWrapper);
      result.current[4].onEnd();
      expect(mockHandleEndTour).toHaveBeenCalledWith(
        ADMIN_TOUR_EVENT_NAMES.EDIT_HIGHLIGHTS_COMPLETED_EVENT_NAME,
        undefined,
      );
    });

    it('fires the back event on the final step back', () => {
      const { result } = renderFlow(withHighlightsWrapper);
      result.current[4].onBack();
      expect(mockHandleBackTour).toHaveBeenCalledWith(
        ADMIN_TOUR_EVENT_NAMES.EDIT_HIGHLIGHTS_BACK_EVENT_NAME,
      );
    });

    it('does not define onBack on the first step or onAdvance on the last step', () => {
      const { result } = renderFlow(withHighlightsWrapper);
      expect(result.current[0].onBack).toBeUndefined();
      expect(result.current[4].onAdvance).toBeUndefined();
    });
  });

  describe('when the admin has no highlight sets (3-step flow)', () => {
    it('returns a 3-step flow that omits the published-tab and card steps', () => {
      const { result } = renderFlow(withoutHighlightsWrapper);
      const flow = result.current;

      expect(flow).toHaveLength(3);
      expect(flow.map((step) => step.target)).toEqual([
        `#${EDIT_HIGHLIGHTS_TARGETS.HIGHLIGHTS_SIDEBAR}`,
        `.${EDIT_HIGHLIGHTS_TARGETS.HIGHLIGHTS_ZERO_STATE_FOOTER}`,
        `#${EDIT_HIGHLIGHTS_TARGETS.HIGHLIGHTS_CATALOG_VISIBILITY_TAB}`,
      ]);
    });

    it('makes the catalog visibility step terminal (onEnd, no onAdvance) and the first step have no Back', () => {
      const { result } = renderFlow(withoutHighlightsWrapper);
      const flow = result.current;
      expect(flow[0].onBack).toBeUndefined();
      expect(flow[2].onAdvance).toBeUndefined();
      expect(flow[2].onEnd).toBeDefined();
    });

    it('fires the completed event when the 3-step flow ends', () => {
      const { result } = renderFlow(withoutHighlightsWrapper);
      result.current[2].onEnd();
      expect(mockHandleEndTour).toHaveBeenCalledWith(
        ADMIN_TOUR_EVENT_NAMES.EDIT_HIGHLIGHTS_COMPLETED_EVENT_NAME,
        undefined,
      );
    });
  });

  it('renders a "Learn more" link on the new-highlight step pointing at the knowledge base article', () => {
    const { result } = renderFlow(withHighlightsWrapper);
    const { getByText } = render(result.current[2].body, { wrapper: withHighlightsWrapper });
    const link = getByText('Learn more').closest('a');
    expect(link.getAttribute('href')).toBe(EDIT_HIGHLIGHTS_LEARN_MORE_URL);
    expect(link.getAttribute('target')).toBe('_blank');
  });

  it('renders a Dismiss button on step one that fires the dismiss event', () => {
    const { result } = renderFlow(withHighlightsWrapper);
    const { getByText } = render(result.current[0].body, { wrapper: withHighlightsWrapper });
    getByText(messages.editHighlightsDismissButton.defaultMessage).click();
    expect(mockHandleDismissTour).toHaveBeenCalledWith(
      ADMIN_TOUR_EVENT_NAMES.EDIT_HIGHLIGHTS_DISMISS_EVENT_NAME,
    );
  });
});
