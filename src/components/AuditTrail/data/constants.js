export const AUDIT_TRAIL_PAGE_SIZE = 10;

// Column accessor for the timestamp column; the only sortable column in the audit trail table.
export const AUDIT_TRAIL_TIMESTAMP_COLUMN = 'timestamp';

// Timestamps are shown on a single line in the viewer's local time zone, e.g. "28 Oct 2026, 1:01:42 PM".
export const AUDIT_TRAIL_TIMESTAMP_FORMAT = 'D MMM YYYY, h:mm:ss A';

export const AUDIT_TRAIL_DEFAULT_SORT_BY = [{ id: AUDIT_TRAIL_TIMESTAMP_COLUMN, desc: true }];

// API field used for the `ordering` query param when sorting by the timestamp column.
export const AUDIT_TRAIL_ORDERING_FIELD = 'created';

export const AUDIT_TRAIL_DEFAULT_FILTERS = {
  actorSearch: '',
  actionType: '',
  status: '',
  source: '',
  startDate: '',
  endDate: '',
};

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
