// Card only: ACH was removed by ADR 0012 and needs a security review before it can return.
export type PaymentMethodType = 'card';

export type AddFundsFormData = {
  amount: number | null;
  paymentMethod: PaymentMethodType | null;
};

export type AddFundsState = {
  formData: AddFundsFormData;
};

export type AddFundsAction = { type: 'UPDATE_FORM_DATA'; payload: Partial<AddFundsFormData> };
