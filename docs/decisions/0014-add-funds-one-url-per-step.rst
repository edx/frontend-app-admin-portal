=============================================================
14. One URL per step for the Learner Credit Add Funds flow
=============================================================

******
Status
******

Accepted (October 2026)

*******
Context
*******

Learner Credit Top Up ("Add Funds") lets an enterprise admin add money to a learner credit
budget through a multi-step checkout: Select Amount, Payment Method, Payment Details and
Confirmation. Payment is taken with Stripe.

The admin portal already has a multi-step pattern: ``FormWorkflow`` with
``FormContextWrapper`` (``src/components/forms/``), used by the LMS configuration
(``SettingsLMSTab/LMSConfigPage.jsx``) and SSO configuration (``SettingsSSOTab/NewSSOStepper.jsx``)
screens. It renders the steps inside a ``FullscreenModal`` and keeps the current step in a
reducer, so the URL does not change between steps.

That pattern does not fit a payment flow:

- **Stripe 3-D Secure reloads the page.** Stripe's ``confirm()`` may send the user to their bank
  for 3-D Secure authentication and return them through a full page reload to a ``returnUrl``.
  The reload wipes React state, react-query and Redux. If the step lives only in a reducer, the
  user returns to step 1 (or to the page behind the modal) instead of the step that should
  handle the payment result.
- **Browser Back/Forward and refresh.** Admins expect the browser Back button to move between
  checkout steps, and a refresh to keep them on the current step. With the step in a reducer,
  Back leaves the flow entirely and refresh restarts it.
- **Deep links.** Each step needs a link that can be opened directly, both for Stripe's
  ``returnUrl`` and for support and QA.
- ``FormWorkflow`` is built around the settings configuration forms (its field validation,
  save-on-step behaviour and modal layout), not a full-page checkout.

frontend-app-enterprise-checkout already uses one URL per step for its Stripe checkout, so the
approach is proven for this kind of flow.

********
Decision
********

The Add Funds flow gives each step its own URL and does not use ``FormWorkflow``.

- **Routing:** ``/:enterpriseSlug/admin/learner-credit/:budgetId/add-funds/:step?``, with step
  keys ``select-amount``, ``payment-method``, ``payment-details`` and ``confirmation``. The
  current step is read from the ``:step`` URL parameter, never stored in state.
- **Navigation:** Continue calls ``navigate()`` and records the step it came from in
  ``location.state``. In-app Back pops that history entry, or replaces the current entry when
  there is nothing behind it (deep link, refresh), so the flow never grows browser history.
  Leaving the flow from the first step replaces the last flow entry, so browser Back does not
  reopen it.
- **Guards as components:** the admin portal uses ``<Routes>`` under ``AppProvider``'s
  ``BrowserRouter``, not a data router, so route loaders are not available. ``AddFundsPage``
  checks the budget (feature flag, policy type, status) and ``AddFundsStepper`` redirects a
  missing, unknown or not-yet-reachable step to the first incomplete step. This plays the role
  of enterprise-checkout's loader-based ``validateFormState``.
- **State:** the user's selections live in ``AddFundsContextProvider``, a typed ``useReducer``
  with React Context. They are in memory only: payment data is never written to browser storage.
  Server data (the budget, and later eligibility, quotes and payment status) comes from
  react-query.
- **Step rules fail closed:** every step declares a completion rule in ``STEP_COMPLETION_RULES``,
  enforced by the type. A step without a rule counts as incomplete, so a forgotten rule blocks
  progress instead of letting a user skip a step. These are client-side checks only; the server
  must verify payment before anything shows success.

************
Consequences
************

- The admin portal now has two multi-step patterns. Use one URL per step (this ADR) for full-page
  flows that need deep links, browser history or external redirects such as Stripe. Use
  ``FormWorkflow`` for configuration forms shown in a modal.
- A refresh mid-flow clears the in-memory selections, and the step guard sends the user back to
  the first incomplete step. This is intended, because payment data must not be persisted in the
  browser.
- The Confirmation step must rebuild its state from the backend (by Stripe session id) when it is
  reached through a Stripe return reload, and must be exempt from the selection-based step guard
  in that case. This needs a top-up session status endpoint in enterprise-access.
- Each new step adds a completion rule and starts with ``AddFundsStepHeading`` so focus moves to
  it on step change.

**********
References
**********

- Feature notes: ``docs/references/learner-credit-top-up.md``
- Card-only payments: ``docs/decisions/0012-credit-card-only-payment-methods.rst``
- Existing multi-step pattern: ``src/components/forms/FormWorkflow.tsx``
- Ticket: ENT-12396
