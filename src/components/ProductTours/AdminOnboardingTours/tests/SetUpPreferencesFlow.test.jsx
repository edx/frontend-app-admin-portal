import React from 'react';
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { IntlProvider } from '@edx/frontend-platform/i18n';
import messages from '../messages';
import SetUpPreferencesFlow from '../flows/SetUpPreferencesFlow';
import { TOUR_TARGETS } from '../../constants';
import { ADMIN_TOUR_EVENT_NAMES } from '../constants';
import { SubsidyRequestsContext } from '../../../subsidy-requests';

const mockFormatMessage = jest.fn((message) => message.defaultMessage || message.id || 'Mocked message');

jest.mock('@edx/frontend-platform/i18n', () => ({
  ...jest.requireActual('@edx/frontend-platform/i18n'),
  useIntl: () => ({
    formatMessage: mockFormatMessage,
  }),
}));

const mockStore = configureMockStore();

const mockHandleEndTour = jest.fn();

const renderWithMock = ({
  isMultiPlanFundingEnabled = false,
  isCustomerSwitchOn = false,
  props = { handleEndTour: mockHandleEndTour },
} = {}) => {
  const store = mockStore({
    portalConfiguration: {
      enterpriseFeatures: { enterpriseMultiPlanFundingEnabled: isMultiPlanFundingEnabled },
    },
  });
  const wrapper = ({ children }) => (
    <IntlProvider locale="en" messages={{}}>
      <Provider store={store}>
        <SubsidyRequestsContext.Provider
          value={{ subsidyRequestConfiguration: { enableMultiPlanFunding: isCustomerSwitchOn } }}
        >
          {children}
        </SubsidyRequestsContext.Provider>
      </Provider>
    </IntlProvider>
  );
  return renderHook(() => SetUpPreferencesFlow(props), { wrapper });
};

const renderMultiPlanFundingTab = () => {
  const tab = document.createElement('span');
  tab.id = 'multi-plan-funding-settings-tab';
  document.body.appendChild(tab);
};

describe('useSetUpPreferencesFlow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('creates set up preferences flow with correct structure', () => {
    const { result } = renderWithMock();
    const flow = result.current;

    expect(flow).toHaveLength(1);
    expect(flow[0]).toMatchObject({
      target: `#${TOUR_TARGETS.SETTINGS_SIDEBAR}`,
      placement: 'right',
      body: messages.viewSetUpPreferences.defaultMessage,
    });
  });

  it('uses correct target selectors for set up preferences flow', () => {
    const { result } = renderWithMock();
    const flow = result.current;

    expect(flow[0].target).toBe(`#${TOUR_TARGETS.SETTINGS_SIDEBAR}`);
  });

  describe('multi-plan funding copy', () => {
    it('mentions Multi-plan funding in the existing step when the flag and customer switch are on and the tab is rendered', () => {
      renderMultiPlanFundingTab();
      const { result } = renderWithMock({ isMultiPlanFundingEnabled: true, isCustomerSwitchOn: true });
      const flow = result.current;

      expect(flow).toHaveLength(1);
      expect(flow[0].body).toBe(messages.viewSetUpPreferencesWithMultiPlanFunding.defaultMessage);
      expect(flow[0].body).toContain('Multi-plan funding');

      flow[0].onEnd();
      expect(mockHandleEndTour).toHaveBeenCalledTimes(1);
      expect(mockHandleEndTour.mock.calls[0][0]).toBe(ADMIN_TOUR_EVENT_NAMES.SET_UP_PREFERENCES_COMPLETED_EVENT_NAME);
    });

    it.each([
      { isMultiPlanFundingEnabled: false, isCustomerSwitchOn: true, tabRendered: true },
      { isMultiPlanFundingEnabled: true, isCustomerSwitchOn: false, tabRendered: true },
      { isMultiPlanFundingEnabled: true, isCustomerSwitchOn: true, tabRendered: false },
    ])('keeps the original copy otherwise (%p)', ({ isMultiPlanFundingEnabled, isCustomerSwitchOn, tabRendered }) => {
      if (tabRendered) {
        renderMultiPlanFundingTab();
      }
      const { result } = renderWithMock({ isMultiPlanFundingEnabled, isCustomerSwitchOn });
      const flow = result.current;

      expect(flow).toHaveLength(1);
      expect(flow[0].body).toBe(messages.viewSetUpPreferences.defaultMessage);
    });
  });
});
