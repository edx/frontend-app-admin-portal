import React from 'react';
import { Provider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import thunk from 'redux-thunk';
import configureMockStore from 'redux-mock-store';
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from '@edx/frontend-platform/i18n';
import { getAuthenticatedUser } from '@edx/frontend-platform/auth';

import SubscriptionAuditTrail from '../SubscriptionAuditTrail';
import LicenseManagerApiService from '../../../data/services/LicenseManagerAPIService';
import { queryClient } from '../../test/testUtils';

jest.mock('../../../data/services/LicenseManagerAPIService');

const enterpriseId = 'test-enterprise-uuid';
const mockStore = configureMockStore([thunk]);
const store = mockStore({ portalConfiguration: { enterpriseId } });

const mockCustomerAgreementResponse = {
  data: {
    next: null,
    results: [{
      uuid: 'customer-agreement-1',
      subscriptions: [{ uuid: 'subscription-plan-1' }, { uuid: 'subscription-plan-2' }],
    }],
  },
};

const mockPlan1AuditHistoryPage1 = {
  data: {
    next: 'http://localhost/next-page',
    results: [
      {
        uuid: 'license-action-1',
        created: '2026-10-30T04:14:13Z',
        action_type: 'assigned',
        actor_type: 'admin',
        actor: { email: 'audit_admin@example.com', full_name: 'Audit Admin' },
        source: 'admin_api',
        license_uuid: 'license-1',
        learner_email: 'learner1@example.com',
        metadata: {},
      },
      {
        uuid: 'license-action-2',
        created: '2026-10-31T04:14:13Z',
        action_type: 'activated',
        actor_type: 'learner',
        // license-manager could not resolve the learner; the actor falls back to the affected learner.
        actor: null,
        source: 'api',
        license_uuid: 'license-1',
        learner_email: 'learner1@example.com',
        metadata: {},
      },
    ],
  },
};

const mockPlan1AuditHistoryPage2 = {
  data: {
    next: null,
    results: [{
      uuid: 'license-action-3',
      created: '2026-11-01T04:14:13Z',
      action_type: 'revoked',
      actor_type: 'admin',
      actor: { email: 'audit_admin@example.com', full_name: null },
      source: 'admin_api_bulk',
      license_uuid: 'license-2',
      learner_email: 'learner2@example.com',
      metadata: { original_status: 'activated' },
    }],
  },
};

const mockPlan2AuditHistory = {
  data: {
    next: null,
    results: [{
      uuid: 'license-action-4',
      created: '2026-10-29T04:14:13Z',
      action_type: 'renewed',
      actor_type: 'system',
      actor: null,
      source: 'renewal_job',
      license_uuid: 'license-3',
      learner_email: null,
      metadata: {},
    }],
  },
};

const renderSubscriptionAuditTrail = (client = queryClient()) => render(
  <QueryClientProvider client={client}>
    <Provider store={store}>
      <IntlProvider locale="en">
        <SubscriptionAuditTrail />
      </IntlProvider>
    </Provider>
  </QueryClientProvider>,
);

const mockSuccessfulResponses = () => {
  LicenseManagerApiService.fetchCustomerAgreementData.mockResolvedValue(mockCustomerAgreementResponse);
  LicenseManagerApiService.fetchSubscriptionAuditHistory.mockImplementation((subscriptionUUID, { page }) => {
    if (subscriptionUUID === 'subscription-plan-2') {
      return Promise.resolve(mockPlan2AuditHistory);
    }
    return Promise.resolve(page === 1 ? mockPlan1AuditHistoryPage1 : mockPlan1AuditHistoryPage2);
  });
};

// The options each page of a plan's audit history is requested with.
const expectedAuditHistoryRequest = (page) => ({ page, page_size: 100, signal: expect.any(AbortSignal) });

// Wait for an audit action in the table (the action type labels also appear as filter options).
const waitForAuditTrailTable = async () => within(await screen.findByRole('table')).findByText('Renewed');

const getTableRows = () => within(screen.getByRole('table')).getAllByRole('row').slice(1); // skip header row

describe('<SubscriptionAuditTrail />', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    getAuthenticatedUser.mockReturnValue({
      userId: 21,
      name: 'Priya Sharma',
      username: 'priya',
      email: 'priya.sharma@example.com',
    });
  });

  it('fetches every page of audit history for each subscription plan and renders the actions newest first', async () => {
    mockSuccessfulResponses();
    renderSubscriptionAuditTrail();

    expect(screen.getByText(/History of every action performed on subscription licenses/)).toBeInTheDocument();
    expect(await waitForAuditTrailTable()).toBeInTheDocument();
    // Inactive plans are included so their history remains visible.
    expect(LicenseManagerApiService.fetchCustomerAgreementData).toHaveBeenCalledWith(
      { enterprise_customer_uuid: enterpriseId, active_plans_only: false, page: 1 },
      { signal: expect.any(AbortSignal) },
    );
    expect(LicenseManagerApiService.fetchSubscriptionAuditHistory).toHaveBeenCalledWith('subscription-plan-1', expectedAuditHistoryRequest(1));
    expect(LicenseManagerApiService.fetchSubscriptionAuditHistory).toHaveBeenCalledWith('subscription-plan-1', expectedAuditHistoryRequest(2));
    expect(LicenseManagerApiService.fetchSubscriptionAuditHistory).toHaveBeenCalledWith('subscription-plan-2', expectedAuditHistoryRequest(1));
    expect(LicenseManagerApiService.fetchSubscriptionAuditHistory).toHaveBeenCalledTimes(3);

    const rows = getTableRows();
    expect(rows).toHaveLength(4);

    // An actor resolved by license-manager with only an email.
    expect(within(rows[0]).getByText('Revoked')).toBeInTheDocument();
    expect(within(rows[0]).getByText('Success')).toBeInTheDocument();
    expect(within(rows[0]).getByText('audit_admin@example.com')).toBeInTheDocument();
    expect(within(rows[0]).getByText('Admin API (bulk)')).toBeInTheDocument();
    expect(within(rows[0]).getByText('learner2@example.com')).toBeInTheDocument();

    // An unresolved learner actor falls back to the affected learner.
    expect(within(rows[1]).getByText('Activated')).toBeInTheDocument();
    expect(within(rows[1]).getAllByText('learner1@example.com')).toHaveLength(2);
    expect(within(rows[1]).getByText('Learner')).toBeInTheDocument();

    // An actor resolved by license-manager with a full name.
    expect(within(rows[2]).getByText('Assigned')).toBeInTheDocument();
    expect(within(rows[2]).getByText('Audit Admin')).toBeInTheDocument();
    expect(within(rows[2]).getByText('Admin · audit_admin@example.com')).toBeInTheDocument();
    expect(within(rows[2]).getByText('Admin API')).toBeInTheDocument();

    // System action with retired learner information.
    expect(within(rows[3]).getByText('Renewed')).toBeInTheDocument();
    expect(within(rows[3]).getByText('System')).toBeInTheDocument();
    expect(within(rows[3]).getByText('Plan renewal')).toBeInTheDocument();
    expect(within(rows[3]).getByText('Learner information removed')).toBeInTheDocument();

    // License-specific filter options are shown.
    expect(screen.getByRole('option', { name: 'Revoked' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Allocated' })).not.toBeInTheDocument();
  });

  it('reuses the cached audit trail when it is reopened within the stale time', async () => {
    mockSuccessfulResponses();
    // Use the app's 60 second stale time, so the remount happens while the cached rows are still fresh.
    const client = queryClient({ queries: { retry: false, staleTime: 60 * 1000 } });
    const { unmount } = renderSubscriptionAuditTrail(client);
    await waitForAuditTrailTable();
    unmount();

    renderSubscriptionAuditTrail(client);
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(LicenseManagerApiService.fetchCustomerAgreementData).toHaveBeenCalledTimes(1);
    expect(LicenseManagerApiService.fetchSubscriptionAuditHistory).toHaveBeenCalledTimes(3);
  });

  it('filters and sorts the audit trail without refetching', async () => {
    const user = userEvent.setup();
    mockSuccessfulResponses();
    renderSubscriptionAuditTrail();
    await waitForAuditTrailTable();

    await user.selectOptions(screen.getByLabelText('Source'), 'Plan renewal');
    expect(getTableRows()).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'Clear all' }));
    await user.click(screen.getByRole('button', { name: 'Sort: Newest first' }));
    expect(within(getTableRows()[0]).getByText('Renewed')).toBeInTheDocument();

    expect(LicenseManagerApiService.fetchCustomerAgreementData).toHaveBeenCalledTimes(1);
    expect(LicenseManagerApiService.fetchSubscriptionAuditHistory).toHaveBeenCalledTimes(3);
  });

  it('loads at most 10 pages of each plan\'s most recent audit history and says when older actions are left out', async () => {
    LicenseManagerApiService.fetchCustomerAgreementData.mockResolvedValue({
      data: { next: null, results: [{ uuid: 'customer-agreement-1', subscriptions: [{ uuid: 'subscription-plan-1' }] }] },
    });
    // Every page links to a next page, as for a plan with more than 10 pages of audit history.
    LicenseManagerApiService.fetchSubscriptionAuditHistory.mockImplementation((subscriptionUUID, { page }) => (
      Promise.resolve({
        data: {
          next: 'http://localhost/next-page',
          results: [{
            uuid: `license-action-${page}`,
            created: `2026-10-${String(page).padStart(2, '0')}T10:00:00Z`,
            action_type: 'assigned',
            actor_type: 'admin',
            actor: { email: 'audit_admin@example.com', full_name: 'Audit Admin' },
            source: 'admin_api',
            license_uuid: `license-${page}`,
            learner_email: `learner${page}@example.com`,
            metadata: {},
          }],
        },
      })
    ));
    renderSubscriptionAuditTrail();

    expect(await screen.findByText(
      'Showing the 1,000 most recent license actions in each plan. Older actions aren\'t included.',
    )).toBeInTheDocument();
    expect(LicenseManagerApiService.fetchSubscriptionAuditHistory).toHaveBeenCalledTimes(10);
    expect(screen.getByText('Showing 1 - 10 of 10.')).toBeInTheDocument();
  });

  it('shows an empty state when there is no audit history', async () => {
    LicenseManagerApiService.fetchCustomerAgreementData.mockResolvedValue(mockCustomerAgreementResponse);
    LicenseManagerApiService.fetchSubscriptionAuditHistory.mockResolvedValue({ data: { next: null, results: [] } });
    renderSubscriptionAuditTrail();
    expect(await screen.findByText('No audit history available')).toBeInTheDocument();
  });

  it('shows an error alert when the audit trail fails to load, and retries', async () => {
    const user = userEvent.setup();
    LicenseManagerApiService.fetchCustomerAgreementData.mockRejectedValueOnce(
      Object.assign(new Error('oops'), { customAttributes: { httpErrorStatus: 403 } }),
    );
    renderSubscriptionAuditTrail();

    expect(await screen.findByText('We couldn\'t load the audit history')).toBeInTheDocument();
    expect(screen.queryByText('No audit history available')).not.toBeInTheDocument();

    mockSuccessfulResponses();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await waitForAuditTrailTable()).toBeInTheDocument();
  });
});
