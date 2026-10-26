import {
  addFundsReducer,
  ADD_FUNDS_STEP_KEYS,
  getAddFundsStepRedirect,
  calculateOrderSummary,
  canProceedFromStep,
  initialAddFundsState,
  isValidTopUpAmount,
} from '../data';

const { formData: emptyFormData } = initialAddFundsState;

describe('addFundsReducer', () => {
  it('merges form data updates', () => {
    let state = addFundsReducer(initialAddFundsState, { type: 'UPDATE_FORM_DATA', payload: { amount: 1000 } });
    state = addFundsReducer(state, { type: 'UPDATE_FORM_DATA', payload: { paymentMethod: 'card' } });
    expect(state.formData).toEqual({ ...emptyFormData, amount: 1000, paymentMethod: 'card' });
  });
});

describe('isValidTopUpAmount', () => {
  it.each([
    [null, false],
    [Number.NaN, false],
    [499, false],
    [500, true],
    [20000, true],
    [20001, false],
    [500.5, false],
  ])('returns the expected validity for %s', (amount, expected) => {
    expect(isValidTopUpAmount(amount)).toEqual(expected);
  });
});

describe('canProceedFromStep', () => {
  it('requires a valid amount on the select amount step', () => {
    expect(canProceedFromStep(ADD_FUNDS_STEP_KEYS.selectAmount, emptyFormData)).toBe(false);
    expect(canProceedFromStep(ADD_FUNDS_STEP_KEYS.selectAmount, { ...emptyFormData, amount: 1000 })).toBe(true);
  });

  it('allows proceeding through the not-yet-implemented payment method step', () => {
    expect(canProceedFromStep(ADD_FUNDS_STEP_KEYS.paymentMethod, emptyFormData)).toBe(true);
  });

  it('never allows proceeding past payment details until payment is implemented', () => {
    expect(canProceedFromStep(ADD_FUNDS_STEP_KEYS.paymentDetails, { ...emptyFormData, amount: 1000, paymentMethod: 'card' })).toBe(false);
  });
});

describe('getAddFundsStepRedirect', () => {
  const noAmount = emptyFormData;
  const withAmount = { ...emptyFormData, amount: 1000 };

  it.each([
    { requested: undefined, formData: noAmount, expected: ADD_FUNDS_STEP_KEYS.selectAmount },
    { requested: 'not-a-step', formData: withAmount, expected: ADD_FUNDS_STEP_KEYS.selectAmount },
    { requested: ADD_FUNDS_STEP_KEYS.selectAmount, formData: noAmount, expected: null },
    { requested: ADD_FUNDS_STEP_KEYS.paymentMethod, formData: noAmount, expected: ADD_FUNDS_STEP_KEYS.selectAmount },
    { requested: ADD_FUNDS_STEP_KEYS.paymentMethod, formData: withAmount, expected: null },
    { requested: ADD_FUNDS_STEP_KEYS.paymentDetails, formData: withAmount, expected: null },
    {
      requested: ADD_FUNDS_STEP_KEYS.confirmation,
      formData: withAmount,
      expected: ADD_FUNDS_STEP_KEYS.paymentDetails,
    },
  ])('redirects "$requested" to $expected', ({ requested, formData, expected }) => {
    expect(getAddFundsStepRedirect(requested, formData)).toEqual(expected);
  });
});

describe('calculateOrderSummary', () => {
  it('returns null without a valid amount', () => {
    expect(calculateOrderSummary(null, 1800, 0.1)).toBeNull();
  });

  it('computes discount, total cost and new balance', () => {
    expect(calculateOrderSummary(5000, 1800, 0.1)).toEqual({
      creditAmount: 5000,
      discount: 500,
      totalCost: 4500,
      newBalance: 6800,
    });
  });

  it('omits the discount when no rate is on record, and treats 0 as a real rate', () => {
    expect(calculateOrderSummary(1000, 1800, null)).toEqual({
      creditAmount: 1000,
      discount: null,
      totalCost: 1000,
      newBalance: 2800,
    });
    expect(calculateOrderSummary(1000, 1800, 0)?.discount).toEqual(0);
  });
});
