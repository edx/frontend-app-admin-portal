import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import configureMockStore from 'redux-mock-store';
import dayjs from 'dayjs';
import {
  screen,
  render,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/extend-expect';

import { IntlProvider } from '@edx/frontend-platform/i18n';
import { QueryClientProvider } from '@tanstack/react-query';
import { axe } from 'jest-axe';
import { features } from '../../../config';
import BudgetCard from '../BudgetCard';
import { formatPrice, useSubsidySummaryAnalyticsApi, useBudgetRedemptions } from '../data';
import { BUDGET_STATUSES, BUDGET_TYPES } from '../../EnterpriseApp/data/constants';
import { EnterpriseSubsidiesContext } from '../../EnterpriseSubsidiesContext';
import { queryClient } from '../../test/testUtils';
import { accessibilitySettings } from '../../../../tests/accessibility-settings';
import EnterpriseAccessApiService from '../../../data/services/EnterpriseAccessApiService';

jest.mock('../../EnterpriseSubsidiesContext/data/hooks', () => ({
  ...jest.requireActual('../../EnterpriseSubsidiesContext/data/hooks'),
  useEnterpriseBudgets: jest.fn().mockReturnValue({
    isFetchingBudgets: false,
  }),
}));
jest.mock('../../../data/services/EnterpriseAccessApiService', () => ({
  getTopUpEligibility: jest.fn(),
}));
jest.mock('../data', () => ({
  ...jest.requireActual('../data'),
  useSubsidySummaryAnalyticsApi: jest.fn(),
  useBudgetRedemptions: jest.fn(),
}));
useSubsidySummaryAnalyticsApi.mockReturnValue({
  isLoading: false,
  offerSummary: null,
});
useBudgetRedemptions.mockReturnValue({
  isLoading: false,
  offerRedemptions: {
    itemCount: 0,
    pageCount: 0,
    results: [],
  },
  fetchBudgetRedemptions: jest.fn(),
});

const mockStore = configureMockStore([thunk]);
const getMockStore = store => mockStore(store);
const enterpriseSlug = 'test-enterprise';
const enterpriseUUID = '1234';
const initialStore = {
  portalConfiguration: {
    enterpriseId: enterpriseUUID,
    enterpriseSlug,
    enablePortalLearnerCreditManagementScreen: true,
  },
};
const store = getMockStore({ ...initialStore });

const mockEnterpriseOfferId = 123;
const mockBudgetUuid = 'test-budget-uuid';

const mockBudgetDisplayName = 'Test Enterprise Budget Display Name';

const defaultEnterpriseSubsidiesContextValue = {
  isFetchingBudgets: false,
};
const BudgetCardWrapper = ({
  enterpriseSubsidiesContextValue = defaultEnterpriseSubsidiesContextValue,
  ...rest
}) => (
  <QueryClientProvider client={queryClient()}>
    <MemoryRouter initialEntries={['/test-enterprise/admin/learner-credit']}>
      <Provider store={store}>
        <IntlProvider locale="en">
          <EnterpriseSubsidiesContext.Provider value={enterpriseSubsidiesContextValue}>
            <BudgetCard {...rest} />
          </EnterpriseSubsidiesContext.Provider>
        </IntlProvider>
      </Provider>
    </MemoryRouter>
  </QueryClientProvider>
);

describe('<BudgetCard />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    features.TOP_UP_LEARNER_CREDIT = false;
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <BudgetCardWrapper
        original={{
          id: mockEnterpriseOfferId,
          name: mockBudgetDisplayName,
          start: '3022-01-01',
          end: '3023-01-01',
          source: BUDGET_TYPES.ecommerce,
          aggregates: { total: 5000, spent: 200, available: 4800 },
        }}
      />,
    );
    const results = await axe(container, accessibilitySettings);
    expect(results).toHaveNoViolations();
  });

  it('displays correctly for a scheduled Enterprise Offers (ecommerce)', () => {
    const mockBudgetAggregates = {
      total: 5000,
      spent: 200,
      available: 4800,
    };
    const mockBudget = {
      id: mockEnterpriseOfferId,
      name: mockBudgetDisplayName,
      start: '3022-01-01',
      end: '3023-01-01',
      source: BUDGET_TYPES.ecommerce,
      aggregates: mockBudgetAggregates,
    };

    useSubsidySummaryAnalyticsApi.mockReturnValue({
      isLoading: false,
      subsidySummary: {
        totalFunds: mockBudgetAggregates.total,
        redeemedFunds: mockBudgetAggregates.spent,
        remainingFunds: mockBudgetAggregates.available,
        percentUtilized: mockBudgetAggregates.spent / mockBudgetAggregates.total,
        offerType: 'Site',
        offerId: mockEnterpriseOfferId,
        budgetsSummary: [],
      },
    });

    render(<BudgetCardWrapper
      original={mockBudget}
    />);

    expect(screen.getByText(mockBudgetDisplayName)).toBeInTheDocument();
    expect(screen.queryByText('Executive Education')).not.toBeInTheDocument();
    const formattedString = `Starts ${dayjs(mockBudget.start).format('MMMM D, YYYY')}`;
    const elementsWithTestId = screen.getAllByTestId('budget-date');
    const firstElementWithTestId = elementsWithTestId[0];
    expect(firstElementWithTestId).toHaveTextContent(formattedString);
  });

  it('displays correctly for a scheduled Subsidy (enterprise-subsidy)', () => {
    const mockBudgetAggregates = {
      total: 5000,
      spent: 200,
      available: 4800,
    };
    const mockBudget = {
      id: mockEnterpriseOfferId,
      name: mockBudgetDisplayName,
      start: '3022-01-01',
      end: '4023-01-01',
      source: BUDGET_TYPES.subsidy,
      aggregates: mockBudgetAggregates,
    };
    useSubsidySummaryAnalyticsApi.mockReturnValue({
      isLoading: false,
      subsidySummary: {
        totalFunds: mockBudgetAggregates.total,
        redeemedFunds: mockBudgetAggregates.spent,
        remainingFunds: mockBudgetAggregates.available,
        percentUtilized: mockBudgetAggregates.spent / mockBudgetAggregates.total,
        offerType: 'Site',
        offerId: mockEnterpriseOfferId,
        budgetsSummary: [
          {
            id: 'test-subsidy-uuid',
            start: '3022-01-01',
            end: '4023-01-01',
            remainingFunds: mockBudgetAggregates.available,
            redeemedFunds: mockBudgetAggregates.spent,
            enterpriseSlug,
            subsidyAccessPolicyDisplayName: mockBudgetDisplayName,
            subsidyAccessPolicyUuid: mockBudgetUuid,
          },
        ],
      },
    });

    render(<BudgetCardWrapper
      original={mockBudget}
    />);

    expect(screen.getByText(mockBudgetDisplayName)).toBeInTheDocument();
    expect(screen.queryByText('Executive Education')).not.toBeInTheDocument();
    const formattedString = `Starts ${dayjs(mockBudget.start).format('MMMM D, YYYY')}`;
    const elementsWithTestId = screen.getAllByTestId('budget-date');
    const firstElementWithTestId = elementsWithTestId[0];
    expect(firstElementWithTestId).toHaveTextContent(formattedString);
  });

  it.each([
    { isAssignableBudget: false },
    { isAssignableBudget: true },
  ])('displays correctly for a scheduled Policy (enterprise-access) (%s)', ({ isAssignableBudget }) => {
    const mockBudgetAggregates = {
      total: 5000,
      spent: 200,
      pending: 100,
      available: isAssignableBudget ? 4700 : 4800,
    };
    const mockBudget = {
      id: mockBudgetUuid,
      name: mockBudgetDisplayName,
      start: '3022-01-01',
      end: '4023-01-01',
      source: BUDGET_TYPES.policy,
      aggregates: {
        available: mockBudgetAggregates.available,
        pending: isAssignableBudget ? mockBudgetAggregates.pending : undefined,
        spent: mockBudgetAggregates.spent,
      },
      isAssignable: isAssignableBudget,
      enterpriseSlug,
      enterpriseUUID,
    };
    useSubsidySummaryAnalyticsApi.mockReturnValue({
      isLoading: false,
      subsidySummary: undefined,
    });

    render(<BudgetCardWrapper
      original={mockBudget}
    />);

    expect(screen.getByText(mockBudgetDisplayName)).toBeInTheDocument();
    expect(screen.queryByText('Executive Education')).not.toBeInTheDocument();
    const formattedString = `Starts ${dayjs(mockBudget.start).format('MMMM D, YYYY')}`;
    const elementsWithTestId = screen.getAllByTestId('budget-date');
    const firstElementWithTestId = elementsWithTestId[0];
    expect(firstElementWithTestId).toHaveTextContent(formattedString);
  });

  it('displays correctly for an expired Enterprise Offers (ecommerce)', () => {
    const mockBudgetAggregates = {
      total: 5000,
      spent: 200,
      available: 4800,
    };
    const mockBudget = {
      id: mockEnterpriseOfferId,
      name: mockBudgetDisplayName,
      start: '2022-01-01',
      end: '2023-01-01',
      source: BUDGET_TYPES.ecommerce,
      aggregates: mockBudgetAggregates,
      enterpriseSlug,
      enterpriseUUID,
    };
    useSubsidySummaryAnalyticsApi.mockReturnValue({
      isLoading: false,
      subsidySummary: {
        totalFunds: mockBudgetAggregates.total,
        redeemedFunds: mockBudgetAggregates.spent,
        remainingFunds: mockBudgetAggregates.available,
        percentUtilized: mockBudgetAggregates.spent / mockBudgetAggregates.total,
        offerType: 'Site',
        offerId: mockEnterpriseOfferId,
        budgetsSummary: [],
      },
    });

    render(<BudgetCardWrapper
      original={mockBudget}
    />);

    expect(screen.getByText(mockBudgetDisplayName)).toBeInTheDocument();
    expect(screen.queryByText('Executive Education')).not.toBeInTheDocument();
    const formattedString = `Expired ${dayjs(mockBudget.end).format('MMMM D, YYYY')}`;
    const elementsWithTestId = screen.getAllByTestId('budget-date');
    const firstElementWithTestId = elementsWithTestId[0];
    expect(firstElementWithTestId).toHaveTextContent(formattedString);

    // View budget CTA
    const viewBudgetCTA = screen.getByText('View budget history', { selector: 'a' });
    expect(viewBudgetCTA).toBeInTheDocument();
    expect(viewBudgetCTA).toHaveAttribute('href', `/${enterpriseSlug}/admin/learner-credit/${mockEnterpriseOfferId}`);
  });

  it('displays correctly for an expired Subsidy (enterprise-subsidy)', () => {
    const mockBudgetAggregates = {
      total: 5000,
      spent: 200,
      available: 4800,
    };
    const mockBudget = {
      id: mockEnterpriseOfferId,
      name: mockBudgetDisplayName,
      start: '2022-01-01',
      end: '2023-01-01',
      source: BUDGET_TYPES.subsidy,
      aggregates: mockBudgetAggregates,
      enterpriseSlug,
      enterpriseUUID,
    };
    useSubsidySummaryAnalyticsApi.mockReturnValue({
      isLoading: false,
      subsidySummary: {
        totalFunds: mockBudgetAggregates.total,
        redeemedFunds: mockBudgetAggregates.spent,
        remainingFunds: mockBudgetAggregates.available,
        percentUtilized: mockBudgetAggregates.spent / mockBudgetAggregates.total,
        offerType: 'Site',
        offerId: mockEnterpriseOfferId,
        budgetsSummary: [
          {
            id: 'test-subsidy-uuid',
            start: '2022-01-01',
            end: '2022-01-01',
            remainingFunds: mockBudgetAggregates.available,
            redeemedFunds: mockBudgetAggregates.spent,
            enterpriseSlug,
            subsidyAccessPolicyDisplayName: mockBudgetDisplayName,
            subsidyAccessPolicyUuid: mockBudgetUuid,
          },
        ],
      },
    });

    render(<BudgetCardWrapper
      original={mockBudget}
    />);

    expect(screen.getByText(mockBudgetDisplayName)).toBeInTheDocument();
    expect(screen.queryByText('Executive Education')).not.toBeInTheDocument();
    const formattedString = `Expired ${dayjs(mockBudget.end).format('MMMM D, YYYY')}`;
    const elementsWithTestId = screen.getAllByTestId('budget-date');
    const firstElementWithTestId = elementsWithTestId[0];
    expect(firstElementWithTestId).toHaveTextContent(formattedString);

    // View budget CTA
    const viewBudgetCTA = screen.getByText('View budget history', { selector: 'a' });
    expect(viewBudgetCTA).toBeInTheDocument();
    expect(viewBudgetCTA).toHaveAttribute('href', `/${enterpriseSlug}/admin/learner-credit/${mockBudgetUuid}`);
  });

  it.each([
    { isAssignableBudget: false },
    { isAssignableBudget: true },
  ])('displays correctly for an expired Policy (enterprise-access) (%s)', ({ isAssignableBudget }) => {
    const mockBudgetAggregates = {
      total: 5000,
      spent: 200,
      pending: 100,
      available: isAssignableBudget ? 4700 : 4800,
    };
    const mockBudget = {
      id: mockBudgetUuid,
      name: mockBudgetDisplayName,
      start: '2022-01-01',
      end: '2023-01-01',
      source: BUDGET_TYPES.policy,
      aggregates: {
        available: mockBudgetAggregates.available,
        pending: isAssignableBudget ? mockBudgetAggregates.pending : undefined,
        spent: mockBudgetAggregates.spent,
      },
      isAssignable: isAssignableBudget,
      enterpriseSlug,
      enterpriseUUID,
    };
    useSubsidySummaryAnalyticsApi.mockReturnValue({
      isLoading: false,
      subsidySummary: undefined,
    });

    render(<BudgetCardWrapper
      original={mockBudget}
    />);

    expect(screen.getByText(mockBudgetDisplayName)).toBeInTheDocument();
    expect(screen.queryByText('Executive Education')).not.toBeInTheDocument();
    const formattedString = `Expired ${dayjs(mockBudget.end).format('MMMM D, YYYY')}`;
    const elementsWithTestId = screen.getAllByTestId('budget-date');
    const firstElementWithTestId = elementsWithTestId[0];
    expect(firstElementWithTestId).toHaveTextContent(formattedString);

    // View budget CTA
    const viewBudgetCTA = screen.getByText('View budget history', { selector: 'a' });
    expect(viewBudgetCTA).toBeInTheDocument();
    expect(viewBudgetCTA).toHaveAttribute('href', `/${enterpriseSlug}/admin/learner-credit/${mockBudgetUuid}`);
  });

  it('displays correctly for a current Enterprise Offers (ecommerce)', () => {
    const mockBudgetAggregates = {
      total: 5000,
      spent: 200,
      available: 4800,
    };
    const mockBudget = {
      id: mockEnterpriseOfferId,
      name: mockBudgetDisplayName,
      start: '2022-01-01',
      end: '3022-01-01',
      source: BUDGET_TYPES.ecommerce,
      aggregates: mockBudgetAggregates,
      enterpriseSlug,
      enterpriseUUID,
    };
    useSubsidySummaryAnalyticsApi.mockReturnValue({
      isLoading: false,
      subsidySummary: {
        totalFunds: mockBudgetAggregates.total,
        redeemedFunds: mockBudgetAggregates.spent,
        remainingFunds: mockBudgetAggregates.available,
        percentUtilized: mockBudgetAggregates.spent / mockBudgetAggregates.total,
        offerType: 'Site',
        offerId: mockEnterpriseOfferId,
        budgetsSummary: [],
      },
    });

    render(<BudgetCardWrapper
      original={mockBudget}
    />);

    expect(screen.getByText(mockBudgetDisplayName)).toBeInTheDocument();
    expect(screen.queryByText('Executive Education')).not.toBeInTheDocument();
    const formattedString = `Expires ${dayjs(mockBudget.end).format('MMMM D, YYYY')}`;
    const elementsWithTestId = screen.getAllByTestId('budget-date');
    const firstElementWithTestId = elementsWithTestId[0];
    expect(firstElementWithTestId).toHaveTextContent(formattedString);

    // View budget CTA
    const viewBudgetCTA = screen.getByText('View budget', { selector: 'a' });
    expect(viewBudgetCTA).toBeInTheDocument();
    expect(viewBudgetCTA).toHaveAttribute('href', `/${enterpriseSlug}/admin/learner-credit/${mockEnterpriseOfferId}`);

    // Aggregates
    expect(screen.getByText('Balance')).toBeInTheDocument();
    expect(screen.getByText('Available')).toBeInTheDocument();
    expect(screen.getByText(formatPrice(mockBudgetAggregates.available))).toBeInTheDocument();
    expect(screen.getByText('Spent')).toBeInTheDocument();
    expect(screen.getByText(formatPrice(mockBudgetAggregates.spent))).toBeInTheDocument();

    // Add funds should not display by default (feature flag off)
    expect(screen.queryByText('Add funds')).not.toBeInTheDocument();
  });

  it('displays correctly for a current Subsidy (enterprise-subsidy)', () => {
    const mockBudgetAggregates = {
      total: 5000,
      spent: 200,
      available: 4800,
    };
    const mockBudget = {
      id: mockEnterpriseOfferId,
      name: mockBudgetDisplayName,
      start: '2022-01-01',
      end: '3023-01-01',
      source: BUDGET_TYPES.subsidy,
      aggregates: mockBudgetAggregates,
      enterpriseSlug,
      enterpriseUUID,
    };
    useSubsidySummaryAnalyticsApi.mockReturnValue({
      isLoading: false,
      subsidySummary: {
        totalFunds: mockBudgetAggregates.total,
        redeemedFunds: mockBudgetAggregates.spent,
        remainingFunds: mockBudgetAggregates.available,
        percentUtilized: mockBudgetAggregates.spent / mockBudgetAggregates.total,
        offerType: 'Site',
        offerId: mockEnterpriseOfferId,
        budgetsSummary: [
          {
            id: 'test-subsidy-uuid',
            start: '2022-01-01',
            end: '3023-01-01',
            remainingFunds: mockBudgetAggregates.available,
            redeemedFunds: mockBudgetAggregates.spent,
            enterpriseSlug,
            subsidyAccessPolicyDisplayName: mockBudgetDisplayName,
            subsidyAccessPolicyUuid: mockBudgetUuid,
          },
        ],
      },
    });

    render(<BudgetCardWrapper
      original={mockBudget}
    />);

    expect(screen.getByText(mockBudgetDisplayName)).toBeInTheDocument();
    expect(screen.queryByText('Executive Education')).not.toBeInTheDocument();
    const formattedString = `Expires ${dayjs(mockBudget.end).format('MMMM D, YYYY')}`;
    const elementsWithTestId = screen.getAllByTestId('budget-date');
    const firstElementWithTestId = elementsWithTestId[0];
    expect(firstElementWithTestId).toHaveTextContent(formattedString);

    // View budget CTA
    const viewBudgetCTA = screen.getByText('View budget', { selector: 'a' });
    expect(viewBudgetCTA).toBeInTheDocument();
    expect(viewBudgetCTA).toHaveAttribute('href', `/${enterpriseSlug}/admin/learner-credit/${mockBudgetUuid}`);

    // Aggregates
    expect(screen.getByText('Balance')).toBeInTheDocument();
    expect(screen.getByText('Available')).toBeInTheDocument();
    expect(screen.getByText(formatPrice(mockBudgetAggregates.available))).toBeInTheDocument();
    expect(screen.getByText('Spent')).toBeInTheDocument();
    expect(screen.getByText(formatPrice(mockBudgetAggregates.spent))).toBeInTheDocument();
  });

  it.each([
    { isAssignableBudget: false },
    { isAssignableBudget: true },
  ])('displays correctly for a current Policy (enterprise-access) (%s)', ({ isAssignableBudget }) => {
    const mockBudgetAggregates = {
      total: 5000,
      spent: 200,
      pending: 100,
      available: isAssignableBudget ? 4700 : 4800,
    };
    const mockBudget = {
      id: mockBudgetUuid,
      name: mockBudgetDisplayName,
      start: '2022-01-01',
      end: '3023-01-01',
      source: BUDGET_TYPES.policy,
      aggregates: {
        available: mockBudgetAggregates.available,
        pending: isAssignableBudget ? mockBudgetAggregates.pending : undefined,
        spent: mockBudgetAggregates.spent,
      },
      isAssignable: isAssignableBudget,
      enterpriseSlug,
      enterpriseUUID,
    };
    useSubsidySummaryAnalyticsApi.mockReturnValue({
      isLoading: false,
      subsidySummary: undefined,
    });

    render(<BudgetCardWrapper
      original={mockBudget}
    />);

    expect(screen.getByText(mockBudgetDisplayName)).toBeInTheDocument();
    expect(screen.queryByText('Executive Education')).not.toBeInTheDocument();
    const formattedString = `Expires ${dayjs(mockBudget.end).format('MMMM D, YYYY')}`;
    const elementsWithTestId = screen.getAllByTestId('budget-date');
    const firstElementWithTestId = elementsWithTestId[0];
    expect(firstElementWithTestId).toHaveTextContent(formattedString);

    // View budget CTA
    const viewBudgetCTA = screen.getByText('View budget', { selector: 'a' });
    expect(viewBudgetCTA).toBeInTheDocument();
    expect(viewBudgetCTA).toHaveAttribute('href', `/${enterpriseSlug}/admin/learner-credit/${mockBudgetUuid}`);

    // Aggregates
    expect(screen.getByText('Balance')).toBeInTheDocument();
    expect(screen.getByText('Available')).toBeInTheDocument();
    expect(screen.getByText(formatPrice(mockBudgetAggregates.available))).toBeInTheDocument();
    if (isAssignableBudget) {
      expect(screen.getByText('Assigned')).toBeInTheDocument();
      expect(screen.getByText(formatPrice(mockBudgetAggregates.pending))).toBeInTheDocument();
    } else {
      expect(screen.queryByText('Assigned')).not.toBeInTheDocument();
    }
    expect(screen.getByText('Spent')).toBeInTheDocument();
    expect(screen.getByText(formatPrice(mockBudgetAggregates.spent))).toBeInTheDocument();
  });

  it.each([
    { isBnREnabled: true },
    { isBnREnabled: false },
  ])('displays correctly for a current BnR enabled Policy (enterprise-access) (%s)', ({ isBnREnabled }) => {
    const mockBudgetAggregates = {
      total: 5000,
      spent: 200,
      pending: 100,
      available: isBnREnabled ? 4700 : 4800,
    };
    const mockBudget = {
      id: mockBudgetUuid,
      name: mockBudgetDisplayName,
      start: '2022-01-01',
      end: '3023-01-01',
      source: BUDGET_TYPES.policy,
      aggregates: {
        available: mockBudgetAggregates.available,
        pending: isBnREnabled ? mockBudgetAggregates.pending : undefined,
        spent: mockBudgetAggregates.spent,
      },
      isBnREnabled,
      enterpriseSlug,
      enterpriseUUID,
    };
    useSubsidySummaryAnalyticsApi.mockReturnValue({
      isLoading: false,
      subsidySummary: undefined,
    });

    render(<BudgetCardWrapper
      original={mockBudget}
    />);

    expect(screen.getByText(mockBudgetDisplayName)).toBeInTheDocument();
    expect(screen.queryByText('Executive Education')).not.toBeInTheDocument();
    const formattedString = `Expires ${dayjs(mockBudget.end).format('MMMM D, YYYY')}`;
    const elementsWithTestId = screen.getAllByTestId('budget-date');
    const firstElementWithTestId = elementsWithTestId[0];
    expect(firstElementWithTestId).toHaveTextContent(formattedString);

    // View budget CTA
    const viewBudgetCTA = screen.getByText('View budget', { selector: 'a' });
    expect(viewBudgetCTA).toBeInTheDocument();
    expect(viewBudgetCTA).toHaveAttribute('href', `/${enterpriseSlug}/admin/learner-credit/${mockBudgetUuid}`);

    // Aggregates
    expect(screen.getByText('Balance')).toBeInTheDocument();
    expect(screen.getByText('Available')).toBeInTheDocument();
    expect(screen.getByText(formatPrice(mockBudgetAggregates.available))).toBeInTheDocument();
    if (isBnREnabled) {
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText(formatPrice(mockBudgetAggregates.pending))).toBeInTheDocument();
    } else {
      expect(screen.queryByText('Pending')).not.toBeInTheDocument();
    }
    expect(screen.getByText('Spent')).toBeInTheDocument();
    expect(screen.getByText(formatPrice(mockBudgetAggregates.spent))).toBeInTheDocument();
  });

  describe('Add funds CTA (top-up feature enabled)', () => {
    const mockBudgetAggregates = {
      total: 5000,
      spent: 200,
      available: 4800,
    };
    const mockOtherBudgetUuid = 'test-other-budget-uuid';
    const mockOtherBudgetDisplayName = 'Other Budget Display Name';
    const currentDates = { start: '2022-01-01', end: '3023-01-01' };
    const expiringDates = { start: '2022-01-01', end: dayjs().add(30, 'day').format('YYYY-MM-DD') };
    const expiredDates = { start: '2022-01-01', end: '2023-01-01' };
    const scheduledDates = { start: '3022-01-01', end: '3023-01-01' };

    const eligibilityRow = (overrides = {}) => ({
      policy_uuid: mockBudgetUuid,
      is_eligible: true,
      reasons: [],
      subsidy_expiration_datetime: '3023-01-01T00:00:00Z',
      ...overrides,
    });
    const ineligibleRow = (...errorCodes) => eligibilityRow({
      is_eligible: false,
      reasons: errorCodes.map((errorCode) => ({ error_code: errorCode, message: `English server text for ${errorCode}` })),
    });
    const mockEligibility = (...rows) => {
      EnterpriseAccessApiService.getTopUpEligibility.mockResolvedValue({ data: { results: rows } });
    };
    const httpError = (httpErrorStatus) => Object.assign(new Error(`HTTP ${httpErrorStatus}`), {
      customAttributes: { httpErrorStatus },
    });

    const policyBudget = (overrides = {}) => ({
      id: mockBudgetUuid,
      name: mockBudgetDisplayName,
      ...currentDates,
      source: BUDGET_TYPES.policy,
      aggregates: mockBudgetAggregates,
      isAssignable: false,
      isRetired: false,
      retiredAt: null,
      enterpriseSlug,
      enterpriseUUID,
      ...overrides,
    });

    // Renders every budget under one QueryClient, as the budgets list does.
    const renderPolicyBudgetCards = (budgets = [policyBudget()]) => {
      useSubsidySummaryAnalyticsApi.mockReturnValue({ isLoading: false, subsidySummary: undefined });
      return render(
        <QueryClientProvider client={queryClient()}>
          <MemoryRouter initialEntries={['/test-enterprise/admin/learner-credit']}>
            <Provider store={store}>
              <IntlProvider locale="en">
                <EnterpriseSubsidiesContext.Provider value={defaultEnterpriseSubsidiesContextValue}>
                  {budgets.map((budget) => <BudgetCard key={budget.id} original={budget} />)}
                </EnterpriseSubsidiesContext.Provider>
              </IntlProvider>
            </Provider>
          </MemoryRouter>
        </QueryClientProvider>,
      );
    };

    const renderBudgetCard = ({
      source,
      start,
      end,
      isRetired = false,
      retiredAt = null,
    }) => {
      useSubsidySummaryAnalyticsApi.mockReturnValue({
        isLoading: false,
        subsidySummary: source === BUDGET_TYPES.policy ? undefined : {
          totalFunds: mockBudgetAggregates.total,
          redeemedFunds: mockBudgetAggregates.spent,
          remainingFunds: mockBudgetAggregates.available,
          percentUtilized: mockBudgetAggregates.spent / mockBudgetAggregates.total,
          offerType: 'Site',
          offerId: mockEnterpriseOfferId,
          budgetsSummary: source === BUDGET_TYPES.subsidy ? [
            {
              id: 'test-subsidy-uuid',
              start,
              end,
              remainingFunds: mockBudgetAggregates.available,
              redeemedFunds: mockBudgetAggregates.spent,
              enterpriseSlug,
              subsidyAccessPolicyDisplayName: mockBudgetDisplayName,
              subsidyAccessPolicyUuid: mockBudgetUuid,
            },
          ] : [],
        },
      });
      render(<BudgetCardWrapper
        original={{
          id: source === BUDGET_TYPES.policy ? mockBudgetUuid : mockEnterpriseOfferId,
          name: mockBudgetDisplayName,
          start,
          end,
          source,
          aggregates: mockBudgetAggregates,
          isAssignable: false,
          isRetired,
          retiredAt,
          enterpriseSlug,
          enterpriseUUID,
        }}
      />);
    };

    const getDisabledAddFunds = () => screen.findByRole('button', { name: 'Add funds' });

    beforeEach(() => {
      features.TOP_UP_LEARNER_CREDIT = true;
      mockEligibility(eligibilityRow());
    });

    it.each([
      { status: BUDGET_STATUSES.active, dates: currentDates },
      { status: BUDGET_STATUSES.expiring, dates: expiringDates },
    ])('displays an Add funds CTA linking to the add funds flow for an eligible $status Policy (enterprise-access)', async ({ status, dates }) => {
      renderPolicyBudgetCards([policyBudget(dates)]);

      expect(screen.getByText(status)).toBeInTheDocument();
      const addFundsCTA = await screen.findByRole('link', { name: 'Add funds' });
      expect(addFundsCTA).toHaveAttribute(
        'href',
        `/${enterpriseSlug}/admin/learner-credit/${mockBudgetUuid}/add-funds`,
      );
      expect(addFundsCTA).not.toHaveAttribute('aria-disabled');
      expect(screen.queryByTestId('add-funds-ineligible-status')).not.toBeInTheDocument();
      expect(screen.getByText('View budget')).toBeInTheDocument();
      expect(EnterpriseAccessApiService.getTopUpEligibility).toHaveBeenCalledWith({
        enterpriseCustomerUuid: enterpriseUUID,
        policyUuid: undefined,
      });
    });

    it('renders the card without waiting for eligibility, and hides the CTA while it loads', () => {
      EnterpriseAccessApiService.getTopUpEligibility.mockReturnValue(new Promise(() => {}));
      renderPolicyBudgetCards();

      expect(screen.getByText(mockBudgetDisplayName)).toBeInTheDocument();
      expect(screen.getByText('View budget')).toBeInTheDocument();
      expect(screen.getByText(formatPrice(mockBudgetAggregates.available))).toBeInTheDocument();
      expect(screen.queryByText('Add funds')).not.toBeInTheDocument();
    });

    it('makes one eligibility request for every budget card', async () => {
      mockEligibility(
        eligibilityRow(),
        { ...ineligibleRow('budget_expiring_soon'), policy_uuid: mockOtherBudgetUuid },
      );
      renderPolicyBudgetCards([
        policyBudget(),
        policyBudget({ id: mockOtherBudgetUuid, name: mockOtherBudgetDisplayName }),
      ]);

      expect(await screen.findByRole('link', { name: 'Add funds' })).toHaveAttribute(
        'href',
        `/${enterpriseSlug}/admin/learner-credit/${mockBudgetUuid}/add-funds`,
      );
      expect(await getDisabledAddFunds()).toHaveAttribute('aria-disabled', 'true');
      expect(EnterpriseAccessApiService.getTopUpEligibility).toHaveBeenCalledTimes(1);
    });

    it.each([
      { errorCode: 'budget_not_active', message: 'This budget is inactive and cannot receive additional funds.' },
      { errorCode: 'budget_expiring_soon', message: 'This budget expires soon and cannot receive additional funds.' },
      { errorCode: 'account_not_eligible', message: 'Your account is not eligible to receive additional funds.' },
    ])('displays a disabled, focusable Add funds button explaining $errorCode', async ({ errorCode, message }) => {
      const user = userEvent.setup();
      mockEligibility(ineligibleRow(errorCode));
      renderPolicyBudgetCards();

      const addFunds = await getDisabledAddFunds();
      expect(addFunds).toHaveAttribute('aria-disabled', 'true');
      expect(addFunds).not.toBeDisabled();
      expect(addFunds).toHaveAccessibleDescription(message);
      // The reason sits in a warning strip at the bottom of the card, not under the button.
      expect(within(screen.getByTestId('add-funds-ineligible-status')).getByText(message)).toBeVisible();
      expect(screen.queryByText(`English server text for ${errorCode}`)).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Add funds' })).not.toBeInTheDocument();

      await user.tab();
      expect(addFunds).toHaveFocus();
      // Activating it does nothing; the card stays as it was. The mouse can't hover or click it.
      await user.keyboard('{Enter}');
      expect(addFunds).toHaveAttribute('aria-disabled', 'true');
      expect(addFunds).toHaveStyle({ pointerEvents: 'none' });
    });

    it('lists every reason when a budget is ineligible for several', async () => {
      mockEligibility(ineligibleRow('budget_not_active', 'budget_expiring_soon', 'account_not_eligible'));
      renderPolicyBudgetCards();

      const addFunds = await getDisabledAddFunds();
      const reasons = within(document.getElementById(addFunds.getAttribute('aria-describedby'))).getAllByRole('listitem');
      expect(reasons.map((reason) => reason.textContent)).toEqual([
        'This budget is inactive and cannot receive additional funds.',
        'This budget expires soon and cannot receive additional funds.',
        'Your account is not eligible to receive additional funds.',
      ]);
    });

    it.each([
      { scenario: 'unrecognized reasons', row: ineligibleRow('some_new_reason', 'another_new_reason') },
      { scenario: 'no reasons', row: eligibilityRow({ is_eligible: false }) },
    ])('shows one generic reason for $scenario', async ({ row }) => {
      mockEligibility(row);
      renderPolicyBudgetCards();

      await getDisabledAddFunds();
      expect(screen.getAllByText('This budget cannot receive additional funds right now.')).toHaveLength(1);
    });

    it('has no accessibility violations when Add funds is disabled', async () => {
      mockEligibility(ineligibleRow('budget_not_active', 'budget_expiring_soon'));
      const { container } = renderPolicyBudgetCards();

      await getDisabledAddFunds();
      const results = await axe(container, accessibilitySettings);
      expect(results).toHaveNoViolations();
    });

    it.each([
      { status: 403, expectedCalls: 1 },
      { status: 404, expectedCalls: 1 },
      // 5xx is retried once before giving up.
      { status: 503, expectedCalls: 2 },
    ])('hides the Add funds CTA and shows no error when eligibility fails with a $status', async ({ status, expectedCalls }) => {
      EnterpriseAccessApiService.getTopUpEligibility.mockRejectedValue(httpError(status));
      renderPolicyBudgetCards();

      await waitFor(
        () => expect(EnterpriseAccessApiService.getTopUpEligibility).toHaveBeenCalledTimes(expectedCalls),
        { timeout: 3000 },
      );
      expect(screen.getByText(mockBudgetDisplayName)).toBeInTheDocument();
      expect(screen.getByText('View budget')).toBeInTheDocument();
      expect(screen.queryByText('Add funds')).not.toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('hides the Add funds CTA on a network error', async () => {
      EnterpriseAccessApiService.getTopUpEligibility.mockRejectedValue(new Error('Network Error'));
      renderPolicyBudgetCards();

      await waitFor(
        () => expect(EnterpriseAccessApiService.getTopUpEligibility).toHaveBeenCalledTimes(2),
        { timeout: 3000 },
      );
      expect(screen.queryByText('Add funds')).not.toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('hides the Add funds CTA when the response has no row for the budget', async () => {
      mockEligibility({ ...eligibilityRow(), policy_uuid: mockOtherBudgetUuid });
      renderPolicyBudgetCards();

      await waitFor(() => expect(EnterpriseAccessApiService.getTopUpEligibility).toHaveBeenCalled());
      expect(screen.getByText('View budget')).toBeInTheDocument();
      expect(screen.queryByText('Add funds')).not.toBeInTheDocument();
    });

    it.each([
      { status: BUDGET_STATUSES.expired, source: BUDGET_TYPES.policy, budget: expiredDates },
      {
        status: BUDGET_STATUSES.retired,
        source: BUDGET_TYPES.policy,
        budget: { ...currentDates, isRetired: true, retiredAt: '2022-05-01' },
      },
      { status: BUDGET_STATUSES.scheduled, source: BUDGET_TYPES.policy, budget: scheduledDates },
      { status: BUDGET_STATUSES.active, source: BUDGET_TYPES.ecommerce, budget: currentDates },
      { status: BUDGET_STATUSES.active, source: BUDGET_TYPES.subsidy, budget: currentDates },
    ])('does not display the Add funds CTA or request eligibility for a $status $source budget', ({ status, source, budget }) => {
      renderBudgetCard({ source, ...budget });

      // Ensure the card rendered with the intended status, and that only the CTA was suppressed.
      expect(screen.getByText(mockBudgetDisplayName)).toBeInTheDocument();
      expect(screen.getByText(status)).toBeInTheDocument();
      if (status !== BUDGET_STATUSES.scheduled) {
        // Scheduled budgets render no header actions at all.
        expect(screen.getByText(/View budget/)).toBeInTheDocument();
      }
      expect(screen.queryByText('Add funds')).not.toBeInTheDocument();
      expect(EnterpriseAccessApiService.getTopUpEligibility).not.toHaveBeenCalled();
    });
  });

  it('displays correctly for a retired Policy (enterprise-access) (%s)', () => {
    const mockBudgetAggregates = {
      total: 5000,
      spent: 200,
      pending: undefined,
      available: 4800,
    };
    const mockBudget = {
      id: mockBudgetUuid,
      name: mockBudgetDisplayName,
      start: '2022-01-01',
      end: '3023-01-01',
      source: BUDGET_TYPES.policy,
      aggregates: {
        available: mockBudgetAggregates.available,
        pending: mockBudgetAggregates.pending,
        spent: mockBudgetAggregates.spent,
      },
      isAssignable: false,
      enterpriseSlug,
      enterpriseUUID,
      isRetired: true,
      retiredAt: '2022-01-01',
    };

    useSubsidySummaryAnalyticsApi.mockReturnValue({
      isLoading: false,
      subsidySummary: undefined,
    });

    render(<BudgetCardWrapper original={mockBudget} />);

    // Assertions for budget card display
    expect(screen.getByText(mockBudgetDisplayName)).toBeInTheDocument();
    expect(screen.queryByText('Executive Education')).not.toBeInTheDocument();

    const formattedString = `Retired ${dayjs(mockBudget.retiredAt).format('MMMM D, YYYY')}`;
    const elementsWithTestId = screen.getAllByTestId('budget-date');
    const firstElementWithTestId = elementsWithTestId[0];
    expect(firstElementWithTestId).toHaveTextContent(formattedString);

    // Verify 'View budget' CTA
    const viewBudgetCTA = screen.getByText('View budget history', { selector: 'a' });
    expect(viewBudgetCTA).toBeInTheDocument(); // Ensure 'View budget' CTA is present
    expect(viewBudgetCTA).toHaveAttribute(
      'href',
      `/${enterpriseSlug}/admin/learner-credit/${mockBudgetUuid}`,
    );

    const balanceDetailSection = screen.getByTestId('balance-detail-section');

    // Assertions for aggregates display
    expect(within(balanceDetailSection).queryByText('Balance')).not.toBeInTheDocument();
    expect(within(balanceDetailSection).queryByText('Available')).not.toBeInTheDocument();
    expect(within(balanceDetailSection).getByText('Spent')).toBeInTheDocument();
    expect(within(balanceDetailSection).getByText(formatPrice(mockBudgetAggregates.spent))).toBeInTheDocument();
  });

  it.each([
    {
      status: BUDGET_STATUSES.active,
      shouldShow: true,
      start: '2022-01-01',
      end: '3023-01-01',
      retiredAt: null,
    },
    {
      status: BUDGET_STATUSES.retired,
      shouldShow: true,
      start: '2022-01-01',
      end: '3023-01-01',
      retiredAt: '2022-05-01',
    },
    {
      status: BUDGET_STATUSES.expiring,
      shouldShow: true,
      start: '2022-01-01',
      end: dayjs().add(30, 'day').toString(),
      retiredAt: null,
    },
    {
      status: BUDGET_STATUSES.scheduled,
      shouldShow: false,
      start: '3022-01-01',
      end: '3023-01-01',
      retiredAt: null,
    },
    {
      status: BUDGET_STATUSES.expired,
      shouldShow: true,
      start: '2022-01-01',
      end: '2023-01-01',
      retiredAt: null,
    },
  ])('only render aggregates section for appropriate statuses (%s)', (
    {
      shouldShow,
      start,
      end,
      retiredAt,
    },
  ) => {
    const mockBudgetAggregates = {
      total: 5000,
      spent: 200,
      pending: undefined,
      available: 4800,
    };
    const mockBudget = {
      id: mockBudgetUuid,
      name: mockBudgetDisplayName,
      start,
      end,
      source: BUDGET_TYPES.policy,
      aggregates: {
        available: mockBudgetAggregates.available,
        pending: mockBudgetAggregates.pending,
        spent: mockBudgetAggregates.spent,
      },
      isAssignable: false,
      enterpriseSlug,
      enterpriseUUID,
      isRetired: !!retiredAt,
      retiredAt,
    };

    useSubsidySummaryAnalyticsApi.mockReturnValue({
      isLoading: false,
      subsidySummary: undefined,
    });

    render(<BudgetCardWrapper original={mockBudget} />);

    const aggregatesSection = screen.queryByTestId('aggregates-section');

    if (shouldShow) {
      expect(aggregatesSection).toBeInTheDocument();
    } else {
      expect(aggregatesSection).not.toBeInTheDocument();
    }
  });
});
