/** Outcome of an audit action (see `AUDIT_TRAIL_STATUSES`). */
export type AuditTrailStatus = 'success' | 'failed';

/** Who performed an audit action (see `AUDIT_TRAIL_ACTOR_TYPES`). */
export type AuditTrailActorType = 'admin' | 'learner' | 'system';

/** A row of the audit trail table: a single audit action, with its actor and affected learner resolved. */
export type AuditTrailRow = {
  uuid: string;
  /** ISO 8601 timestamp of the action. */
  timestamp: string;
  actionType: string;
  status: AuditTrailStatus;
  actorType?: AuditTrailActorType | string;
  actorName: string | null;
  actorEmail: string | null;
  actorLmsUserId?: number | null;
  source?: string;
  errorReason?: string | null;
  learnerName: string | null;
  learnerEmail: string | null;
};

/** The audit trail filters (see `AUDIT_TRAIL_DEFAULT_FILTERS`). Empty strings mean "not filtered". */
export type AuditTrailFilters = {
  actorSearch: string;
  actionType: string;
  status: string;
  source: string;
  /** `YYYY-MM-DD`, from `<input type="date">`. */
  startDate: string;
  /** `YYYY-MM-DD`, from `<input type="date">`. */
  endDate: string;
};

/** The `DataTable` sort state of a column. */
export type AuditTrailSortBy = { id: string; desc: boolean };

/** The `DataTable` pagination and sort state. */
export type AuditTrailTableState = {
  pageIndex: number;
  pageSize: number;
  sortBy: AuditTrailSortBy[];
};

/** The audit trail filters and `DataTable` state, applied to the rows by `applyAuditTrailTableOptions`. */
export type AuditTrailTableOptions = AuditTrailTableState & { filters: AuditTrailFilters };

/** An audit trail's loaded history, as returned by the `queryFn` passed to `useAuditTrailQuery`. */
export type AuditTrailHistory = {
  rows: AuditTrailRow[];
  /** Whether older history was left out (see `AUDIT_TRAIL_MAX_PAGES_PER_SOURCE`). */
  isTruncated: boolean;
};

/** A page of audit trail rows, as passed to `AuditTrail` as `tableData`. */
export type AuditTrailTableData = {
  results: AuditTrailRow[];
  itemCount: number;
  pageCount: number;
};

/** An (camelCased) audit action, as returned by enterprise-access or license-manager. */
export type AuditTrailAction = {
  uuid: string;
  created: string;
  actionType: string;
  actorType?: string;
  actorLmsUserId?: number | null;
  source?: string;
  errorReason?: string | null;
  learnerEmail?: string | null;
};

/** The authenticated user, from `getAuthenticatedUser()`. */
export type AuditTrailAuthenticatedUser = {
  userId?: number;
  name?: string;
  username?: string;
  email?: string;
};

/** The subset of `intl` (from `useIntl()`) used to format audit trail labels. */
export type AuditTrailIntl = {
  formatMessage: (descriptor: { id: string; defaultMessage: string; description?: string }) => string;
};

/** The paginated results fetched by `fetchPaginatedResults`. */
export type PaginatedResults<T> = {
  results: T[];
  /** Whether more pages were available than `maxPages` allowed fetching. */
  isTruncated: boolean;
};
