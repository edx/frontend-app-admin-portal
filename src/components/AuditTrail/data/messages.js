import { defineMessages } from '@edx/frontend-platform/i18n';

const messages = defineMessages({
  heading: {
    id: 'admin.portal.audit.trail.heading',
    defaultMessage: 'Audit trail',
    description: 'Heading for the audit trail section.',
  },
  timeZoneNote: {
    id: 'admin.portal.audit.trail.time.zone.note',
    defaultMessage: 'Times shown in your local time zone ({timeZone}).',
    description: 'Note explaining that audit trail timestamps are displayed in the viewer\'s local time zone.',
  },
  sortNewestFirst: {
    id: 'admin.portal.audit.trail.sort.newest.first',
    defaultMessage: 'Sort: Newest first',
    description: 'Label for the sort toggle button when the audit trail is sorted newest first.',
  },
  sortOldestFirst: {
    id: 'admin.portal.audit.trail.sort.oldest.first',
    defaultMessage: 'Sort: Oldest first',
    description: 'Label for the sort toggle button when the audit trail is sorted oldest first.',
  },
  // Table columns
  columnTimestamp: {
    id: 'admin.portal.audit.trail.column.timestamp',
    defaultMessage: 'Timestamp',
    description: 'Column header for the timestamp column in the audit trail table.',
  },
  columnActionType: {
    id: 'admin.portal.audit.trail.column.action.type',
    defaultMessage: 'Action',
    description: 'Column header for the action type column in the audit trail table.',
  },
  columnStatus: {
    id: 'admin.portal.audit.trail.column.status',
    defaultMessage: 'Status',
    description: 'Column header for the status (success or failed) column in the audit trail table.',
  },
  columnActor: {
    id: 'admin.portal.audit.trail.column.actor',
    defaultMessage: 'Actor',
    description: 'Column header for the actor column in the audit trail table.',
  },
  columnSource: {
    id: 'admin.portal.audit.trail.column.source',
    defaultMessage: 'Source',
    description: 'Column header for the source column in the audit trail table.',
  },
  columnAffectedLearner: {
    id: 'admin.portal.audit.trail.column.affected.learner',
    defaultMessage: 'Affected learner',
    description: 'Column header for the affected learner column in the audit trail table.',
  },
  // Filters
  filterActorLabel: {
    id: 'admin.portal.audit.trail.filter.actor.label',
    defaultMessage: 'Actor',
    description: 'Label for the actor search filter in the audit trail.',
  },
  filterActorPlaceholder: {
    id: 'admin.portal.audit.trail.filter.actor.placeholder',
    defaultMessage: 'Search by name or email',
    description: 'Placeholder for the actor search filter in the audit trail.',
  },
  filterActionTypeLabel: {
    id: 'admin.portal.audit.trail.filter.action.type.label',
    defaultMessage: 'Action',
    description: 'Label for the action type filter in the audit trail.',
  },
  filterActionTypeAll: {
    id: 'admin.portal.audit.trail.filter.action.type.all',
    defaultMessage: 'All action types',
    description: 'Default option for the action type filter in the audit trail.',
  },
  filterStatusLabel: {
    id: 'admin.portal.audit.trail.filter.status.label',
    defaultMessage: 'Status',
    description: 'Label for the status filter in the audit trail.',
  },
  filterStatusAll: {
    id: 'admin.portal.audit.trail.filter.status.all',
    defaultMessage: 'All statuses',
    description: 'Default option for the status filter in the audit trail.',
  },
  filterSourceLabel: {
    id: 'admin.portal.audit.trail.filter.source.label',
    defaultMessage: 'Source',
    description: 'Label for the source filter in the audit trail.',
  },
  filterSourceAll: {
    id: 'admin.portal.audit.trail.filter.source.all',
    defaultMessage: 'All sources',
    description: 'Default option for the source filter in the audit trail.',
  },
  filterStartDateLabel: {
    id: 'admin.portal.audit.trail.filter.start.date.label',
    defaultMessage: 'From',
    description: 'Label for the start date filter in the audit trail.',
  },
  filterEndDateLabel: {
    id: 'admin.portal.audit.trail.filter.end.date.label',
    defaultMessage: 'To',
    description: 'Label for the end date filter in the audit trail.',
  },
  filterStartDateAfterEndDate: {
    id: 'admin.portal.audit.trail.filter.start.date.after.end.date',
    defaultMessage: 'Must be on or before the "To" date.',
    description: 'Validation error shown when the audit trail start date is after the end date.',
  },
  clearAllFilters: {
    id: 'admin.portal.audit.trail.filter.clear.all',
    defaultMessage: 'Clear all',
    description: 'Button to clear all audit trail filters.',
  },
  filtersApplied: {
    id: 'admin.portal.audit.trail.filters.applied',
    defaultMessage: 'Filters applied:',
    description: 'Label shown before the list of applied audit trail filters.',
  },
  removeFilter: {
    id: 'admin.portal.audit.trail.filter.remove',
    defaultMessage: 'Remove filter',
    description: 'Accessible label for the button that removes a single applied audit trail filter.',
  },
  appliedFilterActor: {
    id: 'admin.portal.audit.trail.applied.filter.actor',
    defaultMessage: 'Actor: {value}',
    description: 'Chip label for an applied actor filter in the audit trail.',
  },
  appliedFilterActionType: {
    id: 'admin.portal.audit.trail.applied.filter.action.type',
    defaultMessage: 'Action: {value}',
    description: 'Chip label for an applied action type filter in the audit trail.',
  },
  appliedFilterStatus: {
    id: 'admin.portal.audit.trail.applied.filter.status',
    defaultMessage: 'Status: {value}',
    description: 'Chip label for an applied status filter in the audit trail.',
  },
  appliedFilterSource: {
    id: 'admin.portal.audit.trail.applied.filter.source',
    defaultMessage: 'Source: {value}',
    description: 'Chip label for an applied source filter in the audit trail.',
  },
  appliedFilterDateRange: {
    id: 'admin.portal.audit.trail.applied.filter.date.range',
    defaultMessage: 'Date: {startDate} – {endDate}',
    description: 'Chip label for an applied date range filter in the audit trail.',
  },
  appliedFilterStartDate: {
    id: 'admin.portal.audit.trail.applied.filter.start.date',
    defaultMessage: 'Date: from {startDate}',
    description: 'Chip label for an applied start date filter (with no end date) in the audit trail.',
  },
  appliedFilterEndDate: {
    id: 'admin.portal.audit.trail.applied.filter.end.date',
    defaultMessage: 'Date: until {endDate}',
    description: 'Chip label for an applied end date filter (with no start date) in the audit trail.',
  },
  // States
  loading: {
    id: 'admin.portal.audit.trail.loading',
    defaultMessage: 'Loading audit history...',
    description: 'Screen reader text shown while the audit trail is loading.',
  },
  emptyNoHistory: {
    id: 'admin.portal.audit.trail.empty.no.history',
    defaultMessage: 'No audit history available',
    description: 'Empty state message when there are no audit trail records.',
  },
  emptyNoFilterResults: {
    id: 'admin.portal.audit.trail.empty.no.filter.results',
    defaultMessage: 'No events match these filters',
    description: 'Empty state message when no audit trail records match the applied filters.',
  },
  errorHeading: {
    id: 'admin.portal.audit.trail.error.heading',
    defaultMessage: 'We couldn\'t load the audit history',
    description: 'Heading for the error alert shown when the audit trail fails to load.',
  },
  errorDescription: {
    id: 'admin.portal.audit.trail.error.description',
    defaultMessage: 'Something went wrong while loading the audit history. Please try again.',
    description: 'Description for the error alert shown when the audit trail fails to load.',
  },
  errorRetry: {
    id: 'admin.portal.audit.trail.error.retry',
    defaultMessage: 'Try again',
    description: 'Button to retry loading the audit trail after an error.',
  },
  // Actor and learner display
  actorSystem: {
    id: 'admin.portal.audit.trail.actor.system',
    defaultMessage: 'System',
    description: 'Display name for audit trail actions performed by the system.',
  },
  actorAutomated: {
    id: 'admin.portal.audit.trail.actor.automated',
    defaultMessage: 'Automated',
    description: 'Secondary text for audit trail actions performed by the system.',
  },
  actorUnknown: {
    id: 'admin.portal.audit.trail.actor.unknown',
    defaultMessage: 'Unknown user',
    description: 'Display name for an audit trail actor whose name could not be resolved.',
  },
  actorLmsUserId: {
    id: 'admin.portal.audit.trail.actor.lms.user.id',
    defaultMessage: 'ID {lmsUserId}',
    description: 'Secondary text showing the LMS user ID of an audit trail actor whose name could not be resolved.',
  },
  actorTypeAdmin: {
    id: 'admin.portal.audit.trail.actor.type.admin',
    defaultMessage: 'Admin',
    description: 'Role label for audit trail actions performed by an admin.',
  },
  actorTypeLearner: {
    id: 'admin.portal.audit.trail.actor.type.learner',
    defaultMessage: 'Learner',
    description: 'Role label for audit trail actions performed by a learner.',
  },
  learnerRemoved: {
    id: 'admin.portal.audit.trail.learner.removed',
    defaultMessage: 'Learner information removed',
    description: 'Shown when the affected learner\'s information is no longer available (e.g. retired PII).',
  },
  // Statuses
  statusSuccess: {
    id: 'admin.portal.audit.trail.status.success',
    defaultMessage: 'Success',
    description: 'Audit trail status label for an action that succeeded.',
  },
  statusFailed: {
    id: 'admin.portal.audit.trail.status.failed',
    defaultMessage: 'Failed',
    description: 'Audit trail status label for an action that failed.',
  },
  // Error reasons
  errorReasonEmailError: {
    id: 'admin.portal.audit.trail.error.reason.email.error',
    defaultMessage: 'Email delivery failed',
    description: 'Audit trail error reason when an email failed to send.',
  },
  errorReasonInternalApiError: {
    id: 'admin.portal.audit.trail.error.reason.internal.api.error',
    defaultMessage: 'Internal system error',
    description: 'Audit trail error reason when an internal API call failed.',
  },
  errorReasonEnrollmentError: {
    id: 'admin.portal.audit.trail.error.reason.enrollment.error',
    defaultMessage: 'Enrollment failed',
    description: 'Audit trail error reason when an enrollment failed.',
  },
  // Action types
  actionTypeAllocated: {
    id: 'admin.portal.audit.trail.action.type.allocated',
    defaultMessage: 'Allocated',
    description: 'Audit trail action type label.',
  },
  actionTypeReallocated: {
    id: 'admin.portal.audit.trail.action.type.reallocated',
    defaultMessage: 'Reallocated',
    description: 'Audit trail action type label.',
  },
  actionTypeApproved: {
    id: 'admin.portal.audit.trail.action.type.approved',
    defaultMessage: 'Approved',
    description: 'Audit trail action type label.',
  },
  actionTypeNotified: {
    id: 'admin.portal.audit.trail.action.type.notified',
    defaultMessage: 'Notified',
    description: 'Audit trail action type label.',
  },
  actionTypeReminded: {
    id: 'admin.portal.audit.trail.action.type.reminded',
    defaultMessage: 'Reminded',
    description: 'Audit trail action type label.',
  },
  actionTypeRedeemed: {
    id: 'admin.portal.audit.trail.action.type.redeemed',
    defaultMessage: 'Redeemed',
    description: 'Audit trail action type label.',
  },
  actionTypeCancelled: {
    id: 'admin.portal.audit.trail.action.type.cancelled',
    defaultMessage: 'Cancelled',
    description: 'Audit trail action type label.',
  },
  actionTypeCancelledAcknowledged: {
    id: 'admin.portal.audit.trail.action.type.cancelled.acknowledged',
    defaultMessage: 'Cancellation acknowledged',
    description: 'Audit trail action type label for a learner acknowledging their cancelled assignment.',
  },
  actionTypeCancelEmailFailed: {
    id: 'admin.portal.audit.trail.action.type.cancel.email.failed',
    defaultMessage: 'Cancellation email failed',
    description: 'Audit trail action type label for a cancellation email that failed to send.',
  },
  actionTypeExpired: {
    id: 'admin.portal.audit.trail.action.type.expired',
    defaultMessage: 'Expired',
    description: 'Audit trail action type label.',
  },
  actionTypeReversed: {
    id: 'admin.portal.audit.trail.action.type.reversed',
    defaultMessage: 'Reversed',
    description: 'Audit trail action type label.',
  },
  actionTypeErrored: {
    id: 'admin.portal.audit.trail.action.type.errored',
    defaultMessage: 'Errored',
    description: 'Audit trail action type label.',
  },
  actionTypeLearnerLinked: {
    id: 'admin.portal.audit.trail.action.type.learner.linked',
    defaultMessage: 'Learner linked',
    description: 'Audit trail action type label.',
  },
  actionTypeExpiredAcknowledged: {
    id: 'admin.portal.audit.trail.action.type.expired.acknowledged',
    defaultMessage: 'Expiration acknowledged',
    description: 'Audit trail action type label for a learner acknowledging their expired assignment.',
  },
  actionTypeRetired: {
    id: 'admin.portal.audit.trail.action.type.retired',
    defaultMessage: 'Learner data removed',
    description: 'Audit trail action type label.',
  },
  actionTypeAssigned: {
    id: 'admin.portal.audit.trail.action.type.assigned',
    defaultMessage: 'Assigned',
    description: 'Audit trail action type label.',
  },
  actionTypeActivated: {
    id: 'admin.portal.audit.trail.action.type.activated',
    defaultMessage: 'Activated',
    description: 'Audit trail action type label.',
  },
  actionTypeRevoked: {
    id: 'admin.portal.audit.trail.action.type.revoked',
    defaultMessage: 'Revoked',
    description: 'Audit trail action type label.',
  },
  actionTypeRenewed: {
    id: 'admin.portal.audit.trail.action.type.renewed',
    defaultMessage: 'Renewed',
    description: 'Audit trail action type label.',
  },
  actionTypeDeleted: {
    id: 'admin.portal.audit.trail.action.type.deleted',
    defaultMessage: 'Deleted',
    description: 'Audit trail action type label.',
  },
  actionTypeSnapshotRevert: {
    id: 'admin.portal.audit.trail.action.type.snapshot.revert',
    defaultMessage: 'Reverted',
    description: 'Audit trail action type label.',
  },
  actionTypePlanMaintenance: {
    id: 'admin.portal.audit.trail.action.type.plan.maintenance',
    defaultMessage: 'Plan maintenance',
    description: 'Audit trail action type label.',
  },
  // Sources
  sourceAdminPortal: {
    id: 'admin.portal.audit.trail.source.admin.portal',
    defaultMessage: 'Admin Portal',
    description: 'Audit trail source label for actions taken in the Admin Portal.',
  },
  sourceAdminPortalBulkUpload: {
    id: 'admin.portal.audit.trail.source.admin.portal.bulk.upload',
    defaultMessage: 'Admin Portal (bulk upload)',
    description: 'Audit trail source label for actions taken via bulk upload in the Admin Portal.',
  },
  sourceBrowseAndRequest: {
    id: 'admin.portal.audit.trail.source.browse.and.request',
    defaultMessage: 'Browse & Request approval',
    description: 'Audit trail source label for actions taken by approving a Browse & Request request.',
  },
  sourceBrowseAndRequestApproveAll: {
    id: 'admin.portal.audit.trail.source.browse.and.request.approve.all',
    defaultMessage: 'Browse & Request (approve all)',
    description: 'Audit trail source label for actions taken by approving all Browse & Request requests.',
  },
  sourceSupport: {
    id: 'admin.portal.audit.trail.source.support',
    defaultMessage: 'edX support',
    description: 'Audit trail source label for actions taken by edX support staff.',
  },
  sourceApi: {
    id: 'admin.portal.audit.trail.source.api',
    defaultMessage: 'API',
    description: 'Audit trail source label for actions taken via the API.',
  },
  sourceApiBulk: {
    id: 'admin.portal.audit.trail.source.api.bulk',
    defaultMessage: 'API (bulk)',
    description: 'Audit trail source label for bulk actions taken via the API.',
  },
  sourceSystemEvent: {
    id: 'admin.portal.audit.trail.source.system.event',
    defaultMessage: 'System event',
    description: 'Audit trail source label for actions triggered automatically by a system event.',
  },
  sourceScheduledTask: {
    id: 'admin.portal.audit.trail.source.scheduled.task',
    defaultMessage: 'Scheduled task',
    description: 'Audit trail source label for actions triggered by a scheduled task.',
  },
  sourceBackgroundTask: {
    id: 'admin.portal.audit.trail.source.background.task',
    defaultMessage: 'Background task',
    description: 'Audit trail source label for actions triggered by a background task.',
  },
  sourcePlanRenewal: {
    id: 'admin.portal.audit.trail.source.plan.renewal',
    defaultMessage: 'Plan renewal',
    description: 'Audit trail source label for actions triggered by a subscription plan renewal.',
  },
});

export const ACTION_TYPE_MESSAGES = {
  allocated: messages.actionTypeAllocated,
  reallocated: messages.actionTypeReallocated,
  approved: messages.actionTypeApproved,
  notified: messages.actionTypeNotified,
  reminded: messages.actionTypeReminded,
  redeemed: messages.actionTypeRedeemed,
  cancelled: messages.actionTypeCancelled,
  cancelled_acknowledged: messages.actionTypeCancelledAcknowledged,
  cancel_email_failed: messages.actionTypeCancelEmailFailed,
  expired: messages.actionTypeExpired,
  expired_acknowledged: messages.actionTypeExpiredAcknowledged,
  reversed: messages.actionTypeReversed,
  errored: messages.actionTypeErrored,
  learner_linked: messages.actionTypeLearnerLinked,
  retired: messages.actionTypeRetired,
  assigned: messages.actionTypeAssigned,
  activated: messages.actionTypeActivated,
  revoked: messages.actionTypeRevoked,
  renewed: messages.actionTypeRenewed,
  deleted: messages.actionTypeDeleted,
  snapshot_revert: messages.actionTypeSnapshotRevert,
  plan_maintenance: messages.actionTypePlanMaintenance,
};

export const SOURCE_MESSAGES = {
  admin_ui_single: messages.sourceAdminPortal,
  admin_ui: messages.sourceAdminPortal,
  admin_ui_bulk_csv: messages.sourceAdminPortalBulkUpload,
  browse_request_approve: messages.sourceBrowseAndRequest,
  browse_request_approve_all: messages.sourceBrowseAndRequestApproveAll,
  django_admin: messages.sourceSupport,
  api: messages.sourceApi,
  admin_api: messages.sourceApi,
  admin_api_bulk: messages.sourceApiBulk,
  signal: messages.sourceSystemEvent,
  scheduled_job: messages.sourceScheduledTask,
  celery_task: messages.sourceBackgroundTask,
  renewal_job: messages.sourcePlanRenewal,
};

export const ACTOR_TYPE_MESSAGES = {
  admin: messages.actorTypeAdmin,
  learner: messages.actorTypeLearner,
};

export const STATUS_MESSAGES = {
  success: messages.statusSuccess,
  failed: messages.statusFailed,
};

export const ERROR_REASON_MESSAGES = {
  email_error: messages.errorReasonEmailError,
  internal_api_error: messages.errorReasonInternalApiError,
  enrollment_error: messages.errorReasonEnrollmentError,
};

export default messages;
