import React, { useState } from 'react';
import {
  render, screen, waitFor, within,
} from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from '@edx/frontend-platform/i18n';
import { axe } from 'jest-axe';

import AuditTrail from '../AuditTrail';
import {
  ASSIGNMENT_AUDIT_ACTION_TYPES,
  ASSIGNMENT_AUDIT_SOURCES,
  AUDIT_TRAIL_DEFAULT_FILTERS,
} from '../data/constants';
import { accessibilitySettings } from '../../../../tests/accessibility-settings';

const mockAuditTrailRows = [
  {
    uuid: 'action-1',
    timestamp: '2026-10-22T10:41:00Z',
    actionType: 'redeemed',
    status: 'success',
    actorType: 'learner',
    actorName: 'Jane Doe',
    actorEmail: 'jane.doe@example.com',
    actorLmsUserId: 3,
    source: 'api',
    errorReason: null,
    learnerName: 'Jane Doe',
    learnerEmail: 'jane.doe@example.com',
  },
  {
    uuid: 'action-2',
    timestamp: '2026-10-21T14:14:00Z',
    actionType: 'reminded',
    status: 'success',
    actorType: 'admin',
    actorName: 'Priya Sharma',
    actorEmail: 'priya.sharma@example.com',
    actorLmsUserId: 1,
    source: 'admin_ui_single',
    errorReason: null,
    learnerName: null,
    learnerEmail: 'jane.doe@example.com',
  },
  {
    uuid: 'action-3',
    timestamp: '2026-10-15T16:32:00Z',
    actionType: 'errored',
    status: 'failed',
    actorType: 'system',
    actorName: null,
    actorEmail: null,
    actorLmsUserId: null,
    source: 'celery_task',
    errorReason: 'email_error',
    learnerName: null,
    learnerEmail: 'jane.doe@example.com',
  },
  {
    uuid: 'action-4',
    timestamp: '2026-10-15T16:30:00Z',
    actionType: 'some_new_action',
    status: 'success',
    actorType: 'admin',
    actorName: null,
    actorEmail: null,
    actorLmsUserId: 48213,
    source: 'some_new_source',
    errorReason: null,
    learnerName: null,
    learnerEmail: null,
  },
];

const defaultProps = {
  description: 'History of every action performed on learner credit assignments across your budgets.',
  actionTypeOptions: ASSIGNMENT_AUDIT_ACTION_TYPES,
  sourceOptions: ASSIGNMENT_AUDIT_SOURCES,
  filters: AUDIT_TRAIL_DEFAULT_FILTERS,
  onFiltersChange: jest.fn(),
  tableData: { results: mockAuditTrailRows, itemCount: mockAuditTrailRows.length, pageCount: 1 },
  fetchTableData: jest.fn(),
  isLoading: false,
  isFetching: false,
  isError: false,
  onRetry: jest.fn(),
};

const renderAuditTrail = (props = {}) => render(
  <IntlProvider locale="en">
    <AuditTrail {...defaultProps} {...props} />
  </IntlProvider>,
);

const emptyTableData = { results: [], itemCount: 0, pageCount: 1 };

describe('<AuditTrail />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderAuditTrail();
    const results = await axe(container, accessibilitySettings);
    expect(results).toHaveNoViolations();
  });

  it('renders the heading, description, filters and table columns', () => {
    renderAuditTrail();
    expect(screen.getByRole('heading', { name: 'Audit trail' })).toBeInTheDocument();
    expect(screen.getByText(/History of every action performed on learner credit assignments/)).toBeInTheDocument();
    expect(screen.getByText(/Times shown in your local time zone/)).toBeInTheDocument();
    const columnHeaders = screen.getAllByRole('columnheader').map(header => header.textContent);
    expect(columnHeaders).toEqual(['Timestamp', 'Action', 'Status', 'Actor', 'Source', 'Affected learner']);
    expect(screen.getByLabelText('Actor')).toBeInTheDocument();
    expect(screen.getByLabelText('Action')).toBeInTheDocument();
    expect(screen.getByLabelText('Status')).toBeInTheDocument();
    expect(screen.getByLabelText('Source')).toBeInTheDocument();
    expect(screen.getByLabelText('From')).toBeInTheDocument();
    expect(screen.getByLabelText('To')).toBeInTheDocument();
  });

  it('renders each audit action with its status, resolved actor, source and affected learner', () => {
    renderAuditTrail();
    const rows = screen.getAllByRole('row').slice(1); // skip header row
    expect(rows).toHaveLength(4);

    // Learner actor
    // Timestamps are shown on a single line (tests run in UTC).
    expect(within(rows[0]).getByText('22 Oct 2026, 10:41:00 AM')).toHaveClass('text-nowrap');
    // Action types are plain text, and the status is a badge.
    expect(within(rows[0]).getByText('Redeemed')).not.toHaveClass('badge');
    expect(within(rows[0]).getByText('Success').closest('.badge')).toHaveClass('badge-success');
    // The learner is both the actor and the affected learner of their own redemption.
    expect(within(rows[0]).getAllByText('Jane Doe')).toHaveLength(2);
    expect(within(rows[0]).getByText('Learner · jane.doe@example.com')).toBeInTheDocument();
    expect(within(rows[0]).getByText('API')).toBeInTheDocument();

    // Admin actor
    expect(within(rows[1]).getByText('Reminded')).toBeInTheDocument();
    expect(within(rows[1]).getByText('Priya Sharma')).toBeInTheDocument();
    expect(within(rows[1]).getByText('Admin · priya.sharma@example.com')).toBeInTheDocument();
    expect(within(rows[1]).getByText('Admin Portal')).toBeInTheDocument();
    expect(within(rows[1]).getByText('jane.doe@example.com')).toBeInTheDocument();

    // System actor with an error reason
    expect(within(rows[2]).getByText('Errored')).toBeInTheDocument();
    expect(within(rows[2]).getByText('Failed').closest('.badge')).toHaveClass('badge-danger');
    expect(within(rows[2]).getByText('Email delivery failed')).toBeInTheDocument();
    expect(within(rows[2]).getByText('System')).toBeInTheDocument();
    expect(within(rows[2]).getByText('Automated')).toBeInTheDocument();
    expect(within(rows[2]).getByText('Background task')).toBeInTheDocument();

    // Unresolved actor, unknown enum values and retired learner information
    expect(within(rows[3]).getByText('Some new action')).toBeInTheDocument();
    expect(within(rows[3]).getByText('Unknown user')).toBeInTheDocument();
    expect(within(rows[3]).getByText('Admin · ID 48213')).toBeInTheDocument();
    expect(within(rows[3]).getByText('Some new source')).toBeInTheDocument();
    expect(within(rows[3]).getByText('Learner information removed')).toBeInTheDocument();
  });

  it('shows a loading skeleton instead of the table while loading', () => {
    renderAuditTrail({ isLoading: true, tableData: emptyTableData });
    expect(screen.getByTestId('audit-trail-loading')).toBeInTheDocument();
    expect(screen.getByText('Loading audit history...')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.queryByText('No audit history available')).not.toBeInTheDocument();
  });

  it('shows an error alert with a retry button when the audit trail fails to load', async () => {
    const user = userEvent.setup();
    const onRetry = jest.fn();
    renderAuditTrail({ isError: true, tableData: emptyTableData, onRetry });
    expect(screen.getByRole('alert')).toHaveTextContent('We couldn\'t load the audit history');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.queryByText('No audit history available')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows an empty state when there is no audit history', () => {
    renderAuditTrail({ tableData: emptyTableData });
    expect(screen.getByText('No audit history available')).toBeInTheDocument();
  });

  it('shows a different empty state when no audit history matches the filters', () => {
    renderAuditTrail({
      tableData: emptyTableData,
      filters: { ...AUDIT_TRAIL_DEFAULT_FILTERS, actionType: 'cancelled' },
    });
    expect(screen.getByText('No events match these filters')).toBeInTheDocument();
    expect(screen.queryByText('No audit history available')).not.toBeInTheDocument();
  });

  it('sorts newest first by default and toggles to oldest first', async () => {
    const user = userEvent.setup();
    const fetchTableData = jest.fn();
    renderAuditTrail({ fetchTableData });
    expect(fetchTableData).toHaveBeenLastCalledWith(expect.objectContaining({
      pageIndex: 0,
      sortBy: [{ id: 'timestamp', desc: true }],
    }));

    await user.click(screen.getByRole('button', { name: 'Sort: Newest first' }));
    expect(screen.getByRole('button', { name: 'Sort: Oldest first' })).toBeInTheDocument();
    expect(fetchTableData).toHaveBeenLastCalledWith(expect.objectContaining({
      pageIndex: 0,
      sortBy: [{ id: 'timestamp', desc: false }],
    }));

    await user.click(screen.getByRole('button', { name: 'Sort: Oldest first' }));
    expect(fetchTableData).toHaveBeenLastCalledWith(expect.objectContaining({
      sortBy: [{ id: 'timestamp', desc: true }],
    }));
  });

  it.each([
    ['Action', 'Reminded', { actionType: 'reminded' }],
    ['Status', 'Failed', { status: 'failed' }],
    ['Source', 'Scheduled task', { source: 'scheduled_job' }],
  ])('updates the filters when the "%s" filter changes', async (label, option, expectedFilters) => {
    const user = userEvent.setup();
    const onFiltersChange = jest.fn();
    renderAuditTrail({ onFiltersChange });
    await user.selectOptions(screen.getByLabelText(label), option);
    expect(onFiltersChange).toHaveBeenCalledWith({ ...AUDIT_TRAIL_DEFAULT_FILTERS, ...expectedFilters });
  });

  it('updates the filters when a date is selected', async () => {
    const user = userEvent.setup();
    const onFiltersChange = jest.fn();
    renderAuditTrail({ onFiltersChange });
    await user.type(screen.getByLabelText('From'), '2026-10-01');
    expect(onFiltersChange).toHaveBeenLastCalledWith({ ...AUDIT_TRAIL_DEFAULT_FILTERS, startDate: '2026-10-01' });
  });

  it('debounces the actor search before updating the filters', async () => {
    const user = userEvent.setup();
    const onFiltersChange = jest.fn();
    renderAuditTrail({ onFiltersChange });
    await user.type(screen.getByLabelText('Actor'), 'priya');
    expect(screen.getByLabelText('Actor')).toHaveValue('priya');
    await waitFor(() => expect(onFiltersChange).toHaveBeenCalledWith({
      ...AUDIT_TRAIL_DEFAULT_FILTERS,
      actorSearch: 'priya',
    }));
    expect(onFiltersChange).toHaveBeenCalledTimes(1);
  });

  it('keeps a pending actor search when another filter changes before the debounce fires', async () => {
    const user = userEvent.setup();
    const onFiltersChange = jest.fn();
    const StatefulAuditTrail = () => {
      const [filters, setFilters] = useState(AUDIT_TRAIL_DEFAULT_FILTERS);
      const handleFiltersChange = (nextFilters) => {
        onFiltersChange(nextFilters);
        setFilters(nextFilters);
      };
      return <AuditTrail {...defaultProps} filters={filters} onFiltersChange={handleFiltersChange} />;
    };
    render(<IntlProvider locale="en"><StatefulAuditTrail /></IntlProvider>);

    await user.type(screen.getByLabelText('Actor'), 'priya');
    await user.selectOptions(screen.getByLabelText('Action'), 'Reminded');
    await waitFor(() => expect(onFiltersChange).toHaveBeenLastCalledWith({
      ...AUDIT_TRAIL_DEFAULT_FILTERS,
      actorSearch: 'priya',
      actionType: 'reminded',
    }));
  });

  it('shows a validation error when the start date is after the end date', () => {
    renderAuditTrail({
      filters: { ...AUDIT_TRAIL_DEFAULT_FILTERS, startDate: '2026-10-23', endDate: '2026-10-01' },
    });
    expect(screen.getByText('Must be on or before the "To" date.')).toBeInTheDocument();
    expect(screen.queryByText(/^Date:/)).not.toBeInTheDocument();
  });

  it('shows applied filters as removable chips', async () => {
    const user = userEvent.setup();
    const onFiltersChange = jest.fn();
    const filters = {
      actorSearch: 'priya',
      actionType: 'reminded',
      status: 'failed',
      source: 'admin_ui_single',
      startDate: '2026-10-01',
      endDate: '2026-10-23',
    };
    renderAuditTrail({ filters, onFiltersChange });
    expect(screen.getByText('Filters applied:')).toBeInTheDocument();
    expect(screen.getByText('Actor: priya')).toBeInTheDocument();
    expect(screen.getByText('Action: Reminded')).toBeInTheDocument();
    expect(screen.getByText('Status: Failed')).toBeInTheDocument();
    expect(screen.getByText('Source: Admin Portal')).toBeInTheDocument();
    expect(screen.getByText('Date: Oct 01, 2026 – Oct 23, 2026')).toBeInTheDocument();

    const removeFilterButtons = screen.getAllByRole('button', { name: 'Remove filter' });
    expect(removeFilterButtons).toHaveLength(5);
    await user.click(removeFilterButtons[4]);
    expect(onFiltersChange).toHaveBeenCalledWith({ ...filters, startDate: '', endDate: '' });
  });

  it('clears all filters', async () => {
    const user = userEvent.setup();
    const onFiltersChange = jest.fn();
    renderAuditTrail({
      filters: { ...AUDIT_TRAIL_DEFAULT_FILTERS, actionType: 'reminded', source: 'api' },
      onFiltersChange,
    });
    await user.click(screen.getByRole('button', { name: 'Clear all' }));
    expect(onFiltersChange).toHaveBeenCalledWith(AUDIT_TRAIL_DEFAULT_FILTERS);
  });

  it('hides the applied filters and "Clear all" when no filters are applied', () => {
    renderAuditTrail();
    expect(screen.queryByRole('button', { name: 'Clear all' })).not.toBeInTheDocument();
    expect(screen.queryByText('Filters applied:')).not.toBeInTheDocument();
  });
});
