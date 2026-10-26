import React, {
  createContext, useCallback, useContext, useMemo, useReducer, useRef,
} from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { ADD_FUNDS_STEPS } from './constants';
import type { AddFundsStepKey } from './constants';
import { addFundsReducer, initialAddFundsState } from './reducer';
import type { AddFundsFormData, AddFundsState } from './types';
import { canProceedFromStep, getAddFundsStepRedirect } from './utils';

export type AddFundsContextValue = AddFundsState & {
  /** The step from the URL; `undefined` when the URL step is missing or unknown. */
  currentStepKey: AddFundsStepKey | undefined;
  currentStepIndex: number;
  /** Step the user must be sent to instead of the requested one, or `null` if it is allowed. */
  stepRedirect: AddFundsStepKey | null;
  isFirstStep: boolean;
  isLastStep: boolean;
  canProceed: boolean;
  /** Attached by `AddFundsStepHeading`; the stepper focuses it on step change. */
  stepHeadingRef: React.RefObject<HTMLHeadingElement>;
  getStepPath: (stepKey: AddFundsStepKey) => string;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  updateFormData: (payload: Partial<AddFundsFormData>) => void;
};

/** History state set by Continue, recording the step the user came from. */
const PREVIOUS_STEP_STATE_KEY = 'addFundsPreviousStep';

const AddFundsContext = createContext<AddFundsContextValue | undefined>(undefined);

export type AddFundsContextProviderProps = {
  children: React.ReactNode;
  /** Absolute path of the flow, without a step, e.g. `/{slug}/admin/learner-credit/{budgetId}/add-funds`. */
  basePath: string;
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
}: AddFundsContextProviderProps) => {
  const { step } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const [state, dispatch] = useReducer(
    addFundsReducer,
    initialAddFundsState,
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
      stepHeadingRef,
      getStepPath,
      goToNextStep: () => {
        const nextStepKey = ADD_FUNDS_STEPS[currentStepIndex + 1];
        if (nextStepKey) {
          navigate(getStepPath(nextStepKey), { state: { [PREVIOUS_STEP_STATE_KEY]: currentStepKey } });
        }
      },
      // Back pops history when the previous step is the entry right behind this one (reached via
      // Continue), so the flow never grows the history stack and leaving it from the first step
      // (which replaces the remaining entry) doesn't leave flow entries for browser Back to reopen.
      // Otherwise (deep link, refresh without history), replace the current entry.
      goToPreviousStep: () => {
        const previousStepKey = ADD_FUNDS_STEPS[currentStepIndex - 1];
        if (!previousStepKey) { return; }
        const locationState = location.state as Record<string, unknown> | null;
        if (locationState?.[PREVIOUS_STEP_STATE_KEY] === previousStepKey) {
          navigate(-1);
        } else {
          navigate(getStepPath(previousStepKey), { replace: true });
        }
      },
      updateFormData: (payload: Partial<AddFundsFormData>) => dispatch({ type: 'UPDATE_FORM_DATA', payload }),
    };
  }, [state, step, location.state, navigate, getStepPath]);

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
