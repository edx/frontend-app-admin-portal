import {
  ADD_FUNDS_STEP_KEYS,
  ADD_FUNDS_STEPS,
  MAX_TOP_UP_AMOUNT,
  MIN_TOP_UP_AMOUNT,
  TOP_UP_DISCOUNT_RATE,
} from './constants';
import type { AddFundsStepKey } from './constants';
import type { AddFundsFormData } from './types';

export const isValidTopUpAmount = (amount: number | null): amount is number => (
  typeof amount === 'number'
  && Number.isInteger(amount)
  && amount >= MIN_TOP_UP_AMOUNT
  && amount <= MAX_TOP_UP_AMOUNT
);

type StepCompletionRule = (formData: AddFundsFormData) => boolean;

/**
 * Per-step rules for whether the user may advance past a step. They drive both the Continue
 * button and the deep-link step guard. The type requires a rule for every step, so a new step
 * can't be added without deciding when it is complete. This is a client-side check only; the
 * server must verify payment.
 */
const STEP_COMPLETION_RULES: Record<AddFundsStepKey, StepCompletionRule> = {
  [ADD_FUNDS_STEP_KEYS.selectAmount]: ({ amount }) => isValidTopUpAmount(amount),
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
  STEP_COMPLETION_RULES[stepKey](formData)
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

export type TopUpOrderSummary = {
  creditAmount: number;
  /** `null` when no discount is on record, in which case the discount row is hidden. */
  discount: number | null;
  totalCost: number;
  newBalance: number;
};

export const calculateOrderSummary = (
  amount: number | null,
  currentBalance: number,
  discountRate: number | null = TOP_UP_DISCOUNT_RATE,
): TopUpOrderSummary | null => {
  if (!isValidTopUpAmount(amount)) {
    return null;
  }
  // A `null` rate means no discount is on record; a rate of 0 is a real 0% discount.
  const discount = discountRate === null ? null : amount * discountRate;
  return {
    creditAmount: amount,
    discount,
    totalCost: amount - (discount ?? 0),
    newBalance: currentBalance + amount,
  };
};
