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
  data/constants.js                        Action type and source enum values per service, statuses, loading bounds
  data/messages.js                         i18n labels for action types, statuses, sources, actor roles and error reasons
  data/types.ts                            AuditTrailRow, filters, table options and table data types
  data/utils.ts                            Query options, row transform, label helpers, bounded paginated fetching
  data/hooks/useAuditTrailTableState.ts    Filter + DataTable state => `tableOptions`
  data/hooks/useAuditTrailQuery.ts         Shared react-query hook: loads the history, applies `tableOptions`, retry
learner-credit-management/
  LearnerCreditAuditTrail.jsx              Audit trail tab content
  data/hooks/useAssignmentAuditTrail.js    `useAuditTrailQuery` (key: learnerCreditManagementQueryKeys.auditTrail)
  data/utils.js#transformAssignmentsToAuditTrailRows   Flattens assignment actions into audit trail rows
  MultipleBudgetsPage.jsx                  "Details" / "Audit trail" tabs (when the flag is on)
subscriptions/
  SubscriptionAuditTrail.jsx               Audit trail tab content
  data/hooks.js#useLicenseAuditTrail       `useAuditTrailQuery` (key: subscriptionsQueryKeys.auditTrail)
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
  2. Fetches each assignable budget's assignments, in every state, most recently active first
     (`ordering=-recent_action_time`), up to the loading bounds below.
  3. Flattens their actions into one list.
  4. Applies the filters, sort and page in the browser (`applyAuditTrailTableOptions`).
- **Subscriptions: filtering, sorting and pagination also happen in the browser.** license-manager's audit history
  endpoint is per subscription plan. The hook does this:
  1. Lists every subscription plan, active or not, of the enterprise's customer agreements
     (`fetchCustomerAgreementData` with `active_plans_only=false`, so expired plans keep their history).
  2. Fetches each plan's audit history, newest first (`GET /api/v1/subscriptions/{uuid}/audit-history/`,
     100 per page), up to the loading bounds below.
  3. Maps the actions into rows (`transformLicenseActionsToAuditTrailRows`) and applies the filters, sort and page
     in the browser (`applyAuditTrailTableOptions`).
- **Loading bounds.** Neither service has an enterprise-wide, filterable audit endpoint, so the history is
  loaded up front and filtered in the browser. Loading is bounded **per budget or plan**; the number of budgets and
  plans (including inactive ones) still grows over an enterprise's lifetime, and their lists are fetched in full.
  - At most `AUDIT_TRAIL_MAX_PAGES_PER_SOURCE` (10) pages of `AUDIT_TRAIL_API_PAGE_SIZE` (100) are fetched per
    budget or plan:
    - Learner credit: the budget's 1,000 most recently **allocated or reminded** assignments
      (`ordering=-recent_action_time`, the only activity ordering the admin assignments API supports). An older
      assignment that was cancelled, redeemed or expired recently can therefore fall outside them.
    - Subscriptions: the plan's 1,000 most recent license actions (the API returns them newest first).
  - At most `AUDIT_TRAIL_MAX_CONCURRENT_REQUESTS` (3) budgets or plans are fetched at a time
    (`mapWithConcurrencyLimit`). After one fails, no further budgets or plans are fetched.
  - When a budget or plan has more history, each tab shows a notice (`historyNotice`) that says exactly what was
    kept, e.g. "Showing history for the 1,000 most recently allocated or reminded assignments in each budget. Older
    assignments aren't included." Filters, sorting and paging only cover the loaded history.

  **Overall load isn't capped.** An enterprise with N budgets or plans can make up to about 10 × N history requests
  when the tab opens (e.g. ~400 for 40 budgets), 3 at a time. Before enabling `FEATURE_AUDIT_TRAIL` for enterprises
  with many budgets or plans, an enterprise-wide, server-side paginated audit endpoint is needed in each service
  (follow-up ticket). Enterprise-access ordering by the latest action of any type would also make the learner credit
  cut-off exact.
- **Changing a filter or the sort order returns to page 1.**
- **Status.** The API has no status field, so it's derived (`getAuditTrailStatus`): an action is **Failed** when it
  has an `error_reason` or its action type is `errored` or `cancel_email_failed`; otherwise **Success**. The Status
  column shows a green/red badge with the error reason (e.g. "Email delivery failed") below failures. The Status
  filter matches on this derived value. The Action column is plain bold text (no badge).
- **Sorting** defaults to newest first. The sort button and the Timestamp column header share one sort state.
- **Time zone and locale.** Timestamps show on one line, localized with `intl.formatDate` in the viewer's local
  time zone (e.g. "Oct 28, 2026, 1:01:42 PM" in English). The From/To dates are inclusive local days: from the start
  of the From day until the end of the To day (`applyAuditTrailTableOptions`).
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
- **Actor search** matches the actor's name or email, "System", or the LMS user ID shown for an unresolved actor.
  It's applied 300 ms after the admin stops typing. Removing the actor chip or "Clear all" discards a pending
  search; changing other filters keeps it.
- **Session recordings.** Actor and learner identities, the actor search input and its chip are marked
  `data-hj-suppress`, following the repo's pattern for emails.
- **Freshness, retries and cancellation.**
  - The audit queries use the app's 60 second `staleTime`: reopening a tab within it reuses the cached history, and
    afterwards it's refetched. The "Try again" button on the error alert refetches on demand.
  - Each attempt reloads the whole audit history, so failures are retried at most once, and client errors (4xx)
    aren't retried (`retryAuditTrailQuery`, like the top-up eligibility query).
  - react-query's `signal` is passed to every audit trail request (budgets/plans and their history), so they're
    cancelled when the query is.
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
and no state filter, so assignments in every state are included, ordered by `-recent_action_time`. Each action includes
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
