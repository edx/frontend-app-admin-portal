# Multi-Plan Learner Credit Funding (admin portal)

Tracking doc for the admin portal part of Multi-Plan Learner Credit Funding
([PRD](https://2u-internal.atlassian.net/wiki/spaces/SOL/pages/3931177007/Multi-Plan+Learner+Credit+Funding),
[tech spec](https://2u-internal.atlassian.net/wiki/spaces/SOL/pages/4292345931/Multi-Plan+Learner+Credit+Funding+V1+Technical+Specification+Overview),
[Figma](https://www.figma.com/design/5QYkP63ETYojZMdSN3OF1S/Learner-credit-Multi-plan)). Epic ENT-12102; frontend
tickets ENT-12457 (flag, help links, tour), ENT-12445 (split-funded Spent details) and ENT-12446 (budget opt-in UI).

A "split-funded" enrollment is paid for by two budgets (subsidy access policies) when the learner's primary budget
can't cover it alone. Backend gates (KD-9): the global WaffleSwitch `enterprise_access.multi_plan_funding`, the
per-customer `enable_multi_plan_funding` on the enterprise-access customer configuration (set by ECS), and the
per-budget `is_multi_plan_eligible` (the opt-in).

## Feature flag

Backend-controlled, following the Invite Admins precedent (`enterprise_invite_admins_enabled`, ENT-11267 / ENT-11231):

- edx-enterprise exposes `enterprise_features.enterprise_multi_plan_funding_enabled` on the enterprise customer
  response (default off).
- `LmsApiService.fetchEnterpriseBySlug` **camelCases** `enterprise_features`, so Redux holds
  `state.portalConfiguration.enterpriseFeatures.enterpriseMultiPlanFundingEnabled`. Read it through
  `useIsMultiPlanFundingEnabled()` (`learner-credit-management/data/hooks`), never by the snake_case key.
  (The Invite Admins code read `enterprise_invite_admins_enabled` in snake_case, which is always `undefined` in
  Redux; don't copy that.)
- The key lives in one constant, `MULTI_PLAN_FUNDING_FEATURE_FLAG` (`learner-credit-management/data/constants.js`).
- Missing or not exactly `true` means off. There is no frontend env var or URL override.

With the flag off nothing below renders: no Spent column, modal, help links, Settings tab, plan page or tour steps.
Every new multi-plan surface must check it.

## Spent table: "Funded from" column (ENT-12445)

- Data: the Spent table already reads enterprise-subsidy `GET /api/v2/subsidies/<uuid>/admin/transactions/`, which
  carries a read-only `split_funding` per row (`null` for single-budget rows; KD-13).
  `transformUtilizationTableSubsidyTransactionResults` (`data/utils.js`) passes it through as `splitFunding`.
- `getSplitFundingBreakdown(splitFunding, budgetNamesById)` orders legs by `legOrder`, converts cents to dollars and
  resolves budget names. It returns `null` unless there are at least two legs.
- `LearnerCreditAllocationTable` adds the column only when the flag is on **and** the budget is a subsidy access
  policy (UUID route param).
- `SpendTableFundedFromContents`: split rows show "View details", which opens `SplitFundingDetailsModal`
  ("Spent Details": funded-on date, per-budget amounts, total, help link). Single-budget rows show the current
  budget's name.
- Budget names are looked up per policy UUID with `useSubsidyAccessPolicyNames`, which shares
  `useSubsidyAccessPolicy`'s query key and fetcher (so the current budget is already cached). Don't use the
  `useEnterpriseBudgets` list for this: it holds only *active* budgets and only the first API page, so inactive
  budgets would lose their names. Legs that can't be resolved show "Another budget".

## Budget opt-in: Settings > Multi-plan funding (ENT-12446)

Code: `src/components/settings/SettingsMultiPlanFundingTab/`.

- Visible only when the flag is on **and** the customer switch is on:
  `SubsidyRequestsContext.subsidyRequestConfiguration.enableMultiPlanFunding === true`
  (`useIsMultiPlanFundingOptInVisible`). Otherwise the tab is hidden and the plan route renders `NotFoundPage`.
- **Plans tab** (`/settings/multi_plan_funding`): active policies from `GET /api/v1/subsidy-access-policies/`
  with a pool badge: "In Pool" (`is_multi_plan_eligible`), "Not in Pool", or "Unavailable".
  `canJoinMultiPlanPool` treats a budget as unavailable unless it is a `PerLearnerSpendCreditAccessPolicy` with
  Browse & Request off and is active, not retired and not expired (tech spec candidate rules).
- **Plan page** (`/settings/multi_plan_funding/:planId`): plan details, a `Form.Switch` and "Save Changes".
  - Adding to the pool opens the "Add this plan to the multi-plan pool?" confirmation.
  - Removing saves directly.
  - Success shows a "Funding settings saved" toast. Once the plan is in the pool, a "How it works" alert appears.
- Save: `EnterpriseAccessApiService.updateSubsidyAccessPolicyMultiPlanFunding` →
  `PATCH /api/v1/subsidy-access-policies/{uuid}/multi-plan-funding/` with `{"is_multi_plan_eligible": bool}`
  (`useUpdateMultiPlanFunding`). Data hooks and helpers are unit-tested in `data/tests/hooks.test.jsx`. On success it updates the budget detail cache and refetches the list.
  A 422 (customer switch off) shows a specific error; anything else shows a generic retry message.

## Help center links

`configuration.ENTERPRISE_SUPPORT_MULTI_PLAN_FUNDING_URL` (env `ENTERPRISE_SUPPORT_MULTI_PLAN_FUNDING_URL`).

- **Where they render:** the Spent Details modal footer, the Multi-plan funding tab intro, and the "How it works"
  alert.
- **Behavior:** opens in a new tab, with Paragon's "in a new tab" screen-reader text.
- **Missing URL:** if it's unset, links aren't rendered, so nothing broken ships before ECS/CS publishes the article.

## Admin onboarding tour

No new tour steps: multi-plan copy is swapped into existing steps, only when the flag is on and the related element
is in the DOM. Otherwise the original copy is used.

- `AllocateLearningBudgetsFlow`: when the Spent table's "Funded From" header `#spent-budget-funded-from` is rendered,
  the existing Spent-table step (assignment budgets) and Activity step (browse & enroll and invite-only browse &
  enroll budgets, the only budgets that can be split-funded) also explain split funding.
- `SetUpPreferencesFlow`: no new step. The existing "Set up preferences" step swaps in copy that also mentions
  Multi-plan funding (`viewSetUpPreferencesWithMultiPlanFunding`) when the flag and customer switch are on and
  `#multi-plan-funding-settings-tab` is rendered.

## Testing locally

The flag comes from edx-enterprise, so to see the UI locally either:

- have your devstack edx-enterprise return `enterprise_multi_plan_funding_enabled: true` in `enterprise_features`, or
- set `portalConfiguration.enterpriseFeatures.enterpriseMultiPlanFundingEnabled = true` with Redux DevTools.

The opt-in UI also needs `enable_multi_plan_funding: true` in the enterprise-access customer configuration response.

## Open items

- Backend: add `enterprise_multi_plan_funding_enabled` to `enterprise_features` (edx-enterprise), expose
  `enable_multi_plan_funding` on the customer configuration API, add `is_multi_plan_eligible` to the policy
  serializer, and ship the PATCH endpoint.
- Final help article URL per environment (ECS/CS).
- Design sign-off on tour copy and the deviations listed in the ENT-12457 PR (single settings tab instead of
  Figma's inner "Plans / Multi plan funding" tabs; "Not in Pool" badge; "View details" instead of Figma's
  "2 Budgets" trigger; no "Approved by/on" in Spent Details).
