export const AUDIT_TRAIL_PAGE_SIZE = 10;

// Bounds on loading audit history, which is fetched up front and filtered in the browser: the page size requested
// from the audit APIs, the most API pages fetched per budget or subscription plan, and the most budgets or plans
// fetched at the same time.
export const AUDIT_TRAIL_API_PAGE_SIZE = 100;
export const AUDIT_TRAIL_MAX_PAGES_PER_SOURCE = 10;
export const AUDIT_TRAIL_MAX_CONCURRENT_REQUESTS = 3;
// The most audit history items loaded per budget or plan (e.g. for the truncation notice).
export const AUDIT_TRAIL_MAX_ITEMS_PER_SOURCE = AUDIT_TRAIL_MAX_PAGES_PER_SOURCE * AUDIT_TRAIL_API_PAGE_SIZE;

// The table data shown before the audit history has loaded.
export const AUDIT_TRAIL_EMPTY_TABLE_DATA = { results: [], itemCount: 0, pageCount: 1 };

// Column accessor for the timestamp column; the only sortable column in the audit trail table.
export const AUDIT_TRAIL_TIMESTAMP_COLUMN = 'timestamp';

export const AUDIT_TRAIL_DEFAULT_SORT_BY = [{ id: AUDIT_TRAIL_TIMESTAMP_COLUMN, desc: true }];

// Delay before the actor search is applied, so the table doesn't update on every keystroke.
export const AUDIT_TRAIL_ACTOR_SEARCH_DEBOUNCE_MS = 300;

export const AUDIT_TRAIL_DEFAULT_FILTERS = {
  actorSearch: '',
  actionType: '',
  status: '',
  source: '',
  startDate: '',
  endDate: '',
};

// enterprise-access replaces a retired learner's email with `retired_user<nonce>@retired.invalid` (see
// `LearnerContentAssignment.clear_pii()`); such emails are shown as removed learner information.
export const AUDIT_TRAIL_RETIRED_EMAIL_PATTERN = /^retired_user[^@]*@retired\.invalid$/i;

export const AUDIT_TRAIL_ACTOR_TYPES = {
  admin: 'admin',
  learner: 'learner',
  system: 'system',
};

// `action_type` values written by enterprise-access to `LearnerContentAssignmentAction`.
export const ASSIGNMENT_AUDIT_ACTION_TYPES = [
  'allocated',
  'reallocated',
  'approved',
  'notified',
  'reminded',
  'redeemed',
  'cancelled',
  'cancelled_acknowledged',
  'cancel_email_failed',
  'expired',
  'expired_acknowledged',
  'reversed',
  'errored',
  'learner_linked',
  'retired',
];

// `source` values written by enterprise-access to `LearnerContentAssignmentAction`.
export const ASSIGNMENT_AUDIT_SOURCES = [
  'admin_ui_single',
  'admin_ui_bulk_csv',
  'browse_request_approve',
  'browse_request_approve_all',
  'django_admin',
  'api',
  'signal',
  'scheduled_job',
  'celery_task',
];

// `action_type` values written by license-manager to `LicenseAction`.
export const LICENSE_AUDIT_ACTION_TYPES = [
  'assigned',
  'activated',
  'revoked',
  'renewed',
  'expired',
  'deleted',
  'snapshot_revert',
  'plan_maintenance',
];

// `source` values written by license-manager to `LicenseAction`.
export const LICENSE_AUDIT_SOURCES = [
  'admin_ui',
  'admin_api',
  'admin_api_bulk',
  'api',
  'celery_task',
  'renewal_job',
];

// Outcome of an audit trail action. The API has no status field: an action failed when it has an
// `error_reason`, or when its action type itself records a failure; otherwise it succeeded.
export const AUDIT_TRAIL_STATUSES = {
  success: 'success',
  failed: 'failed',
};

export const AUDIT_TRAIL_STATUS_OPTIONS = Object.values(AUDIT_TRAIL_STATUSES);

// Action types that record a failure even when the action has no `error_reason`.
export const AUDIT_TRAIL_FAILED_ACTION_TYPES = ['errored', 'cancel_email_failed'];
