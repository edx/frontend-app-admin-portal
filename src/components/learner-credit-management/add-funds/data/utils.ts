import { ADD_FUNDS_STEP_KEYS, ADD_FUNDS_STEPS } from './constants';
import type { AddFundsStepKey } from './constants';
import type { AddFundsFormData } from './types';

type StepCompletionRule = (formData: AddFundsFormData) => boolean;

/**
 * Per-step rules for whether the user may advance past a step. They drive both the Continue
 * button and the deep-link step guard. Every step must have a rule (enforced by the type), and a
 * step without one is treated as incomplete, so a forgotten rule blocks progress rather than
 * allowing a step to be skipped. This is a client-side check only; the server must verify payment.
 */
const STEP_COMPLETION_RULES: Record<AddFundsStepKey, StepCompletionRule> = {
  // TODO: replace with the real rule when the Select Amount step is built.
  [ADD_FUNDS_STEP_KEYS.selectAmount]: () => true,
  // TODO: replace with the real rule when the Payment Method step is built.
  [ADD_FUNDS_STEP_KEYS.paymentMethod]: () => true,
  // TODO: Confirmation must only be reachable after a payment is submitted (or, on a Stripe
  // return redirect, verified against the backend by session id). Until payment is built,
  // nothing can complete this step, so Confirmation stays unreachable.
  [ADD_FUNDS_STEP_KEYS.paymentDetails]: () => false,
  // Final step; there is nothing to proceed to.
  [ADD_FUNDS_STEP_KEYS.confirmation]: () => false,
};

export const canProceedFromStep = (stepKey: AddFundsStepKey, formData: AddFundsFormData): boolean => (
  STEP_COMPLETION_RULES[stepKey]?.(formData) ?? false
);

/**
 * Index of the furthest step the user may currently be on: the first step whose requirements
 * are not yet met (or the last step if all are met).
 */
const getFirstIncompleteStepIndex = (formData: AddFundsFormData): number => {
  const index = ADD_FUNDS_STEPS.findIndex((stepKey) => !canProceedFromStep(stepKey, formData));
  return index === -1 ? ADD_FUNDS_STEPS.length - 1 : index;
};

/**
 * Returns the step to redirect to when the requested `:step` URL param is unknown, missing, or
 * ahead of what the user has completed (e.g. a deep link or refresh mid-flow, which clears the
 * in-memory form data). Returns `null` when the requested step may be shown.
 */
export const getAddFundsStepRedirect = (
  requestedStep: string | undefined,
  formData: AddFundsFormData,
): AddFundsStepKey | null => {
  const requestedIndex = ADD_FUNDS_STEPS.indexOf(requestedStep as AddFundsStepKey);
  if (requestedIndex === -1) {
    return ADD_FUNDS_STEPS[0];
  }
  const firstIncompleteIndex = getFirstIncompleteStepIndex(formData);
  if (requestedIndex > firstIncompleteIndex) {
    return ADD_FUNDS_STEPS[firstIncompleteIndex];
  }
  return null;
};
