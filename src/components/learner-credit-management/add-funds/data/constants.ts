export const ADD_FUNDS_ROUTE_SEGMENT = 'add-funds';

export const ADD_FUNDS_STEP_KEYS = {
  selectAmount: 'select-amount',
  paymentMethod: 'payment-method',
  paymentDetails: 'payment-details',
  confirmation: 'confirmation',
} as const;

export type AddFundsStepKey = typeof ADD_FUNDS_STEP_KEYS[keyof typeof ADD_FUNDS_STEP_KEYS];

/**
 * Ordered list of steps in the Add Funds flow. The stepper header, step rendering and
 * Back/Continue navigation are all driven from this list, so adding or reordering a step
 * only requires a change here (plus registering its component in `AddFundsStepper`).
 */
export const ADD_FUNDS_STEPS: readonly AddFundsStepKey[] = [
  ADD_FUNDS_STEP_KEYS.selectAmount,
  ADD_FUNDS_STEP_KEYS.paymentMethod,
  ADD_FUNDS_STEP_KEYS.paymentDetails,
  ADD_FUNDS_STEP_KEYS.confirmation,
];
