# Audit Trail (ENT-12035)

The Admin Portal shows a read-only **Audit trail** tab that lists who did what, when, from where, and to
which learner. It's built on the audit records captured by the backend (epic ENT-12048):

| Page | Tab route | Backend records |
|---|---|---|
| Learner Credit Management | `/:enterpriseSlug/admin/learner-credit/audit-trail` | `LearnerContentAssignmentAction` (enterprise-access) |
| Subscription Management | `/:enterpriseSlug/admin/subscriptions/audit-trail` | `LicenseAction` (license-manager) |

The audit trail covers every assignment or license for the enterprise, not a single record.

## Feature flag

Hidden behind `features.AUDIT_TRAIL` (`FEATURE_AUDIT_TRAIL='true'` in `.env.*`, or the `?feature=AUDIT_TRAIL`
query param). When the flag is off, the tabs and routes don't exist.

## Code map

```
src/components/AuditTrail/                 Shared, presentational audit trail (Paragon DataTable)
  AuditTrail.jsx                           Header, filters, applied-filter chips, table and loading/error/empty states
  AuditTrailFilters.jsx                    Inline filters: actor search, action, status, source, from/to dates
  AuditTrailAppliedFilters.jsx             Removable `Chip` per applied filter
  AuditTrailSortToggle.jsx                 "Sort: Newest first" button; shares DataTable sort state with the column header
  AuditTrail*Cell.jsx                      Table cells (Timestamp, Action, Status, Actor, Source, Affected learner)
  data/constants.js                        Action type and source enum values per service, statuses, timestamp format
  data/messages.js                         i18n labels for action types, statuses, sources, actor roles and error reasons
  data/utils.js                            API query options, response transform, label helpers
  data/hooks/useAuditTrailTableState.js    Filter + DataTable state => API query options
learner-credit-management/
  LearnerCreditAuditTrail.jsx              Audit trail tab content
  data/hooks/useAssignmentAuditTrail.js    react-query hook (key: learnerCreditManagementQueryKeys.auditTrail)
  data/utils.js#transformAssignmentsToAuditTrailRows   Flattens assignment actions into audit trail rows
  MultipleBudgetsPage.jsx                  "Details" / "Audit trail" tabs (when the flag is on)
subscriptions/
  SubscriptionAuditTrail.jsx               Audit trail tab content
  data/hooks.js#useLicenseAuditTrail       react-query hook (key: subscriptionsQueryKeys.auditTrail)
  data/utils.ts#transformLicenseActionsToAuditTrailRows   Maps license actions to audit trail rows
  SubscriptionTabs.jsx                     "Audit trail" tab (when the flag is on)
src/data/services/
  EnterpriseAccessApiService.listContentAssignmentsWithAuditTrail
  LicenseManagerAPIService.fetchSubscriptionAuditHistory (+ existing fetchCustomerAgreementData)
```

## Behavior

- **Learner credit: filtering, sorting and pagination happen in the browser.** enterprise-access has no
  enterprise-wide audit list. Instead, the admin assignments endpoint
  (`GET /api/v1/assignment-configurations/{uuid}/admin/assignments/`) returns each assignment with its full
  `actions` history, including the audit fields added in enterprise-access PR #327. The hook does this:
  1. Lists every page of the enterprise's budgets, active or not (`listSubsidyAccessPolicies` with
     `includeInactive`), so retired budgets keep their history. The policies API returns 10 per page.
  2. Fetches every page of assignments, in every state, for each assignable budget.
  3. Flattens their actions into one list.
  4. Applies the filters, sort and page in the browser (`applyAuditTrailQueryOptions`).

  This is one fetch per budget page, so it may be slow for enterprises with very large assignment histories.
- **Subscriptions: filtering, sorting and pagination also happen in the browser.** license-manager's audit history
  endpoint is per subscription plan. The hook does this:
  1. Lists every subscription plan, active or not, of the enterprise's customer agreements
     (`fetchCustomerAgreementData` with `active_plans_only=false`, so expired plans keep their history).
  2. Fetches every page of each plan's audit history (`GET /api/v1/subscriptions/{uuid}/audit-history/`,
     100 per page).
  3. Maps the actions into rows (`transformLicenseActionsToAuditTrailRows`) and applies the filters, sort and page
     in the browser (`applyAuditTrailQueryOptions`).
- **Changing a filter or the sort order returns to page 1.**
- **Status.** The API has no status field, so it's derived (`getAuditTrailStatus`): an action is **Failed** when it
  has an `error_reason` or its action type is `errored` or `cancel_email_failed`; otherwise **Success**. The Status
  column shows a green/red badge with the error reason (e.g. "Email delivery failed") below failures. The Status
  filter matches on this derived value. The Action column is plain bold text (no badge).
- **Sorting** defaults to newest first. The sort button and the Timestamp column header share one sort state.
- **Time zone.** Timestamps show on one line in the viewer's local time zone (`D MMM YYYY, h:mm:ss A`). The From/To dates are inclusive local days,
  sent as `created_after` (start of the From day) and `created_before` (end of the To day) in UTC ISO format.
- **Actor names.** enterprise-access audit actions only include `actor_lms_user_id`, and the Admin Portal has no
  API that maps an LMS user ID to a name. The People Management admins API returns enterprise-customer-user IDs.
  - The actor is shown by name only when that ID is the logged-in admin (`getAuthenticatedUser()`) or the
    assignment's own learner.
  - System actions show "System".
  - Any other actor shows "Unknown user" with their role and LMS user ID.
  - A missing actor is never assumed to be the current admin.
  - license-manager resolves the actor itself and returns `actor: {email, full_name}` (or `null`), which is shown
    as is; a `null` learner actor falls back to the affected learner.
- **Retired learner data.** enterprise-access replaces a retired learner's email with
  `retired_user<nonce>@retired.invalid` (`LearnerContentAssignment.clear_pii()`), and license-manager clears it.
  Both are shown as "Learner information removed" (`getUnretiredEmail`).
- **Actor search** is applied 300 ms after the admin stops typing. Removing the actor chip or "Clear all"
  discards a pending search; changing other filters keeps it.
- **Session recordings.** Actor and learner identities, the actor search input and its chip are marked
  `data-hj-suppress`, following the repo's pattern for emails.
- **Freshness.** Both audit queries use `refetchOnMount: 'always'`, so opening an audit trail tab always
  refetches (showing cached rows meanwhile) and reflects actions just taken elsewhere in the portal. The app's
  60 second `staleTime` still applies to window-focus refetches.
- **Reachability.** The audit trail tabs live inside the existing pages, so they follow those pages' gates: the
  Learner Credit page requires at least one active budget (`canManageLearnerCredit`), and Subscription Management
  shows its "no active subscriptions" alert without an active plan. Inactive budgets and plans are still included
  in the history when the page is reachable.
- **Unknown enum values** (a new action type or source added by the backend) fall back to a humanized label
  instead of failing.
- **Three non-data states:**
  - Loading the first page shows a `Skeleton`.
  - An API failure shows a danger `Alert` with "Try again", never an empty table.
  - An empty result shows "No audit history available", or "No events match these filters" when filters
    are applied.

## API contract

**Learner credit (enterprise-access):** uses the existing admin assignments endpoint with `page_size=100`
and no state filter, so assignments in every state are included. Each action includes
`created`, `uuid`, `action_type`, `error_reason`, `actor_type`, `actor_lms_user_id`, `source`, `learner_email` and
an allowlisted `metadata`.

**Subscriptions (license-manager):** `GET /api/v1/subscriptions/{subscription_uuid}/audit-history/` (license-manager
branch `ENT-12035-license-manager-audit-trail`), paginated with `page`/`page_size` (max 500) and newest first. Each
action includes `uuid`, `created`, `action_type`, `actor_type`, `actor` (`{email, full_name}` or `null`), `source`,
`license_uuid`, `learner_email`, `correlation_id` and an allowlisted `metadata`. It has no `error_reason`, so license
actions always show **Success**. The endpoint also supports server-side filters (`action_type`, `actor_type`,
`source`, `license_uuid`, `learner_email`, `created_after`/`created_before`, `ordering`), which aren't used because
actions from several plans are combined in the browser.

## Seeing it locally

1. Bring enterprise-access up to date:
   - Run `git pull` in `enterprise-access`.
   - In `edx.devstack.enterprise-access`, run `pip install -r requirements/dev.txt` and
     `python manage.py migrate`.
   - The worker container has its own Python environment, so install the requirements there too (or copy
     `/edx/venvs/enterprise-access` across from the web container), then restart both containers.
2. Create audit actions as an enterprise admin (for example `enterprise_admin_test-enterprise` / `edx`). Assign a
   course from a budget's catalog, then remind or cancel it, either in the portal or through the
   `policy-allocation/{policy_uuid}/allocate/` and `admin/assignments/remind|cancel/` APIs.
3. Open `http://localhost:1991/<enterprise-slug>/admin/learner-credit/audit-trail?feature=AUDIT_TRAIL`.

Locally, emails aren't configured (no `BRAZE_API_KEY`), so notifications and reminders show up as actions with
"Email delivery failed".
