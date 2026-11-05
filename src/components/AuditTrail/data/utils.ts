import dayjs from 'dayjs';
import { camelCaseObject } from '@edx/frontend-platform/utils';

import { capitalizeFirstLetter } from '../../../utils';
import {
  AUDIT_TRAIL_ACTOR_TYPES,
  AUDIT_TRAIL_FAILED_ACTION_TYPES,
  AUDIT_TRAIL_RETIRED_EMAIL_PATTERN,
  AUDIT_TRAIL_STATUSES,
  AUDIT_TRAIL_TIMESTAMP_COLUMN,
} from './constants';
import { ACTION_TYPE_MESSAGES, SOURCE_MESSAGES, STATUS_MESSAGES } from './messages';
import type {
  AuditTrailAction,
  AuditTrailAuthenticatedUser,
  AuditTrailFilters,
  AuditTrailIntl,
  AuditTrailRow,
  AuditTrailStatus,
  AuditTrailTableData,
  AuditTrailTableOptions,
  PaginatedResults,
} from './types';

type EnumMessages = Record<string, Parameters<AuditTrailIntl['formatMessage']>[0]>;

/**
 * Returns a human readable label for an enum value (e.g. `learner_linked` => `Learner linked`). Used as a
 * fallback so that unknown action types or sources returned by the API still render.
 */
const humanizeEnumValue = (value: string): string => capitalizeFirstLetter(value.replace(/_/g, ' '));

/**
 * Returns the translated label for an enum value from the given messages map, falling back to a humanized
 * label for values without a message (e.g. a new value added by the backend).
 */
const getEnumLabel = (intl: AuditTrailIntl, enumMessages: EnumMessages, value?: string | null): string => {
  if (!value) {
    return '';
  }
  const message = enumMessages[value];
  return message ? intl.formatMessage(message) : humanizeEnumValue(value);
};

export const getActionTypeLabel = (intl: AuditTrailIntl, actionType?: string | null): string => (
  getEnumLabel(intl, ACTION_TYPE_MESSAGES, actionType)
);

export const getSourceLabel = (intl: AuditTrailIntl, source?: string | null): string => (
  getEnumLabel(intl, SOURCE_MESSAGES, source)
);

export const getStatusLabel = (intl: AuditTrailIntl, status?: string | null): string => (
  getEnumLabel(intl, STATUS_MESSAGES, status)
);

/**
 * Returns whether an audit action succeeded or failed (see `AUDIT_TRAIL_STATUSES`).
 */
export const getAuditTrailStatus = (
  { actionType, errorReason }: Pick<AuditTrailAction, 'actionType' | 'errorReason'>,
): AuditTrailStatus => (
  (errorReason || AUDIT_TRAIL_FAILED_ACTION_TYPES.includes(actionType)
    ? AUDIT_TRAIL_STATUSES.failed
    : AUDIT_TRAIL_STATUSES.success) as AuditTrailStatus
);

/**
 * Returns the abbreviated name of the viewer's local time zone (e.g. "EDT", "GMT+5:30").
 */
export const getLocalTimeZoneName = (): string => {
  const timeZonePart = new Intl.DateTimeFormat(undefined, { timeZoneName: 'short' })
    .formatToParts(new Date())
    .find(part => part.type === 'timeZoneName');
  return timeZonePart?.value || '';
};

/**
 * A date range is invalid only when both dates are given and the start date is after the end date.
 * Dates are `YYYY-MM-DD` strings from `<input type="date">`, so they compare lexicographically.
 */
export const isValidDateRange = (startDate?: string, endDate?: string): boolean => (
  !(startDate && endDate && startDate > endDate)
);

export const hasActiveAuditTrailFilters = (filters: AuditTrailFilters): boolean => Object.values(filters).some(Boolean);

/**
 * Whether a row's actor matches the actor search: its name or email, "System" for system actions, or the LMS user
 * ID shown for actors whose name couldn't be resolved.
 */
const matchesActorSearch = (row: AuditTrailRow, actorSearch: string, systemActorLabel: string): boolean => {
  const query = actorSearch.toLowerCase();
  const searchableValues: (string | null)[] = [row.actorName, row.actorEmail];
  if (row.actorType === AUDIT_TRAIL_ACTOR_TYPES.system) {
    searchableValues.push(systemActorLabel);
  } else if (!row.actorName && !row.actorEmail && row.actorLmsUserId) {
    searchableValues.push(String(row.actorLmsUserId));
  }
  return searchableValues.some(value => value?.toLowerCase().includes(query));
};

/**
 * Applies the audit trail filters and `DataTable` state to the audit trail rows, which are loaded up front: filters
 * them, sorts them by timestamp (with a stable tie-break on `uuid`) and returns the requested page.
 *
 * Date filters are interpreted in the viewer's local time zone and are inclusive: the start date from the start of
 * that local day, and the end date until the end of that local day. An invalid range (start after end) isn't applied.
 */
export const applyAuditTrailTableOptions = (
  rows: AuditTrailRow[],
  {
    filters,
    pageIndex,
    pageSize,
    sortBy,
  }: AuditTrailTableOptions,
  { systemActorLabel = 'System' }: { systemActorLabel?: string } = {},
): AuditTrailTableData => {
  const {
    actionType,
    status,
    source,
    startDate,
    endDate,
  } = filters;
  const actorSearch = filters.actorSearch.trim();
  const timestampSort = sortBy.find(({ id }) => id === AUDIT_TRAIL_TIMESTAMP_COLUMN);
  const isNewestFirst = timestampSort ? timestampSort.desc : true;
  const hasValidDateRange = isValidDateRange(startDate, endDate);
  const startTime = hasValidDateRange && startDate ? dayjs(startDate).startOf('day').valueOf() : null;
  const endTime = hasValidDateRange && endDate ? dayjs(endDate).endOf('day').valueOf() : null;

  // Timestamps are ISO 8601 strings, so `Date.parse` is used rather than creating a `dayjs` object per comparison.
  const filteredRows = rows
    .filter(row => !actionType || row.actionType === actionType)
    .filter(row => !status || row.status === status)
    .filter(row => !source || row.source === source)
    .filter(row => !actorSearch || matchesActorSearch(row, actorSearch, systemActorLabel))
    .filter(row => startTime === null || Date.parse(row.timestamp) >= startTime)
    .filter(row => endTime === null || Date.parse(row.timestamp) <= endTime)
    .sort((a, b) => {
      const comparison = Date.parse(a.timestamp) - Date.parse(b.timestamp)
        || (a.uuid || '').localeCompare(b.uuid || '');
      return isNewestFirst ? -comparison : comparison;
    });

  const startIndex = pageIndex * pageSize;
  return {
    results: filteredRows.slice(startIndex, startIndex + pageSize),
    itemCount: filteredRows.length,
    pageCount: Math.ceil(filteredRows.length / pageSize) || 1,
  };
};

/**
 * Returns the email, or `null` when it's missing or a retired learner's placeholder email (see
 * `AUDIT_TRAIL_RETIRED_EMAIL_PATTERN`), so that retired learner information is shown as removed.
 */
export const getUnretiredEmail = (email?: string | null): string | null => (
  email && !AUDIT_TRAIL_RETIRED_EMAIL_PATTERN.test(email) ? email : null
);

/**
 * Fetches the pages of a paginated API (`{ results, next }` responses) in order, until a page has no `next` link
 * or `maxPages` pages have been fetched, and returns their (camelCased) results.
 *
 * @param fetchPage Called with a 1-indexed page number; returns the API response for that page.
 * @param options.maxPages The most pages to fetch. `isTruncated` is true when more pages were available.
 */
export const fetchPaginatedResults = async <T = any>(
  fetchPage: (page: number) => Promise<{ data: unknown }>,
  { maxPages = Infinity }: { maxPages?: number } = {},
): Promise<PaginatedResults<T>> => {
  const results: T[] = [];
  const fetchFromPage = async (page: number): Promise<PaginatedResults<T>> => {
    const response = await fetchPage(page);
    const { results: pageResults = [], next } = camelCaseObject(response.data);
    results.push(...pageResults);
    if (!next) {
      return { results, isTruncated: false };
    }
    if (page >= maxPages) {
      return { results, isTruncated: true };
    }
    return fetchFromPage(page + 1);
  };
  return fetchFromPage(1);
};

/**
 * Like `Promise.all(items.map(mapper))`, but runs at most `limit` mappers at a time. Results keep the order of
 * `items`; the returned promise rejects as soon as any mapper rejects.
 */
export const mapWithConcurrencyLimit = async <T, R>(
  items: T[],
  limit: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> => {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;
  const runNext = async (): Promise<void> => {
    if (nextIndex >= items.length) {
      return;
    }
    const index = nextIndex;
    nextIndex += 1;
    results[index] = await mapper(items[index]);
    await runNext();
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, runNext));
  return results;
};

/**
 * Transforms a single (camelCased) audit action, as nested in an enterprise-access content assignment or a
 * license-manager license, into an audit trail table row.
 *
 * Audit actions only identify the actor by LMS user ID, so the actor's name/email is resolved only when it is
 * known in the Admin Portal: the currently authenticated admin, or the learner that owns the record (e.g. a
 * redemption or activation). Otherwise, the audit trail shows the actor's role and LMS user ID.
 *
 * @param action The audit action.
 * @param owner The learner that owns the assignment/license.
 * @param authenticatedUser The authenticated user, from `getAuthenticatedUser()`.
 */
export const transformActionToAuditTrailRow = (
  action: AuditTrailAction,
  { learnerEmail, learnerLmsUserId }: { learnerEmail?: string | null, learnerLmsUserId?: number | null },
  authenticatedUser?: AuditTrailAuthenticatedUser | null,
): AuditTrailRow => {
  const affectedLearnerEmail = getUnretiredEmail(action.learnerEmail) || getUnretiredEmail(learnerEmail);
  let actorName: string | null = null;
  let actorEmail: string | null = null;
  if (authenticatedUser && action.actorLmsUserId && action.actorLmsUserId === authenticatedUser.userId) {
    actorName = authenticatedUser.name || authenticatedUser.username || null;
    actorEmail = authenticatedUser.email || null;
  } else if (
    // A learner actor is always the learner that owns the record: enterprise-access records learner actions only
    // for the assignment's own learner (redeeming it, or acknowledging its cancellation or expiration), and
    // license-manager only for the license's own learner (activating it). Their actor IDs aren't compared, since
    // license-manager's actor ID isn't an LMS user ID.
    action.actorType === AUDIT_TRAIL_ACTOR_TYPES.learner
    || (action.actorLmsUserId && action.actorLmsUserId === learnerLmsUserId)
  ) {
    actorEmail = affectedLearnerEmail;
  }
  return {
    uuid: action.uuid,
    timestamp: action.created,
    actionType: action.actionType,
    status: getAuditTrailStatus(action),
    actorType: action.actorType,
    actorName,
    actorEmail,
    actorLmsUserId: action.actorLmsUserId,
    source: action.source,
    errorReason: action.errorReason,
    learnerName: null,
    learnerEmail: affectedLearnerEmail,
  };
};
