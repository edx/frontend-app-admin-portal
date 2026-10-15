export type PaymentMethodType = 'card' | 'ach';

export type AddFundsFormData = {
  amount: number | null;
  paymentMethod: PaymentMethodType | null;
};

export type AddFundsState = {
  formData: AddFundsFormData;
};

export type AddFundsAction =
  | { type: 'UPDATE_FORM_DATA'; payload: Partial<AddFundsFormData> }
  | { type: 'RESET' };
