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

import LearnerCreditAuditTrail from '../LearnerCreditAuditTrail';
import EnterpriseAccessApiService from '../../../data/services/EnterpriseAccessApiService';
import { queryClient } from '../../test/testUtils';

jest.mock('../../../data/services/EnterpriseAccessApiService');

const enterpriseId = 'test-enterprise-uuid';
const mockStore = configureMockStore([thunk]);
const store = mockStore({ portalConfiguration: { enterpriseId } });

const mockPoliciesResponse = {
  data: {
    results: [
      { uuid: 'policy-1', assignment_configuration: { uuid: 'assignment-configuration-1' } },
      // Non-assignable budgets have no assignment configuration and are skipped.
      { uuid: 'policy-2', assignment_configuration: null },
    ],
  },
};

const mockAssignmentsPage1 = {
  data: {
    next: 'http://localhost/next-page',
    results: [{
      uuid: 'assignment-1',
      learner_email: 'jane.doe@example.com',
      lms_user_id: 7,
      actions: [
        {
          uuid: 'action-1',
          created: '2026-10-01T10:00:00Z',
          action_type: 'allocated',
          actor_type: 'admin',
          actor_lms_user_id: 21,
          source: 'api',
          error_reason: null,
          learner_email: 'jane.doe@example.com',
        },
        {
          uuid: 'action-2',
          created: '2026-10-03T10:00:00Z',
          action_type: 'redeemed',
          actor_type: 'learner',
          actor_lms_user_id: 7,
          source: 'api',
          error_reason: null,
          learner_email: null,
        },
      ],
    }],
  },
};

const mockAssignmentsPage2 = {
  data: {
    next: null,
    results: [{
      uuid: 'assignment-2',
      learner_email: 'sam.lee@example.com',
      lms_user_id: null,
      actions: [{
        uuid: 'action-3',
        created: '2026-10-02T10:00:00Z',
        action_type: 'reminded',
        actor_type: 'admin',
        actor_lms_user_id: 99,
        source: 'api',
        error_reason: 'email_error',
        learner_email: 'sam.lee@example.com',
      }],
    }],
  },
};

const LearnerCreditAuditTrailWrapper = () => (
  <QueryClientProvider client={queryClient()}>
    <Provider store={store}>
      <IntlProvider locale="en">
        <LearnerCreditAuditTrail />
      </IntlProvider>
    </Provider>
  </QueryClientProvider>
);

const mockSuccessfulResponses = () => {
  EnterpriseAccessApiService.listSubsidyAccessPolicies.mockResolvedValue(mockPoliciesResponse);
  EnterpriseAccessApiService.listContentAssignmentsWithAuditTrail
    .mockResolvedValueOnce(mockAssignmentsPage1)
    .mockResolvedValueOnce(mockAssignmentsPage2);
};

// Wait for an audit action in the table (the action type labels also appear as filter options).
const waitForAuditTrailTable = async () => within(await screen.findByRole('table')).findByText('Redeemed');

const getTableRows = () => within(screen.getByRole('table')).getAllByRole('row').slice(1); // skip header row

describe('<LearnerCreditAuditTrail />', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    getAuthenticatedUser.mockReturnValue({
      userId: 21,
      name: 'Priya Sharma',
      username: 'priya',
      email: 'priya.sharma@example.com',
    });
  });

  it('fetches every page of assignments for each assignable budget and renders their actions newest first', async () => {
    mockSuccessfulResponses();
    render(<LearnerCreditAuditTrailWrapper />);

    expect(screen.getByText(/History of every action performed on learner credit assignments/)).toBeInTheDocument();
    expect(await waitForAuditTrailTable()).toBeInTheDocument();
    expect(EnterpriseAccessApiService.listSubsidyAccessPolicies).toHaveBeenCalledWith(enterpriseId);
    expect(EnterpriseAccessApiService.listContentAssignmentsWithAuditTrail).toHaveBeenCalledTimes(2);
    expect(EnterpriseAccessApiService.listContentAssignmentsWithAuditTrail)
      .toHaveBeenNthCalledWith(1, 'assignment-configuration-1', { page: 1 });
    expect(EnterpriseAccessApiService.listContentAssignmentsWithAuditTrail)
      .toHaveBeenNthCalledWith(2, 'assignment-configuration-1', { page: 2 });

    const rows = getTableRows();
    expect(rows).toHaveLength(3);

    // The learner redeemed their own assignment; the actor is resolved from the assignment's learner.
    expect(within(rows[0]).getByText('Redeemed')).toBeInTheDocument();
    expect(within(rows[0]).getAllByText('jane.doe@example.com')).toHaveLength(2);
    expect(within(rows[0]).getByText('Learner')).toBeInTheDocument();
    expect(within(rows[0]).getByText('Success')).toBeInTheDocument();

    // An admin that isn't the current user is shown by role and LMS user ID; the failed status shows the reason.
    expect(within(rows[1]).getByText('Reminded')).toBeInTheDocument();
    expect(within(rows[1]).getByText('Unknown user')).toBeInTheDocument();
    expect(within(rows[1]).getByText('Admin · ID 99')).toBeInTheDocument();
    expect(within(rows[1]).getByText('Failed')).toBeInTheDocument();
    expect(within(rows[1]).getByText('Email delivery failed')).toBeInTheDocument();
    expect(within(rows[1]).getByText('sam.lee@example.com')).toBeInTheDocument();

    // The current admin is resolved from the authenticated user.
    expect(within(rows[2]).getByText('Allocated')).toBeInTheDocument();
    expect(within(rows[2]).getByText('Priya Sharma')).toBeInTheDocument();
    expect(within(rows[2]).getByText('Admin · priya.sharma@example.com')).toBeInTheDocument();
    expect(within(rows[2]).getByText('API')).toBeInTheDocument();
  });

  it('filters and sorts the audit trail without refetching', async () => {
    const user = userEvent.setup();
    mockSuccessfulResponses();
    render(<LearnerCreditAuditTrailWrapper />);
    await waitForAuditTrailTable();

    await user.selectOptions(screen.getByLabelText('Action'), 'Reminded');
    expect(getTableRows()).toHaveLength(1);
    expect(within(getTableRows()[0]).getByText('Reminded')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Status'), 'Success');
    expect(screen.getByText('No events match these filters')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Action'), '');
    expect(getTableRows()).toHaveLength(2);

    await user.click(screen.getByRole('button', { name: 'Clear all' }));
    expect(getTableRows()).toHaveLength(3);

    await user.click(screen.getByRole('button', { name: 'Sort: Newest first' }));
    expect(within(getTableRows()[0]).getByText('Allocated')).toBeInTheDocument();

    expect(EnterpriseAccessApiService.listSubsidyAccessPolicies).toHaveBeenCalledTimes(1);
    expect(EnterpriseAccessApiService.listContentAssignmentsWithAuditTrail).toHaveBeenCalledTimes(2);
  });

  it('shows an error alert when the audit trail fails to load, and retries', async () => {
    const user = userEvent.setup();
    EnterpriseAccessApiService.listSubsidyAccessPolicies.mockRejectedValueOnce(new Error('oops'));
    render(<LearnerCreditAuditTrailWrapper />);

    expect(await screen.findByText('We couldn\'t load the audit history')).toBeInTheDocument();
    expect(screen.queryByText('No audit history available')).not.toBeInTheDocument();

    mockSuccessfulResponses();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await waitForAuditTrailTable()).toBeInTheDocument();
  });

  it('shows an empty state when there are no assignable budgets', async () => {
    EnterpriseAccessApiService.listSubsidyAccessPolicies.mockResolvedValue({ data: { results: [] } });
    render(<LearnerCreditAuditTrailWrapper />);
    expect(await screen.findByText('No audit history available')).toBeInTheDocument();
    expect(EnterpriseAccessApiService.listContentAssignmentsWithAuditTrail).not.toHaveBeenCalled();
  });
});
