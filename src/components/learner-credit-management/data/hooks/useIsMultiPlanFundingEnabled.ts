import { useSelector } from 'react-redux';

import { MULTI_PLAN_FUNDING_FEATURE_FLAG } from '../constants';

type PortalConfigurationState = {
  portalConfiguration?: {
    enterpriseFeatures?: Record<string, unknown>;
  };
};

/**
 * Returns whether multi-plan learner credit funding UI is enabled for the current enterprise customer.
 * Reads the backend-controlled `enterprise_multi_plan_funding_enabled` flag (see `MULTI_PLAN_FUNDING_FEATURE_FLAG`).
 * Defaults to false when the flag is missing, so the UI stays dark until the backend turns it on.
 */
export const selectIsMultiPlanFundingEnabled = (state: PortalConfigurationState): boolean => (
  state?.portalConfiguration?.enterpriseFeatures?.[MULTI_PLAN_FUNDING_FEATURE_FLAG] === true
);

const useIsMultiPlanFundingEnabled = (): boolean => useSelector(selectIsMultiPlanFundingEnabled);

export default useIsMultiPlanFundingEnabled;
