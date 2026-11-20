import React from 'react';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import { IntlProvider } from '@edx/frontend-platform/i18n';
import {
  screen,
  render,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import configureMockStore from 'redux-mock-store';

import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { axe } from 'jest-axe';
import SettingsTabs from '../SettingsTabs';
import { SCHOLAR_THEME } from '../data/constants';

import { features } from '../../../config';
import { SubsidyRequestsContext } from '../../subsidy-requests';
import '@testing-library/jest-dom/extend-expect';
import { accessibilitySettings } from '../../../../tests/accessibility-settings';

const ACCESS_MOCK_CONTENT = 'access';
const LMS_MOCK_CONTENT = 'lms';
const SSO_MOCK_CONTENT = 'sso';
const API_CREDENTIALS_CONTENT = 'credentials';

jest.mock('../../../data/services/LmsApiService', () => ({
  updateEnterpriseCustomerBranding: jest.fn(),
}));

jest.mock(
  '../SettingsAccessTab/',
  () => function SettingsAccessTab() {
    return <div>{ACCESS_MOCK_CONTENT}</div>;
  },
);

jest.mock(
  '../SettingsLMSTab/',
  () => function SettingsLMSTab() {
    return <div>{LMS_MOCK_CONTENT}</div>;
  },
);

jest.mock(
  '../SettingsSSOTab/',
  () => function SettingsSSOTab() {
    return <div>{SSO_MOCK_CONTENT}</div>;
  },
);

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));
jest.mock(
  '../SettingsApiCredentialsTab/',
  () => function SettingsAccessTab() {
    return <div>{API_CREDENTIALS_CONTENT}</div>;
  },
);

const MULTI_PLAN_FUNDING_CONTENT = 'multi-plan funding plans';
jest.mock(
  '../SettingsMultiPlanFundingTab/',
  () => function SettingsMultiPlanFundingTab() {
    return <div>{MULTI_PLAN_FUNDING_CONTENT}</div>;
  },
);

const enterpriseId = 'test-enterprise';
const initialStore = {
  portalConfiguration: {
    enterpriseId,
    enterpriseSlug: 'sluggy',
    enableLearnerPortal: true,
    enableLmsConfigurationsScreen: true,
    enableIntegratedCustomerLearnerPortalSearch: true,
    enableSamlConfigurationScreen: false,
    enableUniversalLink: false,
    enterpriseBranding: {
      primary_color: SCHOLAR_THEME.button,
      secondary_color: SCHOLAR_THEME.banner,
      tertiary_color: SCHOLAR_THEME.accent,
    },
  },
};

const mockStore = configureMockStore([thunk]);
const getMockStore = store => mockStore(store);
const defaultStore = getMockStore({ ...initialStore });

const SettingsTabsWithRouter = ({ store = defaultStore, subsidyRequestConfiguration = null }) => (
  <IntlProvider locale="en">
    <MemoryRouter initialEntries={['/settings']}>
      <Provider store={store}>
        <SubsidyRequestsContext.Provider value={{ subsidyRequestConfiguration }}>
          <Routes>
            <Route path="/settings" element={<SettingsTabs />} />
            {/* Selecting a tab navigates to the enterprise settings URL, so match it too (as SettingsPage does). */}
            <Route path="/:enterpriseSlug/admin/settings/*" element={<SettingsTabs />} />
          </Routes>
        </SubsidyRequestsContext.Provider>
      </Provider>
    </MemoryRouter>
  </IntlProvider>
);

describe('<SettingsTabs />', () => {
  beforeEach(() => {
    features.EXTERNAL_LMS_CONFIGURATION = true;
    features.FEATURE_SSO_SETTINGS_TAB = true;
    features.SETTINGS_PAGE_LMS_TAB = true;
    features.SETTINGS_PAGE_APPEARANCE_TAB = true;

    jest.clearAllMocks();
  });

  // Skipped because this test fails a11y checks; to be addressed in ENT-11719
  it.skip('has no accessibility violations', async () => {
    const { container } = render(<SettingsTabsWithRouter />);
    const results = await axe(container, accessibilitySettings);
    expect(results).toHaveNoViolations();
  });

  test('SSO tab is not rendered if FEATURE_SSO_SETTINGS_TAB = false', () => {
    features.FEATURE_SSO_SETTINGS_TAB = false;
    render(<SettingsTabsWithRouter />);
    expect(screen.queryByText('Single Sign On (SSO)')).not.toBeInTheDocument();
  });

  test('Appearance tab is not rendered if FEATURE_SETTING_PAGE_APPEARANCE_TAB = false', () => {
    features.SETTINGS_PAGE_APPEARANCE_TAB = false;
    render(<SettingsTabsWithRouter />);
    expect(screen.queryByText('Portal Appearance')).not.toBeInTheDocument();
  });

  test('Clicking on a tab changes content via router', async () => {
    const user = userEvent.setup();
    render(<SettingsTabsWithRouter />);
    const lmsTab = screen.getByText('Learning Platform');
    await user.click(lmsTab);
    expect(screen.queryByText(LMS_MOCK_CONTENT)).toBeTruthy();
  });

  test('Clicking on default tab does not change content', async () => {
    const user = userEvent.setup();
    render(<SettingsTabsWithRouter />);
    const accessTab = screen.getByText('Configure Access');
    await user.click(accessTab);
    expect(screen.queryByText(ACCESS_MOCK_CONTENT)).toBeTruthy();
  });

  test('Api credentials tab is not rendered if FEATURE_API_CREDENTIALS_TAB = false', () => {
    features.FEATURE_API_CREDENTIALS_TAB = false;
    render(<SettingsTabsWithRouter />);
    expect(screen.queryByText(API_CREDENTIALS_CONTENT)).not.toBeInTheDocument();
  });
});

describe('<SettingsTabs /> multi-plan funding tab', () => {
  const storeWithFlag = (isMultiPlanFundingEnabled) => getMockStore({
    portalConfiguration: {
      ...initialStore.portalConfiguration,
      enterpriseFeatures: { enterpriseMultiPlanFundingEnabled: isMultiPlanFundingEnabled },
    },
  });

  it.each([
    { isMultiPlanFundingEnabled: false, enableMultiPlanFunding: true },
    { isMultiPlanFundingEnabled: true, enableMultiPlanFunding: false },
    { isMultiPlanFundingEnabled: true, enableMultiPlanFunding: undefined },
  ])('is hidden unless the flag and the customer switch are both on (%p)', ({
    isMultiPlanFundingEnabled, enableMultiPlanFunding,
  }) => {
    render(
      <SettingsTabsWithRouter
        store={storeWithFlag(isMultiPlanFundingEnabled)}
        subsidyRequestConfiguration={{ enableMultiPlanFunding }}
      />,
    );
    expect(screen.queryByText('Multi-plan funding')).not.toBeInTheDocument();
  });

  it('is shown with a tour target when the flag and the customer switch are on', async () => {
    const user = userEvent.setup();
    render(
      <SettingsTabsWithRouter
        store={storeWithFlag(true)}
        subsidyRequestConfiguration={{ enableMultiPlanFunding: true }}
      />,
    );
    const tabLabel = screen.getByText('Multi-plan funding');
    expect(tabLabel).toHaveAttribute('id', 'multi-plan-funding-settings-tab');
    const tab = screen.getByRole('tab', { name: 'Multi-plan funding' });
    expect(tab).toHaveAttribute('aria-selected', 'false');

    await user.click(tabLabel);

    // The click navigates to /sluggy/admin/settings/multi_plan_funding, which selects the tab.
    expect(screen.getByRole('tab', { name: 'Multi-plan funding' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText(MULTI_PLAN_FUNDING_CONTENT)).toBeVisible();
  });
});
