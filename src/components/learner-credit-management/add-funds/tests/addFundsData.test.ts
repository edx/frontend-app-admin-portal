import {
  addFundsReducer,
  ADD_FUNDS_STEP_KEYS,
  canProceedFromStep,
  getAddFundsStepRedirect,
  initialAddFundsState,
} from '../data';

const emptyFormData = { amount: null, paymentMethod: null };

describe('addFundsReducer', () => {
  it('merges form data updates and resets', () => {
    let state = addFundsReducer(initialAddFundsState, { type: 'UPDATE_FORM_DATA', payload: { amount: 1000 } });
    state = addFundsReducer(state, { type: 'UPDATE_FORM_DATA', payload: { paymentMethod: 'card' } });
    expect(state.formData).toEqual({ amount: 1000, paymentMethod: 'card' });

    state = addFundsReducer(state, { type: 'RESET' });
    expect(state).toEqual(initialAddFundsState);
  });
});

describe('canProceedFromStep', () => {
  it.each([
    ADD_FUNDS_STEP_KEYS.selectAmount,
    ADD_FUNDS_STEP_KEYS.paymentMethod,
  ])('allows proceeding through the not-yet-implemented %s step', (stepKey) => {
    expect(canProceedFromStep(stepKey, emptyFormData)).toBe(true);
  });

  it('never allows proceeding past payment details until payment is implemented', () => {
    expect(canProceedFromStep(ADD_FUNDS_STEP_KEYS.paymentDetails, { amount: 1000, paymentMethod: 'card' })).toBe(false);
  });
});

describe('getAddFundsStepRedirect', () => {
  it.each([
    { requested: undefined, expected: ADD_FUNDS_STEP_KEYS.selectAmount },
    { requested: 'not-a-step', expected: ADD_FUNDS_STEP_KEYS.selectAmount },
    { requested: ADD_FUNDS_STEP_KEYS.selectAmount, expected: null },
    { requested: ADD_FUNDS_STEP_KEYS.paymentMethod, expected: null },
    { requested: ADD_FUNDS_STEP_KEYS.paymentDetails, expected: null },
    { requested: ADD_FUNDS_STEP_KEYS.confirmation, expected: ADD_FUNDS_STEP_KEYS.paymentDetails },
  ])('redirects "$requested" to $expected', ({ requested, expected }) => {
    expect(getAddFundsStepRedirect(requested, emptyFormData)).toEqual(expected);
  });
});
