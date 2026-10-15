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
  && Number.isFinite(amount)
  && amount >= MIN_TOP_UP_AMOUNT
  && amount <= MAX_TOP_UP_AMOUNT
);

/**
 * Whether the user may advance past the given step. Steps that are not yet implemented
 * return `true` so the flow can be navigated end-to-end while they are being built.
 */
export const canProceedFromStep = (stepKey: AddFundsStepKey, formData: AddFundsFormData): boolean => {
  switch (stepKey) {
    case ADD_FUNDS_STEP_KEYS.selectAmount:
      return isValidTopUpAmount(formData.amount);
    case ADD_FUNDS_STEP_KEYS.paymentDetails:
      // TODO: Confirmation must only be reachable after a payment is submitted (or, on a Stripe
      // return redirect, verified against the backend by session id). Until payment is built,
      // nothing can complete this step, so Confirmation stays unreachable.
      return false;
    default:
      return true;
  }
};

/**
 * Index of the furthest step the user may currently be on: the first step whose requirements
 * are not yet met (or the last step if all are met).
 */
export const getFirstIncompleteStepIndex = (formData: AddFundsFormData): number => {
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
  discount: number;
  totalCost: number;
  newBalance: number;
};

export const calculateOrderSummary = (
  amount: number | null,
  currentBalance: number,
): TopUpOrderSummary | null => {
  if (!isValidTopUpAmount(amount)) {
    return null;
  }
  const discount = amount * TOP_UP_DISCOUNT_RATE;
  return {
    creditAmount: amount,
    discount,
    totalCost: amount - discount,
    newBalance: currentBalance + amount,
  };
};
