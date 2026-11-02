# Learner Credit Top Up ("Add Funds")

Tracking doc for the Learner Credit Top Up feature
([PRD](https://2u-internal.atlassian.net/wiki/spaces/SOL/pages/4004348117/PRD+V2+Learner+Credit+Top+Up)).

## Current state

The "Add Funds" CTA on `SubBudgetCard` (`src/components/learner-credit-management/SubBudgetCard.jsx`)
is gated behind a frontend rollout flag, `features.TOP_UP_LEARNER_CREDIT` in
`src/config/index.js` (env var `FEATURE_TOP_UP_LEARNER_CREDIT='true'`, or the URL override
`?feature=TOP_UP_LEARNER_CREDIT`; `hasFeatureFlagEnabled` reads the repeated `feature` query
parameter, so `?TOP_UP_LEARNER_CREDIT=true` does not work).

The flag is a rollout gate ("is this feature live"), not business eligibility. Business
eligibility comes from the enterprise-access top-up eligibility API (ENT-12356), see below.

## Eligibility (`GET /api/v1/learner-credit-top-ups/eligibility/`)

The contract (reason codes, status codes, the backend's own `FEATURE_TOP_UP_LEARNER_CREDIT`
Django flag) is documented in enterprise-access `docs/references/learner_credit_top_ups.md`.
Frontend pieces:

- `EnterpriseAccessApiService.getTopUpEligibility` and the `useTopUpEligibility` hook
  (`data/hooks/useTopUpEligibility.ts`). `data` is the budget's camelCased row, or `null` when the
  response has no row for it (the list only returns `active=True` policies).
- **One request for the budgets list:** without `isSingleBudgetRequest`, the query key is
  `topUpEligibility(enterpriseId)` (no budget id), so every card shares one cached request and
  `select` picks its own row. The cards render without waiting for it.
- **One request with `policy_uuid` on the Add Funds page** (`isSingleBudgetRequest: true`, key
  `budgetTopUpEligibility(enterpriseId, policyUuid)`). Invalidating `topUpEligibility(enterpriseId)`
  invalidates both, which the pay step will need.
- **No retry on 4xx** (403, and 404 when the backend flag is off, won't change); one retry otherwise.
  The query isn't made at all when the frontend flag is off, so admins don't hit a 404 endpoint
  before rollout.
- `isTopUpCandidate` (`data/utils.js`): flag on, policy budget, not retired/expired. `SubBudgetCard`
  calls the hook with `enabled` set only for candidates that show card actions (not scheduled), so
  other cards never make the request. Retired and expired
  budgets stay hidden even though the API would answer `budget_not_active` for them (an expired
  subsidy also reports `budget_expiring_soon`), so the CTA never appears next to "View budget
  history". Scheduled budgets render no card actions at all.
- `canTopUpBudget({ isPolicy, status, eligibility })` = candidate **and** `eligibility.isEligible`.
  Shared by the card CTA and the Add Funds page guard so they can't drift.

**The CTA** (`add-funds/AddFundsButton.jsx`, `outline-primary` so "View budget" stays the single
primary action) and **the reasons** (`add-funds/AddFundsIneligibleStatus.jsx`, a Paragon
`Card.Status` warning strip across the bottom of the card, per the Figma). `SubBudgetCard` reads the
eligibility once and passes it to both:

| Eligibility | CTA |
| --- | --- |
| Loading | Hidden (no disabled-then-enabled flicker) |
| `isEligible: true` | Link to the Add Funds flow |
| `isEligible: false` | Disabled, with every reason in the warning strip at the bottom of the card |
| Error (403, 404, 5xx, network) or no row for the budget | Hidden, no error UI |

**Gotcha — disabled but reachable:** the ineligible button uses `aria-disabled="true"` and the
`disabled` class with a no-op `onClick`, not the `disabled` attribute, so keyboard and screen reader
users can focus it. It also sets `pointerEvents: 'none'`, because the `disabled` class alone still
shows the outline button's hover fill; this blocks only the mouse, not keyboard focus.
`aria-describedby` points at the reasons list in the warning strip (a `useId` from `SubBudgetCard`),
so each reason message must read on its own. It is a plain `<button>`, never `as={Link}`: an `<a>`
ignores `disabled`.

**Reason text is ours, not the API's:** each `error_code` (`TOP_UP_INELIGIBILITY_REASONS` in
`add-funds/data/constants.ts`) maps to a translated message in `add-funds/messages.js`; the API's
`message` is English-only and never shown. Unknown codes, or an ineligible row with no reasons,
show one generic message. The expiring-soon text doesn't name the backend's 14-day threshold, so
it can't drift from it.

**Strip colors override Paragon:** Paragon's warning `Card.Status` (`$warning-100` bg, `$warning-200`
border, `#FFD900` icon) is paler than the Figma, so `.add-funds-ineligible-status` in
`learner-credit-management/styles/index.scss` sets the design's amber values: bg `#FFF8E1`, top
border `#FFEEBA`, text `#5A4000`, icon `#856404` (a 1rem icon). It keeps Paragon's
`$card-border-radius` for the bottom corners so they match the card.

## Add Funds flow (multi-step checkout)

Route: `/:enterpriseSlug/admin/learner-credit/:budgetId/add-funds/:step?`, registered in
`src/components/learner-credit-management/index.jsx`. **Each step has its own URL** (e.g.
`.../add-funds/select-amount`), matching frontend-app-enterprise-checkout. Code lives in
`src/components/learner-credit-management/add-funds/`. Why this flow uses one URL per step
instead of the existing `FormWorkflow` modal pattern is recorded in
[ADR 0014](../decisions/0014-add-funds-one-url-per-step.rst).

| Step | Key | Status |
| --- | --- | --- |
| 1. Select Amount | `select-amount` | Built (`steps/SelectAmountStep.jsx`), see below |
| 2. Payment Method | `payment-method` | Placeholder (`StepComingSoon`) |
| 3. Payment Details | `payment-details` | Placeholder (`StepComingSoon`) |
| 4. Confirmation | `confirmation` | Placeholder (`StepComingSoon`) |

**Budget guard** (`AddFundsPage.jsx`): shows the loading state until both the policy and its
eligibility (`policy_uuid` request) have loaded, then redirects to budget detail when the flag is
off, the budget id is not a policy UUID, the policy is retired/expired, the policy fails its
initial load (404 shows `NotFoundPage`), or eligibility is ineligible, has no row, or fails its
initial load with anything (403, 404, 5xx, network). A failed background refetch of either keeps
the cached data and does not exit the flow, so selections survive a flaky network. The budget-level rule is `canTopUpBudget` in `data/utils.js`,
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
  `useReducer` + React Context (not Redux) holding `formData` (`amount`, `customAmountInput`, `paymentMethod`).
  In-memory only — a refresh mid-flow clears it and the step guard sends the user back to the
  first incomplete step, by design (no payment data in browser storage).
- *Server state* — react-query. Budget data comes from the existing `useSubsidyAccessPolicy`,
  so the cache is shared with the budget detail page.

**Step 1, Select Amount** (`steps/SelectAmountStep.jsx`):
- Preset buttons (`PRESET_TOP_UP_AMOUNTS`) or a custom amount. The custom amount must be whole
  dollars (a text input with `inputMode="numeric"`, digits only, so `1e3` is rejected) from `MIN_TOP_UP_AMOUNT` to `MAX_TOP_UP_AMOUNT`
  ($500 to $20,000, tech spec R-02); the server validates again. The range error updates as the
  admin types.
- A custom amount equal to a preset also selects that preset. Picking a preset clears the custom
  input. The raw text is kept in `customAmountInput` so it is restored on return to the step.

**Order Summary** (`OrderSummary.jsx`, values from `calculateOrderSummary` in `data/utils.ts`):
- Current balance is the budget's `aggregates.spendAvailableUsd`. When it is missing, Current and
  New Balance show `-` rather than $0.
- Plan Expires is the budget's `subsidyExpirationDatetime`; the footer is hidden when it is missing.
- There is no Discount row yet, and Total Cost equals the credit amount. Pricing (any discount and
  the amount charged) must come from the backend top-up quote once it exists; don't compute
  prices or discounts in the browser.
- Screen readers get one labelled `role="status"` sentence ("Adding $X. New balance: $Y."), set
  only when the amount is valid; the card itself is not a live region. Empty values (`-`) have
  hidden "Not available" text. The custom amount error uses `role="alert"`.

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
