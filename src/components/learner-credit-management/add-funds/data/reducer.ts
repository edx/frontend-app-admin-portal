import { PAYMENT_METHODS } from './constants';
import type { AddFundsAction, AddFundsState } from './types';

export const initialAddFundsState: AddFundsState = {
  formData: {
    amount: null,
    customAmountInput: '',
    // Card is the only method offered, so it starts selected.
    paymentMethod: PAYMENT_METHODS.card,
  },
};

/**
 * Holds the user's selections across steps. The current step is intentionally NOT stored here;
 * it is derived from the URL (`/add-funds/:step`) so browser history, refreshes and Stripe
 * return redirects all resolve to a real step route.
 */
export const addFundsReducer = (state: AddFundsState, action: AddFundsAction): AddFundsState => {
  switch (action.type) {
    case 'UPDATE_FORM_DATA':
      return { ...state, formData: { ...state.formData, ...action.payload } };
    default:
      return state;
  }
};
