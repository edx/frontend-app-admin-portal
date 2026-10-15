import React, {
  createContext, useCallback, useContext, useMemo, useReducer,
} from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { ADD_FUNDS_STEPS } from './constants';
import type { AddFundsStepKey } from './constants';
import { addFundsReducer, initialAddFundsState } from './reducer';
import type { AddFundsFormData, AddFundsState } from './types';
import { canProceedFromStep, getAddFundsStepRedirect } from './utils';

export type AddFundsContextValue = AddFundsState & {
  /** The step from the URL. Only meaningful when `stepRedirect` is `null`. */
  currentStepKey: AddFundsStepKey;
  currentStepIndex: number;
  /** Step the user must be sent to instead of the requested one, or `null` if it is allowed. */
  stepRedirect: AddFundsStepKey | null;
  isFirstStep: boolean;
  isLastStep: boolean;
  canProceed: boolean;
  getStepPath: (stepKey: AddFundsStepKey) => string;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  updateFormData: (payload: Partial<AddFundsFormData>) => void;
  resetFlow: () => void;
};

const AddFundsContext = createContext<AddFundsContextValue | undefined>(undefined);

export type AddFundsContextProviderProps = {
  children: React.ReactNode;
  /** Absolute path of the flow, without a step, e.g. `/{slug}/admin/learner-credit/{budgetId}/add-funds`. */
  basePath: string;
  initialStateOverride?: Partial<AddFundsState>;
};

/**
 * State for the multi-step Add Funds (Learner Credit Top Up) flow.
 *
 * - The current step comes from the `:step` URL param, one route per step, and navigation
 *   between steps uses `navigate()`, matching frontend-app-enterprise-checkout.
 * - The user's selections live in an in-memory reducer and reset when the flow unmounts or the
 *   page reloads; never persist payment data in browser storage.
 * - Server state (budget, payment methods, quotes) belongs in react-query, not here.
 */
export const AddFundsContextProvider = ({
  children,
  basePath,
  initialStateOverride = {},
}: AddFundsContextProviderProps) => {
  const { step } = useParams();
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(
    addFundsReducer,
    { ...initialAddFundsState, ...initialStateOverride },
  );

  const getStepPath = useCallback((stepKey: AddFundsStepKey) => `${basePath}/${stepKey}`, [basePath]);

  const value = useMemo<AddFundsContextValue>(() => {
    const currentStepIndex = ADD_FUNDS_STEPS.indexOf(step as AddFundsStepKey);
    const currentStepKey = ADD_FUNDS_STEPS[currentStepIndex];
    return {
      ...state,
      currentStepKey,
      currentStepIndex,
      stepRedirect: getAddFundsStepRedirect(step, state.formData),
      isFirstStep: currentStepIndex === 0,
      isLastStep: currentStepIndex === ADD_FUNDS_STEPS.length - 1,
      canProceed: !!currentStepKey && canProceedFromStep(currentStepKey, state.formData),
      getStepPath,
      goToNextStep: () => {
        const nextStepKey = ADD_FUNDS_STEPS[currentStepIndex + 1];
        if (nextStepKey) { navigate(getStepPath(nextStepKey)); }
      },
      goToPreviousStep: () => {
        const previousStepKey = ADD_FUNDS_STEPS[currentStepIndex - 1];
        if (previousStepKey) { navigate(getStepPath(previousStepKey)); }
      },
      updateFormData: (payload: Partial<AddFundsFormData>) => dispatch({ type: 'UPDATE_FORM_DATA', payload }),
      resetFlow: () => dispatch({ type: 'RESET' }),
    };
  }, [state, step, navigate, getStepPath]);

  return (
    <AddFundsContext.Provider value={value}>
      {children}
    </AddFundsContext.Provider>
  );
};

export const useAddFunds = (): AddFundsContextValue => {
  const context = useContext(AddFundsContext);
  if (!context) {
    throw new Error('useAddFunds must be used within an AddFundsContextProvider');
  }
  return context;
};
