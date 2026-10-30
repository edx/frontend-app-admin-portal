import dayjs from 'dayjs';

import { capitalizeFirstLetter } from '../../../utils';
import {
  AUDIT_TRAIL_ACTOR_TYPES,
  AUDIT_TRAIL_FAILED_ACTION_TYPES,
  AUDIT_TRAIL_ORDERING_FIELD,
  AUDIT_TRAIL_STATUSES,
  AUDIT_TRAIL_TIMESTAMP_COLUMN,
} from './constants';
import { ACTION_TYPE_MESSAGES, SOURCE_MESSAGES, STATUS_MESSAGES } from './messages';

/**
 * Returns a human readable label for an enum value (e.g. `learner_linked` => `Learner linked`). Used as a
 * fallback so that unknown action types or sources returned by the API still render.
 */
const humanizeEnumValue = (value) => capitalizeFirstLetter(value.replace(/_/g, ' '));

/**
 * Returns the translated label for an enum value from the given messages map, falling back to a humanized
 * label for values without a message (e.g. a new value added by the backend).
 */
const getEnumLabel = (intl, enumMessages, value) => {
  if (!value) {
    return '';
  }
  const message = enumMessages[value];
  return message ? intl.formatMessage(message) : humanizeEnumValue(value);
};

export const getActionTypeLabel = (intl, actionType) => getEnumLabel(intl, ACTION_TYPE_MESSAGES, actionType);

export const getSourceLabel = (intl, source) => getEnumLabel(intl, SOURCE_MESSAGES, source);

export const getStatusLabel = (intl, status) => getEnumLabel(intl, STATUS_MESSAGES, status);

/**
 * Returns whether an audit action succeeded or failed (see `AUDIT_TRAIL_STATUSES`).
 */
export const getAuditTrailStatus = ({ actionType, errorReason }) => (
  errorReason || AUDIT_TRAIL_FAILED_ACTION_TYPES.includes(actionType)
    ? AUDIT_TRAIL_STATUSES.failed
    : AUDIT_TRAIL_STATUSES.success
);

/**
 * Returns the abbreviated name of the viewer's local time zone (e.g. "EDT", "GMT+5:30").
 */
export const getLocalTimeZoneName = () => {
  const timeZonePart = new Intl.DateTimeFormat(undefined, { timeZoneName: 'short' })
    .formatToParts(new Date())
    .find(part => part.type === 'timeZoneName');
  return timeZonePart?.value || '';
};

/**
 * A date range is invalid only when both dates are given and the start date is after the end date.
 * Dates are `YYYY-MM-DD` strings from `<input type="date">`, so they compare lexicographically.
 */
export const isValidDateRange = (startDate, endDate) => !(startDate && endDate && startDate > endDate);

export const hasActiveAuditTrailFilters = (filters) => Object.values(filters).some(Boolean);

/**
 * Converts the audit trail filters and `DataTable` state into the (camelCased) query options applied by
 * `applyAuditTrailQueryOptions`. Only options with a value are included.
 *
 * Date filters are interpreted in the viewer's local time zone and are inclusive: the start date is
 * converted to the start of that local day, and the end date to the end of that local day.
 */
export const getAuditTrailQueryOptions = ({
  filters,
  pageIndex,
  pageSize,
  sortBy,
}) => {
  const timestampSort = sortBy?.find(({ id }) => id === AUDIT_TRAIL_TIMESTAMP_COLUMN);
  const isNewestFirst = timestampSort ? timestampSort.desc : true;
  const options = {
    page: pageIndex + 1, // `DataTable` uses zero-indexed pages
    pageSize,
    ordering: isNewestFirst ? `-${AUDIT_TRAIL_ORDERING_FIELD}` : AUDIT_TRAIL_ORDERING_FIELD,
  };

  const actorSearch = filters.actorSearch?.trim();
  if (actorSearch) {
    options.actorSearch = actorSearch;
  }
  if (filters.actionType) {
    options.actionType = filters.actionType;
  }
  if (filters.status) {
    options.status = filters.status;
  }
  if (filters.source) {
    options.source = filters.source;
  }
  if (isValidDateRange(filters.startDate, filters.endDate)) {
    if (filters.startDate) {
      options.createdAfter = dayjs(filters.startDate).startOf('day').toISOString();
    }
    if (filters.endDate) {
      options.createdBefore = dayjs(filters.endDate).endOf('day').toISOString();
    }
  }
  return options;
};

const matchesActorSearch = (row, actorSearch, systemActorLabel) => {
  const query = actorSearch.toLowerCase();
  const searchableValues = [row.actorName, row.actorEmail];
  if (row.actorType === AUDIT_TRAIL_ACTOR_TYPES.system) {
    searchableValues.push(systemActorLabel);
  }
  return searchableValues.some(value => value?.toLowerCase().includes(query));
};

/**
 * Applies the audit trail query options (see `getAuditTrailQueryOptions`) to an in-memory list of audit trail
 * rows: filters, sorts by timestamp (with a stable tie-break on `uuid`) and returns the requested page. Used when
 * the backend API returns every audit action at once rather than a filtered, sorted page of them.
 */
export const applyAuditTrailQueryOptions = (rows, queryOptions, { systemActorLabel = 'System' } = {}) => {
  const {
    page,
    pageSize,
    ordering,
    actorSearch,
    actionType,
    status,
    source,
    createdAfter,
    createdBefore,
  } = queryOptions;
  const isNewestFirst = ordering !== AUDIT_TRAIL_ORDERING_FIELD;
  // Timestamps are ISO 8601 strings, so `Date.parse` is used rather than creating a `dayjs` object per comparison.
  const createdAfterTime = createdAfter ? Date.parse(createdAfter) : null;
  const createdBeforeTime = createdBefore ? Date.parse(createdBefore) : null;

  const filteredRows = rows
    .filter(row => !actionType || row.actionType === actionType)
    .filter(row => !status || row.status === status)
    .filter(row => !source || row.source === source)
    .filter(row => !actorSearch || matchesActorSearch(row, actorSearch, systemActorLabel))
    .filter(row => createdAfterTime === null || Date.parse(row.timestamp) >= createdAfterTime)
    .filter(row => createdBeforeTime === null || Date.parse(row.timestamp) <= createdBeforeTime)
    .sort((a, b) => {
      const comparison = Date.parse(a.timestamp) - Date.parse(b.timestamp)
        || (a.uuid || '').localeCompare(b.uuid || '');
      return isNewestFirst ? -comparison : comparison;
    });

  const startIndex = (page - 1) * pageSize;
  return {
    results: filteredRows.slice(startIndex, startIndex + pageSize),
    itemCount: filteredRows.length,
    pageCount: Math.ceil(filteredRows.length / pageSize) || 1,
  };
};

/**
 * Transforms a single (camelCased) audit action, as nested in an enterprise-access content assignment or a
 * license-manager license, into an audit trail table row.
 *
 * Audit actions only identify the actor by LMS user ID, so the actor's name/email is resolved only when it is
 * known in the Admin Portal: the currently authenticated admin, or the learner that owns the record (e.g. a
 * redemption or activation). Otherwise, the audit trail shows the actor's role and LMS user ID.
 *
 * @param {Object} action The audit action.
 * @param {Object} owner The learner that owns the assignment/license: `{ learnerEmail, learnerLmsUserId }`.
 * @param {Object} [authenticatedUser] The authenticated user, from `getAuthenticatedUser()`.
 */
export const transformActionToAuditTrailRow = (action, { learnerEmail, learnerLmsUserId }, authenticatedUser) => {
  const affectedLearnerEmail = action.learnerEmail || learnerEmail || null;
  let actorName = null;
  let actorEmail = null;
  if (action.actorLmsUserId && action.actorLmsUserId === authenticatedUser?.userId) {
    actorName = authenticatedUser.name || authenticatedUser.username || null;
    actorEmail = authenticatedUser.email || null;
  } else if (
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
