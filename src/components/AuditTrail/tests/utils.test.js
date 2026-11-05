import dayjs from 'dayjs';

import {
  applyAuditTrailTableOptions,
  fetchPaginatedResults,
  getActionTypeLabel,
  getAuditTrailStatus,
  getSourceLabel,
  getStatusLabel,
  getUnretiredEmail,
  hasActiveAuditTrailFilters,
  isValidDateRange,
  mapWithConcurrencyLimit,
  transformActionToAuditTrailRow,
} from '../data/utils';
import {
  ASSIGNMENT_AUDIT_ACTION_TYPES,
  ASSIGNMENT_AUDIT_SOURCES,
  AUDIT_TRAIL_DEFAULT_FILTERS,
  AUDIT_TRAIL_STATUS_OPTIONS,
  LICENSE_AUDIT_ACTION_TYPES,
  LICENSE_AUDIT_SOURCES,
} from '../data/constants';

const mockIntl = { formatMessage: (message) => message.defaultMessage };

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

  it('treats retired learner emails as removed learner information', () => {
    const row = transformActionToAuditTrailRow(
      {
        ...baseAction, actorType: 'learner', actorLmsUserId: 7, learnerEmail: 'retired_user1a2b3c4d@retired.invalid',
      },
      { learnerEmail: 'retired_user1a2b3c4d@retired.invalid', learnerLmsUserId: 7 },
      authenticatedUser,
    );
    expect(row.learnerEmail).toBeNull();
    expect(row.actorEmail).toBeNull();
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

describe('getUnretiredEmail', () => {
  it.each([
    ['jane.doe@example.com', 'jane.doe@example.com'],
    ['retired_user1a2b3c4d@retired.invalid', null],
    ['RETIRED_USER@RETIRED.INVALID', null],
    // Only the exact retirement placeholder format is treated as retired.
    ['retired_user@example.com', 'retired_user@example.com'],
    [null, null],
    ['', null],
  ])('getUnretiredEmail(%s) returns %s', (email, expected) => {
    expect(getUnretiredEmail(email)).toEqual(expected);
  });
});

describe('fetchPaginatedResults', () => {
  const page = (next, results) => ({ data: { next, results } });

  it('fetches every page in order and returns the camelCased results', async () => {
    const fetchPage = jest.fn()
      .mockResolvedValueOnce(page('http://localhost/?page=2', [{ learner_email: 'a@example.com' }]))
      .mockResolvedValueOnce(page(null, [{ learner_email: 'b@example.com' }]));
    expect(await fetchPaginatedResults(fetchPage)).toEqual({
      results: [{ learnerEmail: 'a@example.com' }, { learnerEmail: 'b@example.com' }],
      isTruncated: false,
    });
    expect(fetchPage.mock.calls).toEqual([[1], [2]]);
  });

  it('stops after `maxPages` pages and reports that more pages were available', async () => {
    const fetchPage = jest.fn((pageNumber) => Promise.resolve(page('http://localhost/?page=next', [{ uuid: pageNumber }])));
    expect(await fetchPaginatedResults(fetchPage, { maxPages: 2 })).toEqual({
      results: [{ uuid: 1 }, { uuid: 2 }],
      isTruncated: true,
    });
    expect(fetchPage).toHaveBeenCalledTimes(2);
  });

  it('is not truncated when the last page is exactly `maxPages`', async () => {
    const fetchPage = jest.fn()
      .mockResolvedValueOnce(page('http://localhost/?page=2', [{ uuid: 1 }]))
      .mockResolvedValueOnce(page(null, [{ uuid: 2 }]));
    expect(await fetchPaginatedResults(fetchPage, { maxPages: 2 })).toEqual({
      results: [{ uuid: 1 }, { uuid: 2 }],
      isTruncated: false,
    });
  });

  it('returns no results for an empty response', async () => {
    const fetchPage = jest.fn().mockResolvedValue({ data: { next: null } });
    expect(await fetchPaginatedResults(fetchPage)).toEqual({ results: [], isTruncated: false });
  });

  it('does not share results between calls', async () => {
    const fetchPage = jest.fn().mockResolvedValue(page(null, [{ uuid: 'a' }]));
    expect((await fetchPaginatedResults(fetchPage)).results).toEqual([{ uuid: 'a' }]);
    expect((await fetchPaginatedResults(fetchPage)).results).toEqual([{ uuid: 'a' }]);
  });
});

describe('mapWithConcurrencyLimit', () => {
  it('maps every item in order, running at most `limit` mappers at a time', async () => {
    let running = 0;
    let maxRunning = 0;
    const mapper = jest.fn(async (item) => {
      running += 1;
      maxRunning = Math.max(maxRunning, running);
      await new Promise((resolve) => { setTimeout(resolve, 5 * (5 - item)); });
      running -= 1;
      return item * 10;
    });
    expect(await mapWithConcurrencyLimit([1, 2, 3, 4, 5], 2, mapper)).toEqual([10, 20, 30, 40, 50]);
    expect(mapper).toHaveBeenCalledTimes(5);
    expect(maxRunning).toEqual(2);
  });

  it('returns no results for no items', async () => {
    const mapper = jest.fn();
    expect(await mapWithConcurrencyLimit([], 3, mapper)).toEqual([]);
    expect(mapper).not.toHaveBeenCalled();
  });

  it('rejects when a mapper rejects', async () => {
    const mapper = jest.fn((item) => (item === 2 ? Promise.reject(new Error('oops')) : Promise.resolve(item)));
    await expect(mapWithConcurrencyLimit([1, 2, 3], 2, mapper)).rejects.toThrow('oops');
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
    ['api', 'API'],
    ['admin_api', 'Admin API'],
    ['admin_api_bulk', 'Admin API (bulk)'],
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

describe('applyAuditTrailTableOptions', () => {
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
    {
      uuid: 'e', timestamp: '2026-10-04T10:00:00Z', actionType: 'reminded', status: 'success', source: 'api', actorType: 'admin', actorName: null, actorEmail: null, actorLmsUserId: 48213,
    },
  ];
  const tableOptions = (filters = {}, tableState = {}) => ({
    filters: { ...AUDIT_TRAIL_DEFAULT_FILTERS, ...filters },
    pageIndex: 0,
    pageSize: 10,
    sortBy: [{ id: 'timestamp', desc: true }],
    ...tableState,
  });
  const getUuids = result => result.results.map(({ uuid }) => uuid);

  it('sorts newest first with a stable tie-break, or oldest first', () => {
    expect(getUuids(applyAuditTrailTableOptions(rows, tableOptions()))).toEqual(['d', 'e', 'c', 'b', 'a']);
    expect(getUuids(applyAuditTrailTableOptions(rows, tableOptions({}, { sortBy: [{ id: 'timestamp', desc: false }] }))))
      .toEqual(['a', 'b', 'c', 'e', 'd']);
  });

  it('defaults to newest first when there is no sort order', () => {
    expect(getUuids(applyAuditTrailTableOptions(rows, tableOptions({}, { sortBy: [] })))).toEqual(['d', 'e', 'c', 'b', 'a']);
  });

  it('returns the requested (zero-indexed) page of the sorted rows', () => {
    const result = applyAuditTrailTableOptions(rows, tableOptions({}, { pageIndex: 1, pageSize: 3 }));
    expect(getUuids(result)).toEqual(['b', 'a']);
    expect(result.itemCount).toEqual(5);
    expect(result.pageCount).toEqual(2);
  });

  it.each([
    [{ actionType: 'reminded' }, ['e', 'c']],
    [{ status: 'failed' }, ['b']],
    [{ status: 'success' }, ['d', 'e', 'c', 'a']],
    [{ source: 'celery_task' }, ['b']],
    [{ actorSearch: '  PRIYA ' }, ['d', 'a']],
    [{ actorSearch: 'sam@' }, ['c']],
    [{ actorSearch: 'system' }, ['b']],
    // Actors whose name couldn't be resolved can be found by the LMS user ID shown for them.
    [{ actorSearch: '48213' }, ['e']],
    [{ startDate: '2026-10-02', endDate: '2026-10-02' }, ['c', 'b']],
    [{ startDate: '2026-10-04' }, ['d', 'e']],
    [{ endDate: '2026-10-01' }, ['a']],
    // An invalid range (start after end) isn't applied.
    [{ startDate: '2026-10-05', endDate: '2026-10-01' }, ['d', 'e', 'c', 'b', 'a']],
    [{ actionType: 'cancelled', actorSearch: 'sam' }, []],
  ])('applies filters %j', (filters, expectedUuids) => {
    const result = applyAuditTrailTableOptions(rows, tableOptions(filters));
    expect(getUuids(result)).toEqual(expectedUuids);
    expect(result.itemCount).toEqual(expectedUuids.length);
  });

  it('includes the whole local start and end days of the date range', () => {
    const localDayRows = [
      { uuid: 'start', timestamp: dayjs('2026-10-02').startOf('day').toISOString(), actorType: 'system' },
      { uuid: 'end', timestamp: dayjs('2026-10-03').endOf('day').toISOString(), actorType: 'system' },
      { uuid: 'after', timestamp: dayjs('2026-10-04').startOf('day').toISOString(), actorType: 'system' },
    ];
    const result = applyAuditTrailTableOptions(localDayRows, tableOptions({ startDate: '2026-10-02', endDate: '2026-10-03' }));
    expect(getUuids(result)).toEqual(['end', 'start']);
  });

  it('returns a single empty page when nothing matches', () => {
    expect(applyAuditTrailTableOptions([], tableOptions())).toEqual({ results: [], itemCount: 0, pageCount: 1 });
  });
});

describe('filter options', () => {
  // Each filter option must be distinguishable, since filtering matches the option's exact value.
  it.each([
    ['assignment action types', ASSIGNMENT_AUDIT_ACTION_TYPES, getActionTypeLabel],
    ['license action types', LICENSE_AUDIT_ACTION_TYPES, getActionTypeLabel],
    ['assignment sources', ASSIGNMENT_AUDIT_SOURCES, getSourceLabel],
    ['license sources', LICENSE_AUDIT_SOURCES, getSourceLabel],
    ['statuses', AUDIT_TRAIL_STATUS_OPTIONS, getStatusLabel],
  ])('%s have distinct labels', (_, options, getLabel) => {
    const labels = options.map(option => getLabel(mockIntl, option));
    expect(new Set(labels).size).toEqual(options.length);
  });
});
