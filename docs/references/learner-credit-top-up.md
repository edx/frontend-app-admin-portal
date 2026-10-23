# Learner Credit Top Up ("Add Funds")

Tracking doc for the Learner Credit Top Up feature
([PRD](https://2u-internal.atlassian.net/wiki/spaces/SOL/pages/4004348117/PRD+V2+Learner+Credit+Top+Up)).

## Current state

The "Add Funds" CTA on `SubBudgetCard` (`src/components/learner-credit-management/SubBudgetCard.jsx`)
is currently gated behind a single frontend-only rollout flag, `features.TOP_UP_LEARNER_CREDIT` in
`src/config/index.js` (env var `FEATURE_TOP_UP_LEARNER_CREDIT='true'`, or the URL override
`?feature=TOP_UP_LEARNER_CREDIT`; `hasFeatureFlagEnabled` reads the repeated `feature` query
parameter, so `?TOP_UP_LEARNER_CREDIT=true` does not work).

The CTA only renders when the flag is on, the budget source is `BUDGET_TYPES.policy`
(enterprise-access Learner Credit policies — not legacy ecommerce offers or enterprise-subsidy
sub-budgets; `BudgetCard` passes `source` through to `SubBudgetCard`), **and** `canTopUpBudget`
allows its status: Active or Expiring only, so scheduled, retired, expired and any unknown future
status are excluded (it never appears alongside "View budget history"). It uses `outline-primary` so
"View budget" remains the single primary action on the card, and links to the Add Funds flow
described below. The flag is a rollout gate ("is this feature live"), not business eligibility.

## Add Funds flow (multi-step checkout)

Route: `/:enterpriseSlug/admin/learner-credit/:budgetId/add-funds/:step?`, registered in
`src/components/learner-credit-management/index.jsx`. **Each step has its own URL** (e.g.
`.../add-funds/select-amount`), matching frontend-app-enterprise-checkout. Code lives in
`src/components/learner-credit-management/add-funds/`. Why this flow uses one URL per step
instead of the existing `FormWorkflow` modal pattern is recorded in
[ADR 0014](../decisions/0014-url-per-step-for-add-funds-flow.rst).

| Step | Key | Status |
| --- | --- | --- |
| 1. Select Amount | `select-amount` | Placeholder (`StepComingSoon`) |
| 2. Payment Method | `payment-method` | Placeholder (`StepComingSoon`) |
| 3. Payment Details | `payment-details` | Placeholder (`StepComingSoon`) |
| 4. Confirmation | `confirmation` | Placeholder (`StepComingSoon`) |

**Budget guard** (`AddFundsPage.jsx`): redirects to budget detail when the flag is off, the
budget id is not a policy UUID, the policy is scheduled/retired/expired, or the policy fails its
initial load (404 shows `NotFoundPage`). A failed background refetch keeps the cached policy and
does not exit the flow, so selections survive a flaky network. The budget-level rule is `canTopUpBudget` in `data/utils.js`,
shared with the `SubBudgetCard` CTA. The page reads the budget status from `subsidyAccessPolicy.status`,
which `useSubsidyAccessPolicy`'s `select` derives once with `getBudgetStatus`; don't recompute it.

**Step guard** (`AddFundsStepper.jsx` + `getAddFundsStepRedirect` in `data/utils.ts`): a missing
or unknown `:step` redirects to `select-amount`; a step ahead of what the user has completed
(deep link, or a refresh that cleared in-memory selections) redirects to the first incomplete
step. This is the component-level equivalent of checkout's loader-based `validateFormState` —
admin portal uses `<Routes>` under `AppProvider`'s `BrowserRouter`, not a data router, so route
loaders aren't available.

**Gotcha — route ordering:** `add-funds` sits next to `/:budgetId/:activeTabKey?`. React Router 6
ranks the static segment higher, so it is not treated as a tab key; `AddFundsPage.test.jsx`
covers this. Don't add a budget detail tab named `add-funds`.

**State management:**
- *Current step* — derived from the `:step` URL param, so browser Back/Forward move between
  steps. Continue pushes a history entry and records the step it came from in `location.state`.
  In-app Back pops that entry (`navigate(-1)`) when the previous step is directly behind it, and
  otherwise (deep link, refresh) replaces the current entry, so the flow never grows history.
  Back on the first step replaces the remaining flow entry with budget detail, so browser Back
  after leaving does not reopen the flow. Don't change Back to push entries.
- *User selections* — `AddFundsContextProvider` (`data/AddFundsContext.tsx`), a typed
  `useReducer` + React Context (not Redux) holding `formData` (`amount`, `paymentMethod`).
  In-memory only — a refresh mid-flow clears it and the step guard sends the user back to the
  first incomplete step, by design (no payment data in browser storage).
- *Server state* — react-query. Budget data comes from the existing `useSubsidyAccessPolicy`,
  so the cache is shared with the budget detail page.

**Confirmation is currently unreachable**: the `payment-details` completion rule returns `false` until payment submission exists, so Continue is disabled there and deep links
to `confirmation` are redirected.

**Adding/building a step:**
1. Steps are ordered by `ADD_FUNDS_STEPS` in `data/constants.ts`; labels are in `messages.js`.
2. Replace the `StepComingSoon` fallback for the step in `AddFundsStepper.jsx#renderStepContent`.
3. Replace the step's placeholder completion rule in `STEP_COMPLETION_RULES` (`data/utils.ts`) —
   this drives both the Continue button and the deep-link step guard. The type requires a rule
   for every step, so the compiler rejects a step added without one. Today's
   placeholder steps are marked complete explicitly (`() => true`) and must get real rules.
   This is a client-side check only; the server must verify payment before showing success.
4. Start the step with `AddFundsStepHeading`; the stepper moves focus to it on step change.

This doc covers only what has shipped. Planned work and its design live in ENT-12396 and the
tech spec; add each part here when it lands.

## Gotchas

- **Focus on step change** (`AddFundsStepper.jsx`): the stepper compares against the last step
  it saw rather than using a "first render" flag. The app renders in `<StrictMode>`, which runs
  mount effects twice while keeping refs, so a first-render flag would focus the heading on load
  in development. A StrictMode test in `AddFundsPage.test.jsx` covers this.
- **Accessibility test:** Paragon's `<Breadcrumb>` trips axe's `list` rule
  (`<li role="presentation">` separators inside its `<ol>`). `AddFundsPage.test.jsx` disables
  only that rule, only in that test, per the exception process in `tests/accessibility-settings.ts`.

## Decision record

The one-URL-per-step pattern, and why this flow does not use `FormWorkflow`, is recorded in
[ADR 0014](../decisions/0014-add-funds-one-url-per-step.rst).
