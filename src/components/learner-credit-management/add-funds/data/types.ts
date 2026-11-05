import type { PAYMENT_METHODS } from './constants';

export type PaymentMethodType = typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS];

export type AddFundsFormData = {
  amount: number | null;
  // Raw custom input text, kept so it is restored when returning to the step.
  customAmountInput: string;
  paymentMethod: PaymentMethodType | null;
};

export type AddFundsState = {
  formData: AddFundsFormData;
};

export type AddFundsAction = { type: 'UPDATE_FORM_DATA'; payload: Partial<AddFundsFormData> };
