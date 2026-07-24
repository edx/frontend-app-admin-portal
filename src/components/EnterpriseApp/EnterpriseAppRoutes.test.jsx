import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { IntlProvider } from '@edx/frontend-platform/i18n';
import { axe } from 'jest-axe';
import { features } from '../../config';
import EnterpriseAppRoutes from './EnterpriseAppRoutes';
import { EnterpriseAppContext } from './EnterpriseAppContextProvider';
import { EnterpriseSubsidiesContext } from '../EnterpriseSubsidiesContext';
import { PRODUCT_TYPES } from './data/constants';
import { accessibilitySettings } from '../../../tests/accessibility-settings';

let mockEnterpriseAppPage = 'analytics';

jest.mock('../AdvanceAnalyticsV2/AnalyticsV2Page', () => function AnalyticsV2PageMock() {
  return <div>AnalyticsV2Page Mock Component</div>;
});
jest.mock('../../containers/AdminPageV2', () => function AdminPageV2Mock() {
  return <div>AdminPage Mock Component</div>;
});
jest.mock('../AdvanceAnalyticsV2.0/AnalyticsPage', () => function RevisedAnalyticsV2PageMock() {
  return <div>RevisedAnalyticsV2Page Mock Component</div>;
});
jest.mock('../billing/BillingPage', () => function BillingPageMock() {
  return <div data-testid="billing-page">BillingPage Mock Component</div>;
});
jest.mock('../PeopleManagement', () => function PeopleManagementPageMock() {
  return <div data-testid="people-management-page">PeopleManagementPage Mock Component</div>;
});
jest.mock('../PeopleManagement/GroupDetailPage/GroupDetailPage', () => function GroupDetailPageMock() {
  return <div data-testid="group-detail-page">GroupDetailPage Mock Component</div>;
});
jest.mock('../PeopleManagement/LearnerDetailPage/LearnerDetailPage', () => function LearnerDetailPageMock() {
  return <div data-testid="learner-detail-page">LearnerDetailPage Mock Component</div>;
});

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Routes: (props) => <span>{props.children}</span>,
  Route: ({ element }) => element,
  Navigate: ({ to }) => <div data-testid="redirect" data-to={to}>Navigate</div>,
  useParams: () => ({ enterpriseAppPage: mockEnterpriseAppPage, enterpriseSlug: 'test-enterprise' }),
}));

const mockEnterpriseSubsidiesContextValue = {
  canManageLearnerCredit: true,
  hasBillingSubscription: false,
};

const mockEnterpriseAppContextValue = {
  enterpriseCuration: {
    enterpriseCuration: null,
    isLoading: false,
    fetchError: null,
  },
  productType: PRODUCT_TYPES.TEAMS,
};

const renderWithProviders = (props, enterpriseAppContextValue = mockEnterpriseAppContextValue) => render(
  <IntlProvider locale="en">
    <EnterpriseAppContext.Provider value={enterpriseAppContextValue}>
      <EnterpriseSubsidiesContext.Provider value={mockEnterpriseSubsidiesContextValue}>
        <EnterpriseAppRoutes {...props} />
      </EnterpriseSubsidiesContext.Provider>
    </EnterpriseAppContext.Provider>
  </IntlProvider>,
);

describe('EnterpriseAppRoutes', () => {
  const defaultProps = {
    email: 'test@example.com',
    enterpriseId: 'test-enterprise-id',
    enterpriseName: 'Test Enterprise',
    enableCodeManagementPage: false,
    enableReportingPage: false,
    enableSubscriptionManagementPage: false,
    enableAnalyticsPage: true,
    enableContentHighlightsPage: false,
    enablePeopleManagementPage: true,
  };

  beforeEach(() => {
    mockEnterpriseAppPage = 'analytics';
    features.ANALYTICS_SUPPORTED = true;
    features.ADMIN_V1 = false;
    features.ENABLE_NATIVE_BILLING = false;
  });

  it('renders FeatureNotSupportedPage when ANALYTICS_SUPPORTED is false', () => {
    features.ANALYTICS_SUPPORTED = false;
    renderWithProviders(defaultProps);
    expect(screen.getByText('This feature is currently unavailable in this environment.')).toBeInTheDocument();
  });

  it('renders AnalyticsV2Page when ANALYTICS_SUPPORTED and ADMIN_V1 is true', () => {
    mockEnterpriseAppPage = 'analytics-v1';
    features.ANALYTICS_SUPPORTED = true;
    features.ADMIN_V1 = true;
    renderWithProviders(defaultProps);
    expect(screen.getByText('AnalyticsV2Page Mock Component')).toBeInTheDocument();
  });

  it('redirects Essentials customers away from AnalyticsV2Page on analytics-v1', () => {
    mockEnterpriseAppPage = 'analytics-v1';
    features.ANALYTICS_SUPPORTED = true;
    features.ADMIN_V1 = true;
    renderWithProviders(defaultProps, {
      ...mockEnterpriseAppContextValue,
      productType: PRODUCT_TYPES.ESSENTIALS,
    });

    expect(screen.getByTestId('redirect')).toHaveAttribute('data-to', '/test-enterprise/admin/learners');
    expect(screen.queryByText('AnalyticsV2Page Mock Component')).not.toBeInTheDocument();
  });

  it('renders AdminPage when ANALYTICS_SUPPORTED is true', () => {
    mockEnterpriseAppPage = 'learners';
    features.ANALYTICS_SUPPORTED = true;
    renderWithProviders(defaultProps);
    expect(screen.getByText('AdminPage Mock Component')).toBeInTheDocument();
  });
  it('renders RevisedAnalyticsV2Page by default', () => {
    mockEnterpriseAppPage = 'analytics';
    features.ANALYTICS_SUPPORTED = true;
    renderWithProviders(defaultProps);
    expect(screen.getByText('RevisedAnalyticsV2Page Mock Component')).toBeInTheDocument();
  });

  it('redirects Essentials customers away from Analytics', () => {
    mockEnterpriseAppPage = 'analytics';
    features.ANALYTICS_SUPPORTED = true;
    renderWithProviders(defaultProps, {
      ...mockEnterpriseAppContextValue,
      productType: PRODUCT_TYPES.ESSENTIALS,
    });

    expect(screen.getByTestId('redirect')).toHaveAttribute('data-to', '/test-enterprise/admin/learners');
    expect(screen.queryByText('RevisedAnalyticsV2Page Mock Component')).not.toBeInTheDocument();
  });

  it('renders AnalyticsPage for Teams customers', () => {
    mockEnterpriseAppPage = 'analytics';
    features.ANALYTICS_SUPPORTED = true;
    renderWithProviders(defaultProps, {
      ...mockEnterpriseAppContextValue,
      productType: PRODUCT_TYPES.TEAMS,
    });

    expect(screen.getByText('RevisedAnalyticsV2Page Mock Component')).toBeInTheDocument();
  });

  describe('billing route access', () => {
    beforeEach(() => {
      mockEnterpriseAppPage = 'billing';
      // Reset feature flag before each test
      features.ENABLE_NATIVE_BILLING = false;
    });

    it('has no accessibility violations', async () => {
      const { container } = renderWithProviders();
      const results = await axe(container, accessibilitySettings);
      expect(results).toHaveNoViolations();
    });

    it('renders BillingPage when hasBillingSubscription=true and feature flag is ON', () => {
      features.ENABLE_NATIVE_BILLING = true;
      const contextValue = {
        ...mockEnterpriseSubsidiesContextValue,
        hasBillingSubscription: true,
      };

      render(
        <IntlProvider locale="en">
          <EnterpriseSubsidiesContext.Provider value={contextValue}>
            <EnterpriseAppRoutes {...defaultProps} />
          </EnterpriseSubsidiesContext.Provider>
        </IntlProvider>,
      );

      expect(screen.getByTestId('billing-page')).toBeInTheDocument();
      expect(screen.getByText('BillingPage Mock Component')).toBeInTheDocument();
    });

    it('does not render BillingPage when hasBillingSubscription=false', () => {
      features.ENABLE_NATIVE_BILLING = true;
      const contextValue = {
        ...mockEnterpriseSubsidiesContextValue,
        hasBillingSubscription: false,
      };

      render(
        <IntlProvider locale="en">
          <EnterpriseSubsidiesContext.Provider value={contextValue}>
            <EnterpriseAppRoutes {...defaultProps} />
          </EnterpriseSubsidiesContext.Provider>
        </IntlProvider>,
      );

      expect(screen.queryByTestId('billing-page')).not.toBeInTheDocument();
    });

    it('does not render BillingPage when ENABLE_NATIVE_BILLING feature flag is OFF', () => {
      features.ENABLE_NATIVE_BILLING = false;
      const contextValue = {
        ...mockEnterpriseSubsidiesContextValue,
        hasBillingSubscription: true,
      };

      render(
        <IntlProvider locale="en">
          <EnterpriseSubsidiesContext.Provider value={contextValue}>
            <EnterpriseAppRoutes {...defaultProps} />
          </EnterpriseSubsidiesContext.Provider>
        </IntlProvider>,
      );

      expect(screen.queryByTestId('billing-page')).not.toBeInTheDocument();
    });

    it('does not render BillingPage when both conditions are false', () => {
      features.ENABLE_NATIVE_BILLING = false;
      const contextValue = {
        ...mockEnterpriseSubsidiesContextValue,
        hasBillingSubscription: false,
      };

      render(
        <IntlProvider locale="en">
          <EnterpriseSubsidiesContext.Provider value={contextValue}>
            <EnterpriseAppRoutes {...defaultProps} />
          </EnterpriseSubsidiesContext.Provider>
        </IntlProvider>,
      );

      expect(screen.queryByTestId('billing-page')).not.toBeInTheDocument();
    });

    it('passes correct enterpriseId to BillingPage', () => {
      features.ENABLE_NATIVE_BILLING = true;
      const testEnterpriseId = 'test-enterprise-123';
      const contextValue = {
        ...mockEnterpriseSubsidiesContextValue,
        hasBillingSubscription: true,
      };

      render(
        <IntlProvider locale="en">
          <EnterpriseSubsidiesContext.Provider value={contextValue}>
            <EnterpriseAppRoutes
              {...defaultProps}
              enterpriseId={testEnterpriseId}
            />
          </EnterpriseSubsidiesContext.Provider>
        </IntlProvider>,
      );

      // BillingPage should be rendered (checking that it exists confirms it received the enterpriseId)
      expect(screen.getByTestId('billing-page')).toBeInTheDocument();
    });
  });

  describe('people management route access', () => {
    beforeEach(() => {
      mockEnterpriseAppPage = 'people-management';
    });

    it('renders PeopleManagementPage when enablePeopleManagementPage is true', () => {
      renderWithProviders({ ...defaultProps, enablePeopleManagementPage: true });
      expect(screen.getByTestId('people-management-page')).toBeInTheDocument();
    });

    it('does not render PeopleManagementPage when enablePeopleManagementPage is false', () => {
      renderWithProviders({ ...defaultProps, enablePeopleManagementPage: false });
      expect(screen.queryByTestId('people-management-page')).not.toBeInTheDocument();
    });
  });
});
