import React from 'react';
import {
  render, screen, waitFor, within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { IntlProvider } from '@edx/frontend-platform/i18n';
import { QueryClientProvider } from '@tanstack/react-query';

import LearnerCreditAllocationTable from '../LearnerCreditAllocationTable';
import EnterpriseAccessApiService from '../../../data/services/EnterpriseAccessApiService';
import { queryClient } from '../../test/testUtils';
import { configuration } from '../../../config';

jest.mock('../../../data/services/EnterpriseAccessApiService');

const mockStore = configureMockStore([thunk]);
const enterpriseId = 'test-enterprise-uuid';
const currentPolicyId = 'a1b2c3d4-0000-4000-8000-000000000001';
const otherPolicyId = 'a1b2c3d4-0000-4000-8000-000000000002';
const HELP_CENTER_URL = 'https://help.example.com/multi-plan-funding';

// Budget names are looked up per policy UUID (including inactive budgets), not from the active budgets list.
const mockPolicyNames = (namesById) => {
  EnterpriseAccessApiService.retrieveSubsidyAccessPolicy.mockImplementation(async (policyId) => {
    if (!namesById[policyId]) {
      throw new Error('Not found');
    }
    return { data: { uuid: policyId, display_name: namesById[policyId] } };
  });
};

const makeStore = ({ isMultiPlanFundingEnabled = true } = {}) => mockStore({
  portalConfiguration: {
    enterpriseId,
    enterpriseSlug: 'test-enterprise',
    enableLearnerPortal: true,
    // Backend flag `enterprise_multi_plan_funding_enabled`, camelCased by LmsApiService.fetchEnterpriseBySlug.
    enterpriseFeatures: { enterpriseMultiPlanFundingEnabled: isMultiPlanFundingEnabled },
  },
});

const splitFundedRow = {
  uuid: 'txn-split',
  enrollmentDate: '2026-09-10T10:00:00Z',
  userEmail: 'ehrlich@example.com',
  courseTitle: 'MBA Essentials',
  courseKey: 'edX+MBA',
  courseListPrice: 1200,
  courseRunStartDate: '2026-11-18T00:00:00Z',
  splitFunding: {
    splitRecordUuid: 'split-1',
    state: 'committed',
    totalQuantity: 190000,
    legs: [
      {
        legOrder: 1,
        transactionUuid: 'txn-split',
        subsidyAccessPolicyUuid: currentPolicyId,
        quantity: 120000,
        reversed: false,
      },
      {
        legOrder: 2,
        transactionUuid: 'txn-split-2',
        subsidyAccessPolicyUuid: otherPolicyId,
        quantity: 70000,
        reversed: false,
      },
    ],
  },
};

const singleBudgetRow = {
  uuid: 'txn-single',
  enrollmentDate: '2026-08-11T10:00:00Z',
  userEmail: 'richard@example.com',
  courseTitle: 'Accelerated Management Program',
  courseKey: 'edX+AMP',
  courseListPrice: 1499,
  courseRunStartDate: '2026-10-07T00:00:00Z',
  splitFunding: null,
};

const renderTable = ({
  budgetId = currentPolicyId,
  results = [splitFundedRow, singleBudgetRow],
  isMultiPlanFundingEnabled = true,
} = {}) => render(
  <IntlProvider locale="en">
    <QueryClientProvider client={queryClient()}>
      <Provider store={makeStore({ isMultiPlanFundingEnabled })}>
        <MemoryRouter initialEntries={[`/${budgetId}`]}>
          <Routes>
            <Route
              path="/:budgetId"
              element={(
                <LearnerCreditAllocationTable
                  isLoading={false}
                  tableData={{ results, itemCount: results.length, pageCount: 1 }}
                  fetchTableData={jest.fn()}
                />
            )}
            />
          </Routes>
        </MemoryRouter>
      </Provider>
    </QueryClientProvider>
  </IntlProvider>,
);

describe('Spent table "Funded from" column (multi-plan learner credit)', () => {
  const originalHelpCenterUrl = configuration.ENTERPRISE_SUPPORT_MULTI_PLAN_FUNDING_URL;

  beforeEach(() => {
    jest.clearAllMocks();
    configuration.ENTERPRISE_SUPPORT_MULTI_PLAN_FUNDING_URL = HELP_CENTER_URL;
    mockPolicyNames({
      [currentPolicyId]: 'LC Executive Education',
      [otherPolicyId]: 'BNR OCM only',
    });
  });

  afterAll(() => {
    configuration.ENTERPRISE_SUPPORT_MULTI_PLAN_FUNDING_URL = originalHelpCenterUrl;
  });

  describe('flag off', () => {
    it.each([
      { enterpriseFeatures: { enterpriseMultiPlanFundingEnabled: false } },
      { enterpriseFeatures: {} },
      // The snake_case key is never in Redux (enterprise_features is camelCased on load), so it must not enable the UI.
      { enterpriseFeatures: { enterprise_multi_plan_funding_enabled: true } },
    ])('ignores a missing or false backend flag (%p)', ({ enterpriseFeatures }) => {
      render(
        <IntlProvider locale="en">
          <QueryClientProvider client={queryClient()}>
            <Provider store={mockStore({ portalConfiguration: { enterpriseId, enterpriseFeatures } })}>
              <MemoryRouter initialEntries={[`/${currentPolicyId}`]}>
                <Routes>
                  <Route
                    path="/:budgetId"
                    element={(
                      <LearnerCreditAllocationTable
                        isLoading={false}
                        tableData={{ results: [singleBudgetRow], itemCount: 1, pageCount: 1 }}
                        fetchTableData={jest.fn()}
                      />
                  )}
                  />
                </Routes>
              </MemoryRouter>
            </Provider>
          </QueryClientProvider>
        </IntlProvider>,
      );
      expect(screen.queryByText('Funded From')).not.toBeInTheDocument();
    });

    it('renders the Spent table exactly as before, with no multi-plan UI', () => {
      renderTable({ isMultiPlanFundingEnabled: false });
      expect(screen.getByText('Enrollment details')).toBeInTheDocument();
      expect(screen.queryByText('Funded From')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /View details/ })).not.toBeInTheDocument();
      expect(screen.queryByText('LC Executive Education')).not.toBeInTheDocument();
      expect(document.getElementById('spent-budget-funded-from')).toBeNull();
      expect(screen.queryByRole('link', { name: /Help center/ })).not.toBeInTheDocument();
    });
  });

  describe('flag on', () => {
    it('adds the "Funded from" column header with the tour target id', () => {
      renderTable();
      const header = screen.getByText('Funded From');
      expect(header).toHaveAttribute('id', 'spent-budget-funded-from');
    });

    it('does not add the column for enterprise offer (non-policy) budgets', () => {
      renderTable({ budgetId: '12345' });
      expect(screen.queryByText('Funded From')).not.toBeInTheDocument();
    });

    it('shows the current budget name for single-budget rows and "View details" only for split rows', async () => {
      renderTable();
      await screen.findByText('LC Executive Education');
      const rows = screen.getAllByRole('row');
      const splitRow = rows.find(row => within(row).queryByText('ehrlich@example.com'));
      const singleRow = rows.find(row => within(row).queryByText('richard@example.com'));

      expect(within(splitRow).getByRole('button', { name: /View details/ })).toBeInTheDocument();
      expect(within(singleRow).queryByRole('button', { name: /View details/ })).not.toBeInTheDocument();
      expect(within(singleRow).getByText('LC Executive Education')).toBeInTheDocument();
    });

    it('gives the "View details" button an accessible name that includes the visible label and course', () => {
      renderTable();
      expect(screen.getByRole('button', {
        name: 'View details of how MBA Essentials was funded across budgets',
      })).toBeInTheDocument();
    });

    it('opens the Spent Details modal with the per-budget breakdown and total, and closes it', async () => {
      const user = userEvent.setup();
      renderTable();

      await user.click(screen.getByRole('button', { name: /View details/ }));

      const modal = await screen.findByRole('dialog', { name: 'Spent Details' });
      expect(within(modal).getByText('Funded On')).toBeInTheDocument();
      expect(within(modal).getByText('Sep 10, 2026')).toBeInTheDocument();
      const breakdown = within(modal).getByTestId('split-funding-breakdown');
      expect(await within(breakdown).findByText('LC Executive Education')).toBeInTheDocument();
      expect(within(breakdown).getByText('$1,200.00')).toBeInTheDocument();
      expect(await within(breakdown).findByText('BNR OCM only')).toBeInTheDocument();
      expect(within(breakdown).getByText('$700.00')).toBeInTheDocument();
      expect(within(breakdown).getByText('Total')).toBeInTheDocument();
      expect(within(breakdown).getByText('$1,900.00')).toBeInTheDocument();

      await user.click(within(modal).getByRole('button', { name: 'Close' }));
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    });

    it('renders the help center link in the modal, opening in a new tab', async () => {
      const user = userEvent.setup();
      renderTable();
      await user.click(screen.getByRole('button', { name: /View details/ }));

      const modal = await screen.findByRole('dialog', { name: 'Spent Details' });
      const helpLink = within(modal).getByRole('link', { name: /Help center: Multi-plan funding/ });
      expect(helpLink).toHaveAttribute('href', HELP_CENTER_URL);
      expect(helpLink).toHaveAttribute('target', '_blank');
      expect(helpLink).toHaveAttribute('rel', expect.stringContaining('noopener'));
      // Paragon adds screen reader text announcing that the link opens in a new tab.
      expect(within(helpLink).getByText(/in a new tab/i)).toBeInTheDocument();
    });

    it('hides the help center link when no URL is configured', async () => {
      configuration.ENTERPRISE_SUPPORT_MULTI_PLAN_FUNDING_URL = undefined;
      const user = userEvent.setup();
      renderTable();
      await user.click(screen.getByRole('button', { name: /View details/ }));

      const modal = await screen.findByRole('dialog', { name: 'Spent Details' });
      expect(within(modal).queryByRole('link', { name: /Help center/ })).not.toBeInTheDocument();
    });

    it('marks refunded legs and falls back when a budget name is unavailable', async () => {
      mockPolicyNames({ [currentPolicyId]: 'LC Executive Education' });
      const refundedRow = {
        ...splitFundedRow,
        splitFunding: {
          ...splitFundedRow.splitFunding,
          legs: splitFundedRow.splitFunding.legs.map(leg => ({ ...leg, reversed: true })),
        },
      };
      const user = userEvent.setup();
      renderTable({ results: [refundedRow] });
      await user.click(screen.getByRole('button', { name: /View details/ }));

      const modal = await screen.findByRole('dialog', { name: 'Spent Details' });
      expect(await within(modal).findByText('LC Executive Education')).toBeInTheDocument();
      expect(within(modal).getByText('Another budget')).toBeInTheDocument();
      expect(within(modal).getAllByText('Refunded')).toHaveLength(2);
    });

    it('looks budget names up by UUID, so inactive budgets keep their names', async () => {
      renderTable({ results: [singleBudgetRow] });
      expect(await screen.findByText('LC Executive Education')).toBeInTheDocument();
      expect(EnterpriseAccessApiService.retrieveSubsidyAccessPolicy).toHaveBeenCalledWith(currentPolicyId);
      expect(EnterpriseAccessApiService.listSubsidyAccessPolicies).not.toHaveBeenCalled();
    });

    it('renders nothing in the cell for single-budget rows while the budget name is loading', () => {
      EnterpriseAccessApiService.retrieveSubsidyAccessPolicy.mockReturnValue(new Promise(() => {}));
      renderTable({ results: [singleBudgetRow] });
      expect(screen.getByText('Funded From')).toBeInTheDocument();
      expect(screen.queryByText('LC Executive Education')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /View details/ })).not.toBeInTheDocument();
    });
  });
});
