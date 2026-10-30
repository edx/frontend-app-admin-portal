import dayjs from 'dayjs';

import {
  applyAuditTrailQueryOptions,
  getActionTypeLabel,
  getAuditTrailQueryOptions,
  getAuditTrailStatus,
  getSourceLabel,
  getStatusLabel,
  hasActiveAuditTrailFilters,
  isValidDateRange,
  transformActionToAuditTrailRow,
} from '../data/utils';
import { AUDIT_TRAIL_DEFAULT_FILTERS } from '../data/constants';

const mockIntl = { formatMessage: (message) => message.defaultMessage };

const defaultTableState = {
  pageIndex: 0,
  pageSize: 10,
  sortBy: [{ id: 'timestamp', desc: true }],
};

describe('getAuditTrailQueryOptions', () => {
  it('returns pagination and newest-first ordering when no filters are applied', () => {
    expect(getAuditTrailQueryOptions({ filters: AUDIT_TRAIL_DEFAULT_FILTERS, ...defaultTableState })).toEqual({
      page: 1,
      pageSize: 10,
      ordering: '-created',
    });
  });

  it('returns oldest-first ordering and a 1-indexed page', () => {
    const options = getAuditTrailQueryOptions({
      filters: AUDIT_TRAIL_DEFAULT_FILTERS,
      pageIndex: 2,
      pageSize: 10,
      sortBy: [{ id: 'timestamp', desc: false }],
    });
    expect(options.page).toEqual(3);
    expect(options.ordering).toEqual('created');
  });

  it('defaults to newest first when there is no sort order', () => {
    const options = getAuditTrailQueryOptions({
      filters: AUDIT_TRAIL_DEFAULT_FILTERS,
      ...defaultTableState,
      sortBy: [],
    });
    expect(options.ordering).toEqual('-created');
  });

  it('includes every applied filter, with inclusive local-day date boundaries', () => {
    const options = getAuditTrailQueryOptions({
      filters: {
        actorSearch: '  priya ',
        actionType: 'reminded',
        status: 'failed',
        source: 'admin_ui_single',
        startDate: '2026-10-01',
        endDate: '2026-10-23',
      },
      ...defaultTableState,
    });
    expect(options).toEqual({
      page: 1,
      pageSize: 10,
      ordering: '-created',
      actorSearch: 'priya',
      actionType: 'reminded',
      status: 'failed',
      source: 'admin_ui_single',
      createdAfter: dayjs('2026-10-01').startOf('day').toISOString(),
      createdBefore: dayjs('2026-10-23').endOf('day').toISOString(),
    });
  });

  it('omits the date range when the start date is after the end date', () => {
    const options = getAuditTrailQueryOptions({
      filters: { ...AUDIT_TRAIL_DEFAULT_FILTERS, startDate: '2026-10-23', endDate: '2026-10-01' },
      ...defaultTableState,
    });
    expect(options.createdAfter).toBeUndefined();
    expect(options.createdBefore).toBeUndefined();
  });

  it('supports an open-ended date range', () => {
    const options = getAuditTrailQueryOptions({
      filters: { ...AUDIT_TRAIL_DEFAULT_FILTERS, endDate: '2026-10-01' },
      ...defaultTableState,
    });
    expect(options.createdAfter).toBeUndefined();
    expect(options.createdBefore).toEqual(dayjs('2026-10-01').endOf('day').toISOString());
  });
});

describe('transformActionToAuditTrailRow', () => {
  const owner = { learnerEmail: 'jane.doe@example.com', learnerLmsUserId: 7 };
  const authenticatedUser = {
    userId: 21, name: 'Priya Sharma', username: 'priya', email: 'priya.sharma@example.com',
  };
  const baseAction = {
    uuid: 'action-1',
    created: '2026-10-15T10:30:00Z',
    actionType: 'reminded',
    actorType: 'admin',
    actorLmsUserId: 21,
    source: 'api',
    errorReason: 'email_error',
    learnerEmail: null,
    metadata: { ignored: true },
  };

  it('maps the action and resolves the authenticated admin as the actor', () => {
    expect(transformActionToAuditTrailRow(baseAction, owner, authenticatedUser)).toEqual({
      uuid: 'action-1',
      timestamp: '2026-10-15T10:30:00Z',
      actionType: 'reminded',
      status: 'failed',
      actorType: 'admin',
      actorName: 'Priya Sharma',
      actorEmail: 'priya.sharma@example.com',
      actorLmsUserId: 21,
      source: 'api',
      errorReason: 'email_error',
      learnerName: null,
      learnerEmail: 'jane.doe@example.com',
    });
  });

  it('resolves the owning learner as the actor', () => {
    const row = transformActionToAuditTrailRow(
      { ...baseAction, actorType: 'learner', actorLmsUserId: 7 },
      owner,
      authenticatedUser,
    );
    expect(row.actorName).toBeNull();
    expect(row.actorEmail).toEqual('jane.doe@example.com');
  });

  it('does not resolve other actors, and prefers the learner email recorded on the action', () => {
    const row = transformActionToAuditTrailRow(
      { ...baseAction, actorLmsUserId: 99, learnerEmail: 'recorded@example.com' },
      owner,
      undefined,
    );
    expect(row.actorName).toBeNull();
    expect(row.actorEmail).toBeNull();
    expect(row.learnerEmail).toEqual('recorded@example.com');
  });
});

describe('getAuditTrailStatus', () => {
  it.each([
    [{ actionType: 'reminded', errorReason: null }, 'success'],
    [{ actionType: 'notified', errorReason: undefined }, 'success'],
    [{ actionType: 'reminded', errorReason: 'email_error' }, 'failed'],
    [{ actionType: 'cancel_email_failed', errorReason: null }, 'failed'],
    [{ actionType: 'errored', errorReason: null }, 'failed'],
  ])('getAuditTrailStatus(%j) returns %s', (action, expected) => {
    expect(getAuditTrailStatus(action)).toEqual(expected);
  });
});

describe('labels', () => {
  it.each([
    ['reminded', 'Reminded'],
    ['learner_linked', 'Learner linked'],
    ['cancel_email_failed', 'Cancellation email failed'],
    ['cancelled_acknowledged', 'Cancellation acknowledged'],
    ['expired_acknowledged', 'Expiration acknowledged'],
    ['plan_maintenance', 'Plan maintenance'],
    ['some_new_action', 'Some new action'],
  ])('getActionTypeLabel(%s) returns %s', (actionType, expected) => {
    expect(getActionTypeLabel(mockIntl, actionType)).toEqual(expected);
  });

  it.each([
    ['admin_ui_single', 'Admin Portal'],
    ['admin_ui', 'Admin Portal'],
    ['scheduled_job', 'Scheduled task'],
    ['renewal_job', 'Plan renewal'],
    ['some_new_source', 'Some new source'],
  ])('getSourceLabel(%s) returns %s', (source, expected) => {
    expect(getSourceLabel(mockIntl, source)).toEqual(expected);
  });

  it.each([
    ['success', 'Success'],
    ['failed', 'Failed'],
  ])('getStatusLabel(%s) returns %s', (status, expected) => {
    expect(getStatusLabel(mockIntl, status)).toEqual(expected);
  });

  it('returns an empty label for missing values', () => {
    expect(getActionTypeLabel(mockIntl, null)).toEqual('');
    expect(getStatusLabel(mockIntl, '')).toEqual('');
    expect(getSourceLabel(mockIntl, undefined)).toEqual('');
  });
});

describe('filter helpers', () => {
  it.each([
    ['', '', true],
    ['2026-10-01', '', true],
    ['', '2026-10-01', true],
    ['2026-10-01', '2026-10-01', true],
    ['2026-10-02', '2026-10-01', false],
  ])('isValidDateRange(%s, %s) returns %s', (startDate, endDate, expected) => {
    expect(isValidDateRange(startDate, endDate)).toEqual(expected);
  });

  it('hasActiveAuditTrailFilters detects applied filters', () => {
    expect(hasActiveAuditTrailFilters(AUDIT_TRAIL_DEFAULT_FILTERS)).toEqual(false);
    expect(hasActiveAuditTrailFilters({ ...AUDIT_TRAIL_DEFAULT_FILTERS, source: 'api' })).toEqual(true);
  });
});

describe('applyAuditTrailQueryOptions', () => {
  const rows = [
    {
      uuid: 'a', timestamp: '2026-10-01T10:00:00Z', actionType: 'allocated', status: 'success', source: 'api', actorType: 'admin', actorName: 'Priya Sharma', actorEmail: 'priya@example.com',
    },
    {
      uuid: 'b', timestamp: '2026-10-02T10:00:00Z', actionType: 'notified', status: 'failed', source: 'celery_task', actorType: 'system',
    },
    {
      uuid: 'c', timestamp: '2026-10-02T10:00:00Z', actionType: 'reminded', status: 'success', source: 'api', actorType: 'admin', actorName: 'Sam Lee', actorEmail: 'sam@example.com',
    },
    {
      uuid: 'd', timestamp: '2026-10-05T10:00:00Z', actionType: 'cancelled', status: 'success', source: 'api', actorType: 'admin', actorName: 'Priya Sharma', actorEmail: 'priya@example.com',
    },
  ];
  const baseOptions = { page: 1, pageSize: 10, ordering: '-created' };
  const getUuids = result => result.results.map(({ uuid }) => uuid);

  it('sorts newest first with a stable tie-break, or oldest first', () => {
    expect(getUuids(applyAuditTrailQueryOptions(rows, baseOptions))).toEqual(['d', 'c', 'b', 'a']);
    expect(getUuids(applyAuditTrailQueryOptions(rows, { ...baseOptions, ordering: 'created' })))
      .toEqual(['a', 'b', 'c', 'd']);
  });

  it('paginates the sorted rows', () => {
    const result = applyAuditTrailQueryOptions(rows, { ...baseOptions, page: 2, pageSize: 3 });
    expect(getUuids(result)).toEqual(['a']);
    expect(result.itemCount).toEqual(4);
    expect(result.pageCount).toEqual(2);
  });

  it.each([
    [{ actionType: 'reminded' }, ['c']],
    [{ status: 'failed' }, ['b']],
    [{ status: 'success' }, ['d', 'c', 'a']],
    [{ source: 'celery_task' }, ['b']],
    [{ actorSearch: 'PRIYA' }, ['d', 'a']],
    [{ actorSearch: 'sam@' }, ['c']],
    [{ actorSearch: 'system' }, ['b']],
    [{ createdAfter: '2026-10-02T00:00:00.000Z', createdBefore: '2026-10-02T23:59:59.999Z' }, ['c', 'b']],
    [{ actionType: 'cancelled', actorSearch: 'sam' }, []],
  ])('applies filters %j', (filters, expectedUuids) => {
    const result = applyAuditTrailQueryOptions(rows, { ...baseOptions, ...filters });
    expect(getUuids(result)).toEqual(expectedUuids);
    expect(result.itemCount).toEqual(expectedUuids.length);
  });

  it('returns a single empty page when nothing matches', () => {
    expect(applyAuditTrailQueryOptions([], baseOptions)).toEqual({ results: [], itemCount: 0, pageCount: 1 });
  });
});
